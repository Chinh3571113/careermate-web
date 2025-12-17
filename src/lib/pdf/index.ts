/**
 * PDF Utilities - Production-Ready Export System
 * 
 * Optimized for Vercel Serverless Functions with:
 * - @sparticuz/chromium integration
 * - Memory-safe browser management
 * - Automatic retry logic
 * - Environment detection
 */

export { getBrowser, getBrowserTimeout, getNavigationTimeout, isServerless } from "./get-browser";

export {
  renderPDF,
  renderPDFFromHTML,
  renderPDFFromURL,
  getOptimizedPDFOptions,
  type RenderPDFOptions,
  type RenderPDFResult,
} from "./render-pdf";
