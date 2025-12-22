/**
 * API Route: Export CV Analysis to PDF
 * 
 * POST /api/export-cv-analysis
 * 
 * Uses Puppeteer to navigate to the print page and generate a PDF
 * of the AI CV analysis results.
 * 
 * Request Body:
 * {
 *   "analysisData": CVATSAnalyzeResponse object
 *   "fileName": "optional-custom-filename"
 * }
 * 
 * Response:
 * - Success: PDF file (application/pdf)
 * - Error: JSON error message
 */

import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";

// =============================================================================
// Runtime Configuration
// =============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds max

// =============================================================================
// Configuration
// =============================================================================

function getBaseUrl(): string {
    return process.env.FE_BASE_URL || "http://localhost:3000";
}

const BASE_URL = getBaseUrl();
const isDev = process.env.NODE_ENV === "development";

// =============================================================================
// Types
// =============================================================================

interface ExportAnalysisRequest {
    analysisData: any; // CVATSAnalyzeResponse
    fileName?: string;
}

// =============================================================================
// Main Export Handler
// =============================================================================

export async function POST(req: NextRequest) {
    let browser = null;
    const startTime = Date.now();

    try {
        // ========================================
        // 1. PARSE REQUEST
        // ========================================

        const body: ExportAnalysisRequest = await req.json();
        const { analysisData, fileName } = body;

        if (!analysisData) {
            return NextResponse.json(
                { error: "Analysis data is required" },
                { status: 400 }
            );
        }

        // Serialize analysis data to base64
        const dataJson = JSON.stringify(analysisData);
        const encodedData = Buffer.from(dataJson).toString('base64');

        console.log("========================================");
        console.log("🚀 CV ANALYSIS PDF EXPORT STARTED");
        console.log("========================================");
        console.log("📁 File name:", fileName || "cv-analysis.pdf");
        console.log("📊 Data size:", (dataJson.length / 1024).toFixed(2), "KB");
        console.log("🔧 Environment:", isDev ? "Development" : "Production");
        console.log("🌐 Base URL:", BASE_URL);
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
        page.setDefaultNavigationTimeout(60000); // 60 seconds

        // ========================================
        // 3. NAVIGATE TO PRINT PAGE
        // ========================================

        // Route group (print) makes this URL bypass the main app layout
        const printUrl = `${BASE_URL}/candidate/ai-cv-result/print?data=${encodeURIComponent(encodedData)}`;
        console.log("🌐 Attempting to navigate to print page");
        console.log("🔍 Print URL:", printUrl.substring(0, 100) + "...");

        try {
            await page.goto(printUrl, {
                waitUntil: "networkidle2",
                timeout: 60000,
            });

            console.log("✅ Page loaded successfully");

            const pageTitle = await page.title();
            console.log("📄 Page title:", pageTitle);

        } catch (navigationError: any) {
            console.error("❌ Navigation failed:", navigationError);
            console.error("🔍 Failed URL:", printUrl);

            throw new Error(`Failed to load print page: ${navigationError.message}`);
        }

        // ========================================
        // 4. EMULATE MEDIA TYPE & WAIT FOR RENDERING
        // ========================================

        await page.emulateMediaType("print");
        console.log("✅ Media type set to 'print'");

        // Wait for fonts to be loaded
        try {
            await page.evaluateHandle('document.fonts.ready');
            console.log("✅ All fonts loaded");
        } catch (fontError: any) {
            console.warn("⚠️  Font loading check failed (non-critical):", fontError.message);
        }

        // Wait for canvas elements (RadarChart) to render
        try {
            await page.waitForSelector('canvas', { timeout: 3000 });
            console.log("✅ Canvas elements detected");
        } catch (canvasError: any) {
            console.warn("⚠️  Canvas detection timeout (non-critical):", canvasError.message);
        }

        // Wait for content to fully render (increased for canvas rendering)
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("✅ Rendering delay completed");

        // ========================================
        // 5. GENERATE PDF
        // ========================================

        console.log("📄 Generating PDF...");

        const pdf = await page.pdf({
            format: "A4",
            //   width: '794px',        // Explicit width matching CSS container
            printBackground: true,
            preferCSSPageSize: false, // Don't override our explicit width
            margin: {
                top: "0.5in",
                right: "0.5in",
                bottom: "0.5in",
                left: "0.5in",
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
        const safeFileName = (fileName || "cv-analysis")
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "-");
        // Return PDF as response
        return new NextResponse(pdf, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${safeFileName}.pdf"`,
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
