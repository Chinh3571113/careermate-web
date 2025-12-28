import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";

// ========================================
// RUNTIME CONFIGURATION
// ========================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Maximum execution time in seconds

// ========================================
// CONFIGURATION
// ========================================

// Proper base URL resolver (used by GET health check endpoint)
function getBaseUrl(): string {
  // 1. Check for explicit NEXT_PUBLIC_BASE_URL (production)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // 2. Check for VERCEL_URL (Vercel deployment)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 3. Fallback to localhost for development
  const port = process.env.PORT || 3001; // Use 3001 as default since 3000 might be taken
  return `http://localhost:${port}`;
}

// Note: POST handler now derives base URL from req.nextUrl.origin instead
const isDev = process.env.NODE_ENV === "development";

// Valid template IDs
const VALID_TEMPLATES = ['classic', 'modern', 'professional', 'vintage', 'minimalist', 'elegant', 'polished'];

// ========================================
// TYPES
// ========================================

interface ExportRequest {
  templateId: string;
  cvData: any; // CV data object to be serialized
  fileName?: string;
  userPackage?: string; // User's package (FREE, BASIC, PLUS, PREMIUM)
}

// ========================================
// MAIN EXPORT HANDLER
// ========================================

export async function POST(req: NextRequest) {
  let browser = null;
  const startTime = Date.now();
  
  // Derive base URL from incoming request instead of environment variables
  const baseUrl = req.nextUrl.origin;
  
  try {
    // ========================================
    // 1. PARSE REQUEST
    // ========================================
    
    const body: ExportRequest = await req.json();
    const { templateId, cvData, fileName, userPackage } = body;

    // Validate required fields
    if (!cvData) {
      return NextResponse.json(
        { error: "CV data is required" },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Validate template ID
    if (!VALID_TEMPLATES.includes(templateId)) {
      return NextResponse.json(
        { error: `Invalid template ID. Valid options: ${VALID_TEMPLATES.join(', ')}` },
        { status: 400 }
      );
    }

    // Serialize CV data to base64
    const cvDataJson = JSON.stringify(cvData);
    const encodedData = Buffer.from(cvDataJson).toString('base64');

    console.log("========================================");
    console.log("🚀 PDF EXPORT STARTED");
    console.log("========================================");
    console.log("🎨 Template:", templateId);
    console.log("📁 File name:", fileName || `cv.pdf`);
    console.log("📊 Data size:", (cvDataJson.length / 1024).toFixed(2), "KB");
    console.log("🔧 Environment:", isDev ? "Development" : "Production");
    console.log("🌐 Resolved Base URL (from request):", baseUrl);
    console.log("========================================");

    // ========================================
    // 2. LAUNCH BROWSER
    // ========================================
    
    try {
      if (isDev) {
        // Local development - Use full puppeteer with bundled Chromium
        const puppeteer = require("puppeteer");
        
        console.log("🔍 Using bundled Chromium from puppeteer package");

        browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            "--font-render-hinting=none",
          ],
          defaultViewport: {
            width: 794,   // A4 width at 96 DPI
            height: 1123, // A4 height at 96 DPI
            deviceScaleFactor: 1,
          },
        });
      } else {
        // Production - Use puppeteer-core + @sparticuz/chromium for serverless
        const puppeteerCore = require("puppeteer-core");
        
        console.log("🔍 Using @sparticuz/chromium for serverless environment");
        
        browser = await puppeteerCore.launch({
          args: chromium.args,
          defaultViewport: { 
            width: 794, 
            height: 1123,
            deviceScaleFactor: 1,
          },
          executablePath: await chromium.executablePath(),
          headless: true,
        });
      }

      console.log("✅ Browser launched successfully");
    } catch (launchError: any) {
      console.error("❌ Browser launch failed:", launchError);
      throw new Error(`Failed to launch browser: ${launchError.message}`);
    }

    const page = await browser.newPage();

    // Set extended navigation timeout to prevent premature failures
    page.setDefaultNavigationTimeout(60000); // 60 seconds
    console.log("✅ Navigation timeout set to 60 seconds");

    // ========================================
    // 3. NAVIGATE TO PRINT PAGE
    // ========================================
    
    // Construct absolute print URL with base64-encoded data
    // Include package param to control watermark display
    const packageParam = userPackage ? `&package=${encodeURIComponent(userPackage)}` : '';
    const printUrl = `${baseUrl}/candidate/cv/print/${templateId}?data=${encodeURIComponent(encodedData)}${packageParam}`;
    console.log("🌐 Attempting to navigate to print page");
    console.log("🔍 Base URL (from request origin):", baseUrl);
    console.log("🔍 Template:", templateId);
    console.log("🔍 User Package:", userPackage || "not specified (will show watermark)");

    try {
      // Navigate to the print page with extended timeout
      // Using networkidle2 (waits for <= 2 network connections) instead of networkidle0
      // This is more reliable and faster for pages with persistent connections
      await page.goto(printUrl, {
        waitUntil: "networkidle2", // Wait until <= 2 network connections for 500ms
        timeout: 60000, // 60 second timeout (matches default navigation timeout)
      });
      
      console.log("✅ Page loaded successfully");
      
      // Optional: Log the page title to verify content loaded
      const pageTitle = await page.title();
      console.log("📄 Page title:", pageTitle);
      
    } catch (navigationError: any) {
      console.error("❌ Navigation failed:", navigationError);
      console.error("🔍 Failed URL:", printUrl);
      console.error("🔍 Error name:", navigationError.name);
      console.error("🔍 Error message:", navigationError.message);
      
      // Try to get page content for debugging
      try {
        const content = await page.content();
        console.error("📄 Page content length:", content.length);
        if (content.length < 500) {
          console.error("📄 Page content:", content);
        }
      } catch (contentError) {
        console.error("⚠️  Could not retrieve page content");
      }
      
      throw new Error(`Failed to load print page at ${printUrl}: ${navigationError.message}`);
    }

    // ========================================
    // 4. EMULATE MEDIA TYPE & WAIT FOR FONTS
    // ========================================
    
    // Emulate screen media type for better color rendering
    // await page.emulateMediaType("screen");
    await page.emulateMediaType("print");

    console.log("✅ Media type set to 'screen'");

    // Wait for all fonts to be loaded
    try {
      await page.evaluateHandle('document.fonts.ready');
      console.log("✅ All fonts loaded");
    } catch (fontError: any) {
      console.warn("⚠️  Font loading check failed (non-critical):", fontError.message);
    }

    // Optional: Add a small delay to ensure rendering is complete
    // Note: waitForTimeout is deprecated, use delay with Promise
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("✅ Rendering delay completed");

    // ========================================
    // 5. GENERATE PDF
    // ========================================
    
    console.log("📄 Generating PDF...");
    
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,    // Include background colors and images
      preferCSSPageSize: true,  // Use CSS @page size if specified
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });

    console.log(`✅ PDF generated (${(pdf.length / 1024).toFixed(2)} KB)`);

    // ========================================
    // 6. CLEANUP & RETURN
    // ========================================
    
    await browser.close();
    console.log("✅ Browser closed");

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("========================================");
    console.log(`✅ PDF EXPORT COMPLETED in ${duration}s`);
    console.log("========================================");

    // Return PDF as response
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName || `cv`}.pdf"`,
        "Content-Length": pdf.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("========================================");
    console.error("❌ PDF EXPORT FAILED");
    console.error("========================================");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.error("========================================");

    // Cleanup browser if still open
    if (browser) {
      try {
        await browser.close();
        console.log("✅ Browser cleaned up after error");
      } catch (cleanupError) {
        console.error("❌ Browser cleanup failed:", cleanupError);
      }
    }

    return NextResponse.json(
      {
        error: "PDF generation failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ========================================
// HEALTH CHECK ENDPOINT (GET)
// ========================================

export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl();
  
  return NextResponse.json({
    status: "ok",
    service: "PDF Export API",
    baseUrl: baseUrl,
    environment: isDev ? "development" : "production",
    validTemplates: VALID_TEMPLATES,
    timestamp: new Date().toISOString(),
    config: {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "not set",
      VERCEL_URL: process.env.VERCEL_URL || "not set",
      PORT: process.env.PORT || "not set (defaulting to 3001)",
      NODE_ENV: process.env.NODE_ENV || "not set",
    },
    testUrl: `${baseUrl}/candidate/cv/print/vintage?id=test`,
  });
}
