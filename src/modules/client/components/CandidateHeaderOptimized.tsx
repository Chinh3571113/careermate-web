"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Suspense } from "react";

// Lazy load the full header with no SSR (since it uses localStorage)
const CandidateHeaderFull = dynamic(() => import("./CandidateHeaderFull"), {
  ssr: false,
  loading: () => (
    <header className="bg-[#1b1b20f5] text-[#fff] shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <Image
                src="/images/general/newlogo.png"
                alt="Logo"
                width={56}
                height={56}
                className="h-14 w-auto"
              />
              <span className="text-xl font-bold text-[#ffffff]">
                CareerMate
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-8 bg-gray-700 rounded animate-pulse"></div>
            <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  ),
});

export function CandidateHeader() {
  return (
    <Suspense
      fallback={
        <header className="bg-[#1b1b20f5] text-[#fff] shadow-lg fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <Image
                    src="/images/general/newlogo.png"
                    alt="Logo"
                    width={56}
                    height={56}
                    className="h-14 w-auto"
                  />
                  <span className="text-xl font-bold text-[#ffffff]">
                    CareerMate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
      }
    >
      <CandidateHeaderFull />
    </Suspense>
  );
}

export default CandidateHeader;
