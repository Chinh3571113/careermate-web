"use client";

import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";

/**
 * Client-only providers that should not block server rendering
 * Lazy loaded to reduce initial bundle size
 */
export function ClientProviders() {
  // Only load Vercel Analytics when actually on Vercel
  const isVercel = process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined;
  
  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
      {isVercel && <Analytics />}
    </>
  );
}
