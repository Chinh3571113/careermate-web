/**
 * Optimized PDF Renderer for Vercel Serverless
 * 
 * This module provides production-ready PDF generation with:
 * - Automatic retries for transient failures
 * - Smart timeout handling
 * - Memory-efficient browser reuse
 * - Environment-aware settings
 * - Comprehensive error handling
 */

import type { Browser, Page, PDFOptions } from "puppeteer-core";
import { getBrowser, getNavigationTimeout } from "./get-browser";

// =============================================================================
// Types
// =============================================================================

export interface RenderPDFOptions {
  /** HTML content to render (mutually exclusive with url) */
  html?: string;
  
  /** URL to navigate to (mutually exclusive with html) */
  url?: string;
  
  /** PDF generation options */
  pdfOptions?: PDFOptions;
  
  /** Custom viewport settings */
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  };
  
  /** Wait until condition before generating PDF */
  waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
  
  /** Additional wait time after page load (ms) */
  extraWaitTime?: number;
  
  /** Custom timeout for page load (ms) */
  timeout?: number;
  
  /** Enable retry on failure */
  enableRetry?: boolean;
  
  /** Maximum retry attempts */
  maxRetries?: number;
}

export interface RenderPDFResult {
  /** Generated PDF buffer */
  pdf: Buffer;
  
  /** Generation metadata */
  metadata: {
    duration: number;
    pageTitle: string;
    retries: number;
    memoryUsed?: number;
  };
}

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_PDF_OPTIONS: PDFOptions = {
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: {
    top: "0",
    right: "0",
    bottom: "0",
    left: "0",
  },
};

const DEFAULT_VIEWPORT = {
  width: 794, // A4 width in pixels at 96 DPI
  height: 1123, // A4 height in pixels at 96 DPI
  deviceScaleFactor: 1,
};

const RETRY_CONFIG = {
  DEFAULT_MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1000,
  RETRY_BACKOFF_MULTIPLIER: 2,
} as const;

// =============================================================================
// Main PDF Renderer
// =============================================================================

/**
 * Render a PDF from HTML or URL with automatic retry and error handling
 * 
 * @param options - Rendering options
 * @returns Promise<RenderPDFResult> - PDF buffer and metadata
 * 
 * @example
 * // Render from HTML
 * const result = await renderPDF({
 *   html: '<h1>Hello World</h1>',
 *   pdfOptions: { format: 'A4' }
 * });
 * 
 * @example
 * // Render from URL
 * const result = await renderPDF({
 *   url: 'https://example.com',
 *   waitUntil: 'networkidle2'
 * });
 */
export async function renderPDF(options: RenderPDFOptions): Promise<RenderPDFResult> {
  const {
    html,
    url,
    pdfOptions = {},
    viewport = DEFAULT_VIEWPORT,
    waitUntil = "networkidle2",
    extraWaitTime = 0,
    timeout = getNavigationTimeout(),
    enableRetry = true,
    maxRetries = RETRY_CONFIG.DEFAULT_MAX_RETRIES,
  } = options;
  
  // Validation
  if (!html && !url) {
    throw new Error("Either 'html' or 'url' must be provided");
  }
  
  if (html && url) {
    throw new Error("Cannot provide both 'html' and 'url'");
  }
  
  const startTime = Date.now();
  let lastError: Error | null = null;
  let retryCount = 0;
  
  // Retry loop
  while (retryCount <= maxRetries) {
    try {
      const result = await renderPDFAttempt({
        html,
        url,
        pdfOptions,
        viewport,
        waitUntil,
        extraWaitTime,
        timeout,
      });
      
      const duration = Date.now() - startTime;
      
      return {
        pdf: result.pdf,
        metadata: {
          duration,
          pageTitle: result.pageTitle,
          retries: retryCount,
          memoryUsed: result.memoryUsed,
        },
      };
      
    } catch (error: any) {
      lastError = error;
      retryCount++;
      
      if (!enableRetry || retryCount > maxRetries) {
        break;
      }
      
      // Calculate backoff delay
      const delay = RETRY_CONFIG.RETRY_DELAY_MS * Math.pow(RETRY_CONFIG.RETRY_BACKOFF_MULTIPLIER, retryCount - 1);
      
      console.warn(`⚠️ PDF render attempt ${retryCount} failed:`, error.message);
      console.log(`🔄 Retrying in ${delay}ms... (${maxRetries - retryCount + 1} attempts remaining)`);
      
      await sleep(delay);
    }
  }
  
  // All retries exhausted
  const duration = Date.now() - startTime;
  throw new Error(
    `PDF rendering failed after ${retryCount} attempts (${duration}ms):\n${lastError?.message || "Unknown error"}`
  );
}

/**
 * Single PDF render attempt (internal)
 */
async function renderPDFAttempt(options: {
  html?: string;
  url?: string;
  pdfOptions: PDFOptions;
  viewport: { width: number; height: number; deviceScaleFactor?: number };
  waitUntil: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
  extraWaitTime: number;
  timeout: number;
}): Promise<{ pdf: Buffer; pageTitle: string; memoryUsed?: number }> {
  const { html, url, pdfOptions, viewport, waitUntil, extraWaitTime, timeout } = options;
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    // Launch browser
    console.log("🌐 Launching browser...");
    browser = await getBrowser();
    
    // Create page
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport(viewport);
    console.log(`📐 Viewport set: ${viewport.width}x${viewport.height}`);
    
    // Load content
    if (html) {
      console.log("📝 Loading HTML content...");
      await page.setContent(html, {
        waitUntil,
        timeout,
      });
    } else if (url) {
      console.log(`🔗 Navigating to: ${url}`);
      await page.goto(url, {
        waitUntil,
        timeout,
      });
    }
    
    // Extra wait if specified
    if (extraWaitTime > 0) {
      console.log(`⏱️  Extra wait: ${extraWaitTime}ms`);
      await sleep(extraWaitTime);
    }
    
    // Get page title for metadata
    const pageTitle = await page.title().catch(() => "Untitled");
    
    // Generate PDF
    console.log("📄 Generating PDF...");
    const mergedPdfOptions: PDFOptions = {
      ...DEFAULT_PDF_OPTIONS,
      ...pdfOptions,
    };
    
    const pdf = await page.pdf(mergedPdfOptions);
    console.log(`✅ PDF generated: ${(pdf.length / 1024).toFixed(2)} KB`);
    
    // Get memory usage if available
    const memoryUsed = process.memoryUsage().heapUsed;
    
    return {
      pdf,
      pageTitle,
      memoryUsed,
    };
    
  } catch (error: any) {
    console.error("❌ PDF render attempt failed:", error.message);
    throw error;
    
  } finally {
    // Clean up resources
    if (page) {
      await page.close().catch((err) => {
        console.warn("⚠️ Failed to close page:", err.message);
      });
    }
    
    if (browser) {
      await browser.close().catch((err) => {
        console.warn("⚠️ Failed to close browser:", err.message);
      });
    }
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Render PDF from HTML string (convenience wrapper)
 */
export async function renderPDFFromHTML(
  html: string,
  pdfOptions?: PDFOptions
): Promise<RenderPDFResult> {
  return renderPDF({
    html,
    pdfOptions,
  });
}

/**
 * Render PDF from URL (convenience wrapper)
 */
export async function renderPDFFromURL(
  url: string,
  pdfOptions?: PDFOptions
): Promise<RenderPDFResult> {
  return renderPDF({
    url,
    pdfOptions,
  });
}

/**
 * Get memory-optimized PDF options for large documents
 */
export function getOptimizedPDFOptions(): PDFOptions {
  return {
    ...DEFAULT_PDF_OPTIONS,
    printBackground: true,
    preferCSSPageSize: true,
    // Disable features that increase memory usage
    displayHeaderFooter: false,
    omitBackground: false,
  };
}
