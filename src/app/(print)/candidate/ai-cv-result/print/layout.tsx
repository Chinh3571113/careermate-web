import type { Metadata } from "next";
import "@/app/globals.css"; // Import Tailwind CSS

// Force dynamic rendering for print pages
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Print CV Analysis",
  robots: "noindex, nofollow",
};

/**
 * FULLY ISOLATED PRINT LAYOUT for AI CV Analysis
 * 
 * This layout is in a route group (print) which makes it completely 
 * independent from the main application layout hierarchy.
 * 
 * It does NOT inherit from:
 * - /app/layout.tsx
 * - /app/candidate/layout.tsx
 * 
 * ✅ NO Navbar
 * ✅ NO Footer
 * ✅ NO Sidebar
 * ✅ NO Context Providers
 * ✅ NO Headers
 * ✅ ONLY pure content for PDF export
 * 
 * Only includes:
 * - Tailwind CSS (for utility classes)
 * - Clean HTML structure for Puppeteer
 */
export default function PrintCVAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={false}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white">
        {children}
      </body>
    </html>
  );
}
