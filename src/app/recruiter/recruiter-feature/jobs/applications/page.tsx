"use client";

import { Suspense } from "react";
import { ApplicationsContent } from "./ApplicationsContent";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
    </div>
  );
}

export default function CandidateApplicationsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ApplicationsContent />
    </Suspense>
  );
}
