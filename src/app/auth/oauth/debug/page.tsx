"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OAuthDebugContent() {
  const searchParams = useSearchParams();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">OAuth Debug</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">URL Parameters</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function OAuthDebugPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <OAuthDebugContent />
    </Suspense>
  );
}
