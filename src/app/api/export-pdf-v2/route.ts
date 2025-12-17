/**
 * PDF Export API Route - Optimized for Vercel Serverless
 * 
 * This route handles CV PDF generation using the optimized PDF utilities.
 * Designed to run efficiently in Vercel Lambda functions with 2048-3008MB memory.
 * 
 * Key features:
 * - Uses optimized getBrowser() and renderPDF() utilities
 * - Automatic retry logic for transient failures
 * - Proper timeout handling
 * - Memory-efficient execution
 * - Comprehensive error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { renderPDF, isServerless } from "@/lib/pdf";
import type { PDFOptions } from "puppeteer-core";

// =============================================================================
// Runtime Configuration
// =============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes (Vercel Pro limit)

// =============================================================================
// Configuration
// =============================================================================

/** Valid CV template IDs */
const VALID_TEMPLATES = [
  "classic",
  "modern",
  "professional",
  "vintage",
  "minimalist",
  "elegant",
  "polished",
] as const;

/**
 * Get base URL for the application
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const port = process.env.PORT || 3001;
  return `http://localhost:${port}`;
}

const BASE_URL = getBaseUrl();

// =============================================================================
// Types
// =============================================================================

interface ExportRequest {
  templateId: string;
  cvData: Record<string, any>;
  fileName?: string;
  userPackage?: string;
}

interface ExportResponse {
  success: boolean;
  message?: string;
  error?: string;
  metadata?: {
    templateId: string;
    fileName: string;
    duration: number;
    retries: number;
    environment: string;
  };
}

// =============================================================================
// API Handler
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  console.log("📥 PDF export request received");
  console.log("🌍 Environment:", {
    isServerless: isServerless(),
    baseUrl: BASE_URL,
    memoryLimit: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || "unknown",
  });
  
  try {
    // Parse and validate request
    const body: ExportRequest = await request.json();
    const { templateId, cvData, fileName, userPackage } = body;
    
    // Validation
    const validationError = validateRequest({ templateId, cvData, fileName });
    if (validationError) {
      console.error("❌ Validation failed:", validationError);
      return NextResponse.json<ExportResponse>(
        {
          success: false,
          error: validationError,
        },
        { status: 400 }
      );
    }
    
    console.log("✅ Request validated:", {
      templateId,
      fileName: fileName || "cv.pdf",
      userPackage: userPackage || "FREE",
      dataSize: JSON.stringify(cvData).length,
    });
    
    // Build print page URL
    const printUrl = buildPrintUrl(templateId, cvData);
    console.log("🔗 Print URL:", printUrl.substring(0, 150) + "...");
    
    // Generate PDF using optimized utilities
    console.log("🚀 Starting PDF generation...");
    const result = await renderPDF({
      url: printUrl,
      waitUntil: "networkidle2",
      extraWaitTime: 1000, // Wait 1s after page load for fonts/images
      enableRetry: true,
      maxRetries: 2,
      pdfOptions: getPDFOptions(userPackage),
    });
    
    const { pdf, metadata } = result;
    const duration = Date.now() - startTime;
    
    console.log("✅ PDF generated successfully:", {
      size: `${(pdf.length / 1024).toFixed(2)} KB`,
      duration: `${duration}ms`,
      retries: metadata.retries,
      pageTitle: metadata.pageTitle,
    });
    
    // Return PDF as response
    const finalFileName = sanitizeFileName(fileName || "cv.pdf");
    
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${finalFileName}"`,
        "Content-Length": pdf.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-PDF-Duration": duration.toString(),
        "X-PDF-Retries": metadata.retries.toString(),
      },
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("❌ PDF export failed:", error);
    console.error("📊 Error details:", {
      message: error.message,
      duration: `${duration}ms`,
      stack: error.stack?.substring(0, 500),
    });
    
    return NextResponse.json<ExportResponse>(
      {
        success: false,
        error: "PDF generation failed",
        message: isDevelopment() ? error.message : "An error occurred while generating the PDF. Please try again.",
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// Validation
// =============================================================================

function validateRequest(params: {
  templateId: string;
  cvData: any;
  fileName?: string;
}): string | null {
  const { templateId, cvData, fileName } = params;
  
  // Check template ID
  if (!templateId) {
    return "Template ID is required";
  }
  
  if (!VALID_TEMPLATES.includes(templateId as any)) {
    return `Invalid template ID. Must be one of: ${VALID_TEMPLATES.join(", ")}`;
  }
  
  // Check CV data
  if (!cvData) {
    return "CV data is required";
  }
  
  if (typeof cvData !== "object") {
    return "CV data must be a valid JSON object";
  }
  
  // Check required CV fields
  if (!cvData.personalInfo) {
    return "CV data must include personalInfo";
  }
  
  // Check file name if provided
  if (fileName && typeof fileName !== "string") {
    return "File name must be a string";
  }
  
  // Check data size (prevent DoS)
  const dataSize = JSON.stringify(cvData).length;
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (dataSize > MAX_SIZE) {
    return `CV data too large (${(dataSize / 1024 / 1024).toFixed(2)}MB). Maximum: 5MB`;
  }
  
  return null;
}

// =============================================================================
// URL Building
// =============================================================================

function buildPrintUrl(templateId: string, cvData: any): string {
  // Encode CV data as base64 to avoid URL length limits
  const encodedData = encodeURIComponent(
    Buffer.from(JSON.stringify(cvData)).toString("base64")
  );
  
  return `${BASE_URL}/candidate/cv/print/${templateId}?data=${encodedData}`;
}

// =============================================================================
// PDF Options
// =============================================================================

function getPDFOptions(userPackage?: string): PDFOptions {
  const baseOptions: PDFOptions = {
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
  
  // Premium users can get higher quality (optional)
  if (userPackage === "PREMIUM" || userPackage === "PLUS") {
    return {
      ...baseOptions,
      scale: 1.0,
    };
  }
  
  return baseOptions;
}

// =============================================================================
// Utilities
// =============================================================================

function sanitizeFileName(fileName: string): string {
  // Remove any path separators and dangerous characters
  return fileName
    .replace(/[/\\]/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 255); // Limit filename length
}

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}
