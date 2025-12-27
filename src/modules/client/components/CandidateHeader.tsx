"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useClientAuth } from "@/hooks/useClientAuth";
import { decodeJWT } from "@/lib/auth-admin";
import toast from "react-hot-toast";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { NotificationBell } from "@/components/notifications";
import UserTypeSelectionModal from "@/components/auth/UserTypeSelectionModal";
import { getCurrentUser } from "@/lib/user-api";

export default function CandidateHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; username?: string } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Lấy trạng thái auth đã chuẩn hoá từ hook client
  const { mounted, isAuthenticated, accessToken, role } = useClientAuth();
  const { logout, user, profile, fetchCandidateProfile } = useAuthStore();
  
  // ✅ Use profile from AuthStore (single source of truth for avatar)
  // No longer need useUserProfile hook

  // Debug log
  useEffect(() => {
    console.log('🔍 [CandidateHeader] Profile state:', {
      profileImage: profile?.image,
      profileFullName: profile?.fullName,
      userUsername: user?.username,
      userEmail: user?.email,
      userInfoName: userInfo?.name,
    });
  }, [profile, user, userInfo]);

  // Đánh dấu đã hydrate (tránh SSR mismatch)
  useEffect(() => setIsHydrated(true), []);

  // ✅ Fetch candidate profile on mount (for avatar sync)
  useEffect(() => {
    if (isAuthenticated && mounted) {
      fetchCandidateProfile();
    }
  }, [isAuthenticated, mounted, fetchCandidateProfile]);

  // Fetch current user info from API
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!accessToken || !isAuthenticated) {
        setUserInfo(null);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        console.log('📋 Current user from API (Candidate):', currentUser);
        
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

  // Đóng dropdown khi click ra ngoài / nhấn ESC
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsUserMenuOpen(false);
    };
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      setIsUserMenuOpen(false);
    } catch (error) {
      toast.error("Failed to logout");
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
    }
  };

  // Skeleton nhẹ trong lúc chưa hydrate/mounted
  if (!isHydrated || !mounted) {
    return (
      <header
        suppressHydrationWarning
        className="bg-[#1b1b20f5] text-white shadow-lg fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/general/newlogo.png"
              alt="Logo"
              width={56}
              height={56}
              className="h-14 w-auto"
            />
            <span className="text-xl font-bold">CareerMate</span>
          </Link>
          <div className="hidden lg:flex items-center space-x-6">
            <div className="h-4 w-24 bg-white/20 rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-white/20 rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-white/20 rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-white/20 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-20 bg-white/20 rounded-lg animate-pulse" />
            <div className="h-8 w-24 bg-white/20 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-[#1b1b20f5] sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
              <Image
                src="/images/general/newlogo.png"
                alt="Logo"
                width={40}
                height={40}
                className="h-8 sm:h-9 md:h-10 w-auto"
              />
              <span className="text-sm sm:text-base md:text-lg font-bold text-[#ffffff] whitespace-nowrap">
                CareerMate
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-6 flex-1 justify-center">
            <Link
              href="/jobs-detail"
              className="text-xs xl:text-sm text-[#ffffff] hover:text-[#c8c8c8] transition-colors whitespace-nowrap"
            >
              All Jobs
            </Link>
            <Link
              href="/companies"
              className="text-xs xl:text-sm text-[#ffffff] hover:text-[#c8c8c8] transition-colors whitespace-nowrap"
            >
              Companies
            </Link>
            <Link
              href="/blog"
              className="text-xs xl:text-sm text-[#ffffff] hover:text-[#c8c8c8] transition-colors whitespace-nowrap"
            >
              Blog
            </Link>
            <Link
              href="/cv-templates-introduction"
              className="text-xs xl:text-sm text-[#ffffff] hover:text-[#c8c8c8] transition-colors whitespace-nowrap"
            >
              CV Templates
            </Link>
            <Link
              href="/candidate/pricing"
              className="text-xs xl:text-sm text-[#ffffff] hover:text-[#c8c8c8] transition-colors whitespace-nowrap"
            >
              Upgrade
            </Link>
          </nav>

          {/* Right side - Auth buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {isAuthenticated && user ? (
              <>
                <span className="hidden xl:block text-gray-300 text-[11px] whitespace-nowrap">
                  For Candidate
                </span>

                <NotificationBell />

                <ProfileDropdown
                  userName={profile?.fullName || userInfo?.username || user?.username || userInfo?.name || user?.email || "User"}
                  userEmail={userInfo?.email || user?.email}
                  role={role || undefined}
                  userAvatar={profile?.image || undefined}
                />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden sm:block px-2 md:px-3 py-1.5 text-xs md:text-sm text-white hover:text-gray-300 transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-2.5 sm:px-3 md:px-4 py-1.5 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Sign Up
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 text-white hover:text-gray-300 flex-shrink-0"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-3 pb-3 space-y-1 border-t border-gray-700 pt-3">
            <Link
              href="/jobs-detail"
              className="block px-3 py-2 text-sm text-[#ffffff] hover:bg-gray-800 rounded transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              All Jobs
            </Link>
            <Link
              href="/companies"
              className="block px-3 py-2 text-sm text-[#ffffff] hover:bg-gray-800 rounded transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Companies
            </Link>
            <Link
              href="/blog"
              className="block px-3 py-2 text-sm text-[#ffffff] hover:bg-gray-800 rounded transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/cv-templates-introduction"
              className="block px-3 py-2 text-sm text-[#ffffff] hover:bg-gray-800 rounded transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              CV Templates
            </Link>
            <Link
              href="/candidate/pricing"
              className="block px-3 py-2 text-sm text-[#ffffff] hover:bg-gray-800 rounded transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Upgrade Package
            </Link>
            {!isAuthenticated && (
              <Link
                href="/sign-in"
                className="sm:hidden block px-3 py-2 text-sm text-[#ffffff] hover:bg-gray-800 rounded transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </nav>
        )}
      </div>

      {/* User Type Selection Modal */}
      <UserTypeSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </header>
  );
}
