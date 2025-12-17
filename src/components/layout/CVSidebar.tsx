"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { memo, useEffect, useState } from "react";
import { PiHandWavingLight } from "react-icons/pi";
import { candidateMenuItems } from "@/lib/candidate-menu-item";
import { useAuthStore } from "@/store/use-auth-store";
import api from "@/lib/api";

type Item = {
  href: string;
  label: string;
  key: string; // dùng để so khớp/aria
  icon: React.ReactNode;
  badge?: string | number;
  enabled?: boolean;
};

interface CVSidebarProps {
  activePage?: string;
}

const CVSidebar: React.FC<CVSidebarProps> = memo(({ activePage }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [realName, setRealName] = useState<string>("");
  const [isLoadingName, setIsLoadingName] = useState(true);

  // Fetch real name from profile API
  useEffect(() => {
    const fetchRealName = async () => {
      setIsLoadingName(true);
      try {
        const response = await api.get("/api/candidates/profiles/current");
        if (response.data?.result?.fullName) {
          setRealName(response.data.result.fullName);
        }
      } catch (error) {
        console.error("Failed to fetch profile for sidebar:", error);
      } finally {
        setIsLoadingName(false);
      }
    };

    fetchRealName();
  }, []);

  // Get display name: prioritize fetched realName, then user data, or empty while loading
  const displayName = realName || user?.fullName || user?.name || user?.email?.split('@')[0] || '';

  const items: Item[] = candidateMenuItems;

  const isActive = (href: string, key: string) => {
    // Sử dụng cả pathname và activePage prop
    return (
      pathname === href ||
      pathname.startsWith(href + "/") ||
      (activePage && key === activePage)
    );
  };

  return (
    <aside className="lg:w-64 bg-white shadow-sm rounded-xl border border-gray-200 flex flex-col max-h-[calc(100vh-var(--sticky-offset,80px)-var(--content-pad,24px)*2)] overflow-hidden isolate pointer-events-auto">
      <div className="p-6 flex-shrink-0 border-b border-gray-100">
        <div className="flex items-center space-x-2 mb-1">
          <PiHandWavingLight className="w-5 h-5 text-gray-500" />
          <p className="text-xs text-gray-500">Welcome</p>
        </div>
        <div>
          {isLoadingName && !displayName ? (
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="font-medium">{displayName}</p>
          )}
        </div>
      </div>

      <nav className="space-y-1 px-3 py-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pointer-events-auto">
        {items.map((item) => {
          const active = isActive(item.href, item.key);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-md transition-colors ${
                active
                  ? "bg-gray-100 text-gray-600 font-medium"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span
                className={`shrink-0 ${
                  active ? "text-gray-600" : "text-gray-500"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-auto bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
});

CVSidebar.displayName = "CVSidebar";

export default CVSidebar;
