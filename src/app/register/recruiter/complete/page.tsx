"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function RecruiterCompleteContent() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/recruiter/dashboard");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Registration Complete!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your recruiter account has been created successfully. You will be
            redirected to your dashboard shortly.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link
            href="/recruiter/dashboard"
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RecruiterCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <RecruiterCompleteContent />
    </Suspense>
  );
}
