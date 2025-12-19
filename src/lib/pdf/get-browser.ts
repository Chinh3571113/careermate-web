/**
 * Optimized Browser Launcher for Vercel Serverless
 * 
 * This module provides a memory-safe, production-ready Puppeteer browser
 * instance that works perfectly in Vercel Lambda functions (2048-3008MB).
 * 
 * Key optimizations:
 * - Uses @sparticuz/chromium for serverless environments
 * - Implements aggressive memory flags for Lambda constraints
 * - Module-level imports for cold start performance
 * - Environment-aware configuration
 */

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import type { Browser, PuppeteerLaunchOptions } from "puppeteer-core";

// =============================================================================
// Configuration
// =============================================================================

/**
 * Memory-safe Chrome flags optimized for Vercel Lambda
 * These flags minimize memory usage and prevent crashes in constrained environments
 */
const SERVERLESS_CHROME_FLAGS = [
  // Core memory optimizations
  "--single-process", // Run in single process (critical for Lambda)
  "--disable-gpu", // No GPU in serverless
  "--disable-dev-shm-usage", // Use /tmp instead of /dev/shm (Lambda limitation)
  "--no-zygote", // Disable zygote process forking
  "--disable-setuid-sandbox", // Disable sandbox (Lambda security model)
  
  // Additional stability flags
  "--no-sandbox", // Required for Lambda environment
  "--disable-accelerated-2d-canvas", // Reduce memory usage
  "--disable-web-security", // Allow CORS for internal requests
  "--hide-scrollbars", // Reduce rendering overhead
  "--disable-background-timer-throttling", // Prevent timeouts
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  
  // Performance optimizations
  "--disable-features=IsolateOrigins,site-per-process", // Reduce process overhead
  "--disable-site-isolation-trials",
  
  // Lambda-specific
  "--no-first-run", // Skip first run tasks
  "--disable-infobars",
  "--window-position=0,0",
  "--ignore-certificate-errors",
  "--ignore-certificate-errors-spki-list",
];

/**
 * Timeout configurations (in milliseconds)
 */
const TIMEOUTS = {
  LOCAL_LAUNCH: 30000, // 30s for local development
  SERVERLESS_LAUNCH: 60000, // 60s for cold starts on Lambda
  PAGE_NAVIGATION: 30000, // 30s for page loads
} as const;

// =============================================================================
// Browser Launcher
// =============================================================================

/**
 * Get an optimized Puppeteer browser instance
 * 
 * Automatically detects environment:
 * - Local: Uses system Chrome/Chromium
 * - Vercel: Uses @sparticuz/chromium with Lambda optimizations
 * 
 * @returns Promise<Browser> - Ready-to-use Puppeteer browser
 * 
 * @example
 * const browser = await getBrowser();
 * try {
 *   const page = await browser.newPage();
 *   // ... use page
 * } finally {
 *   await browser.close();
 * }
 */
export async function getBrowser(): Promise<Browser> {
  const isLocal = !process.env.VERCEL && process.env.NODE_ENV === "development";
  
  if (isLocal) {
    return await launchLocalBrowser();
  }
  
  return await launchServerlessBrowser();
}

/**
 * Launch browser for local development
 * Uses system-installed Chrome/Chromium
 */
async function launchLocalBrowser(): Promise<Browser> {
  console.log("🚀 Launching local browser...");
  
  const launchOptions: PuppeteerLaunchOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
    timeout: TIMEOUTS.LOCAL_LAUNCH,
  };
  
  // Try puppeteer's bundled Chromium first (if available)
  try {
    const puppeteerFull = await import("puppeteer");
    const browser = await puppeteerFull.default.launch(launchOptions);
    console.log("✅ Local browser launched (puppeteer)");
    return browser as unknown as Browser;
  } catch (error) {
    // Fallback to puppeteer-core with system Chrome
    console.log("⚠️ Puppeteer not found, using system Chrome...");
    const browser = await puppeteer.launch(launchOptions);
    console.log("✅ Local browser launched (system Chrome)");
    return browser;
  }
}

/**
 * Launch browser for Vercel serverless environment
 * Uses @sparticuz/chromium with aggressive memory optimizations
 */
async function launchServerlessBrowser(): Promise<Browser> {
  console.log("🚀 Launching serverless browser (Vercel Lambda)...");
  
  try {
    // Configure font loading (optional, for emoji support)
    await chromium.font(
      "https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf"
    ).catch((err) => {
      console.warn("⚠️ Font loading failed (non-critical):", err.message);
    });
    
    // Get executable path
    const executablePath = await chromium.executablePath();
    console.log("📂 Chromium executable:", executablePath.substring(0, 80) + "...");
    
    // Verify executable exists
    const fs = await import("fs");
    if (!fs.existsSync(executablePath)) {
      throw new Error(
        `Chromium executable not found at: ${executablePath}\n` +
        `Ensure next.config.ts has outputFileTracingIncludes configured.`
      );
    }
    
    // Launch with optimized settings
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args, // Base serverless args from @sparticuz/chromium
        ...SERVERLESS_CHROME_FLAGS, // Our additional optimizations
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      timeout: TIMEOUTS.SERVERLESS_LAUNCH,
    });
    
    console.log("✅ Serverless browser launched successfully");
    console.log(`📊 Memory flags: ${SERVERLESS_CHROME_FLAGS.length} optimizations applied`);
    
    return browser;
    
  } catch (error: any) {
    console.error("❌ Failed to launch serverless browser:", error.message);
    console.error("📁 Environment:", {
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: process.env.AWS_REGION,
      LAMBDA_TASK_ROOT: process.env.LAMBDA_TASK_ROOT,
    });
    
    throw new Error(
      `Serverless browser launch failed: ${error.message}\n\n` +
      `Common fixes:\n` +
      `1. Verify @sparticuz/chromium is in dependencies\n` +
      `2. Check next.config.ts outputFileTracingIncludes\n` +
      `3. Ensure vercel.json sets adequate memory (3008MB)\n` +
      `4. Check Vercel function logs for details`
    );
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get browser launch timeout based on environment
 */
export function getBrowserTimeout(): number {
  const isLocal = !process.env.VERCEL && process.env.NODE_ENV === "development";
  return isLocal ? TIMEOUTS.LOCAL_LAUNCH : TIMEOUTS.SERVERLESS_LAUNCH;
}

/**
 * Get page navigation timeout
 */
export function getNavigationTimeout(): number {
  return TIMEOUTS.PAGE_NAVIGATION;
}

/**
 * Check if running in serverless environment
 */
export function isServerless(): boolean {
  return !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}
