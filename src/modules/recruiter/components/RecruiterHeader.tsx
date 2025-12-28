"use client";

import { useEffect, useState, useCallback } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { useAuthStore } from "@/store/use-auth-store";
import { decodeJWT } from "@/lib/auth-admin";
import { getCurrentUser } from "@/lib/user-api";
import api from "@/lib/api";
import { NotificationBell } from "@/components/notifications";

interface RecruiterHeaderProps {
  sidebarOpen?: boolean;
}

export function RecruiterHeader({ sidebarOpen = false }: RecruiterHeaderProps) {
  const { user, isAuthenticated, accessToken, role, recruiterAvatarUrl, setRecruiterAvatarUrl } = useAuthStore();
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-open") === "true";
    }
    return sidebarOpen;
  });
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    username?: string;
  } | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  // Fetch recruiter avatar directly - more reliable than depending on auth store timing
  const fetchRecruiterAvatar = useCallback(async () => {
    if (!accessToken || !isAuthenticated) return;
    
    const isRecruiter = role?.toUpperCase().includes("RECRUITER");
    if (!isRecruiter) return;

    try {
      console.log('🔄 [RecruiterHeader] Fetching recruiter profile for avatar...');
      const response = await api.get<{ code: number; result: { avatarUrl?: string } }>('/api/recruiter/profile');
      
      if (response.data?.result?.avatarUrl) {
        console.log('✅ [RecruiterHeader] Avatar URL:', response.data.result.avatarUrl);
        setLocalAvatarUrl(response.data.result.avatarUrl);
        setRecruiterAvatarUrl(response.data.result.avatarUrl);
      }
    } catch (error) {
      console.error('❌ [RecruiterHeader] Error fetching avatar:', error);
    }
  }, [accessToken, isAuthenticated, role, setRecruiterAvatarUrl]);

  // Fetch current user info from API
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!accessToken || !isAuthenticated) {
        setUserInfo(null);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        console.log('📋 Current user from API:', currentUser);
        
        setUserInfo({
          username: currentUser.username,
          email: currentUser.email,
          name: currentUser.username || currentUser.email,
        });
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        // Fallback to JWT decode
        try {
          const decoded = decodeJWT(accessToken);
          setUserInfo({
            email: decoded?.sub || decoded?.email || "User",
            name: decoded?.name || decoded?.sub || "User",
          });
        } catch {
          setUserInfo(null);
        }
      }
    };

    fetchCurrentUser();
  }, [accessToken, isAuthenticated]);

  // Fetch recruiter avatar on mount and when auth changes
  useEffect(() => {
    // Use local state first, then try to fetch
    if (!localAvatarUrl && !recruiterAvatarUrl) {
      fetchRecruiterAvatar();
    }
  }, [localAvatarUrl, recruiterAvatarUrl, fetchRecruiterAvatar]);

  useEffect(() => {
    const checkSidebarState = () => {
      const savedState = localStorage.getItem("sidebar-open");
      const newIsOpen = savedState === "true";
      setIsOpen(newIsOpen);
    };

    // Lắng nghe hover events từ sidebar
    const handleSidebarHover = (event: CustomEvent) => {
      console.log("🎯 Header received sidebar state:", event.detail);
      setIsOpen(event.detail.isOpen);
    };

    window.addEventListener("sidebar-toggle", checkSidebarState);
    window.addEventListener(
      "sidebar-hover",
      handleSidebarHover as EventListener
    );

    // Gọi ngay 1 lần đầu tiên khi mount
    checkSidebarState();

    return () => {
      window.removeEventListener("sidebar-toggle", checkSidebarState);
      window.removeEventListener(
        "sidebar-hover",
        handleSidebarHover as EventListener
      );
    };
  }, []);

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem("sidebar-open", newState.toString());
    localStorage.setItem("sidebar-pinned", newState.toString()); // Pin when manually toggled

    // Gửi cả 2 events
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("sidebar-toggle"));
      window.dispatchEvent(
        new CustomEvent("sidebar-hover", {
          detail: { isOpen: newState, isHover: false, isPinned: newState },
        })
      );
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#1b1b20f5] text-[#ffffff] w-full">
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/10 min-w-0">
        <div className="flex items-center gap-2 md:gap-6 min-w-0 flex-shrink-0">
          {/* Nút menu */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-[#436a9d] transition-colors duration-200 flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Tiêu đề */}
          <h1 className="text-base md:text-lg font-semibold whitespace-nowrap">CareerMate</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {/* Bên phải header */}
          <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
            {isAuthenticated && user ? (
              <>
                <span className="hidden md:inline text-gray-300 hover:text-white transition-colors text-xs lg:text-sm truncate">
                  For Recruiter {userInfo?.username || userInfo?.name || "abc"}
                </span>

                  {/* Notification Bell with SSE */}
                  <NotificationBell />

                  <ProfileDropdown
                    userName={userInfo?.username || userInfo?.name || user?.email || "User"}
                    userEmail={userInfo?.email || user?.email}
                    role={role || undefined}
                    userAvatar={localAvatarUrl || recruiterAvatarUrl || undefined}
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="px-3 py-2 md:px-4 text-sm md:text-base text-white hover:text-gray-300 transition-colors whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="px-3 py-2 md:px-4 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
        </div>
      </div>
      <div className="border-b border-[#1f4171]"></div>
    </header>
  );
}
