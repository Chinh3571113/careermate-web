"use client";

import { useEffect, useState } from "react";
import { Link, Menu } from "lucide-react";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { useAuthStore } from "@/store/use-auth-store";
import { decodeJWT } from "@/lib/auth-admin";
import { getCurrentUser } from "@/lib/user-api";
import { useUserProfile } from "@/hooks/useUserProfile";

interface RecruiterHeaderProps {
  sidebarOpen?: boolean;
}

export function RecruiterHeader({ sidebarOpen = false }: RecruiterHeaderProps) {
  const { user } = useAuthStore();
  const { isAuthenticated, accessToken, logout, role } = useAuthStore();
  const { avatarUrl } = useUserProfile();
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
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-6">
          {/* Nút menu */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-[#436a9d] transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Tiêu đề */}
          <h1 className="text-lg font-semibold">CareerMate</h1>
        </div>
        <div className="flex items-center gap-4">
          

          {/* Bên phải header */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  <span className="sm:block text-gray-300 hover:text-white transition-colors hidden text-xs md:inline">
                    For Recruiter {userInfo?.username || userInfo?.name || "abc"}
                  </span>

                  <ProfileDropdown
                    userName={userInfo?.username || userInfo?.name || user?.email || "User"}
                    userEmail={userInfo?.email || user?.email}
                    role={role || undefined}
                    userAvatar={avatarUrl || undefined}
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="px-4 py-2 text-white hover:text-gray-300 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
