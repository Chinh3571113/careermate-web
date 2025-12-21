"use client";
import { usePathname } from "next/navigation";
import React from "react";

export default function HomeBg({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isHome = pathname === "/";

  return (
    <div className={`${isHome ? "bg-[#f9fafb]" : "bg-transparent"} min-h-screen flex flex-col`}>
      {children}
    </div>
  );
}
