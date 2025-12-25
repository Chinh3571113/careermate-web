"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X, User, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useClientAuth } from "@/hooks/useClientAuth";
import { decodeJWT } from "@/lib/auth-admin";
import toast from "react-hot-toast";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import UserTypeSelectionModal from "@/components/auth/UserTypeSelectionModal";
import { getCurrentUser } from "@/lib/user-api";


export default function ClientHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    username?: string;
  } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Auth state (hook đã chuẩn hoá role nếu bạn theo code trước đó)
  const { mounted, isAuthenticated, accessToken, role } = useClientAuth();
  const { logout, user, isLoading, profile, fetchCandidateProfile } = useAuthStore();
  
  // ✅ Use profile from AuthStore (single source of truth for avatar)
  // No longer need useUserProfile hook - everything from AuthStore now

  // Debug log
  console.log("🔍 ClientHeader State:", {
    mounted,
    isAuthenticated,
    hasAccessToken: !!accessToken,
    role,
    hasUser: !!user,
    userName: user?.name,
    userEmail: user?.email,
    profileImage: profile?.image, // ✅ Debug avatar from profile
  });

  // Phòng trường hợp role trả về format khác, chuẩn hoá nhẹ tại đây
  const normalizedRole = role?.includes("CANDIDATE")
    ? "ROLE_CANDIDATE"
    : role?.includes("RECRUITER")
    ? "ROLE_RECRUITER"
    : role?.includes("ADMIN")
    ? "ROLE_ADMIN"
    : "ROLE_USER";

  const isCandidate = normalizedRole === "ROLE_CANDIDATE";
  const isRecruiter = normalizedRole === "ROLE_RECRUITER";

  // Mark hydrated để tránh SSR mismatch
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
        console.log('📋 Current user from API (ClientHeader):', currentUser);
        
        setUserInfo({
          username: currentUser.username,
          email: currentUser.email,
          name: currentUser.username || currentUser.email,
        });

        // Update store user if not set
        if (!user && currentUser) {
          useAuthStore.setState({
            user: {
              id: currentUser.email,
              email: currentUser.email,
              name: currentUser.username || currentUser.email,
              username: currentUser.username,
            },
          });
        }
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
    const onClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
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
      console.error("Logout error:", error);
    }
  };

  // Skeleton trong lúc chưa hydrate/mounted
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
              priority
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
    <header className="h-14 lg:h-16 bg-neutral-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Mobile Menu Button + Logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger Button - Only on mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/images/general/newlogo.png"
              alt="Logo"
              width={40}
              height={40}
              className="h-8 lg:h-10 w-auto"
              priority
            />
            <span className="text-lg lg:text-xl font-bold text-white whitespace-nowrap">
              CareerMate
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Only show on desktop */}
        <nav className="hidden lg:flex items-center gap-6 text-sm text-gray-300">
          <Link
            href="/jobs-detail"
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            All Jobs
          </Link>
          <Link
            href="/companies"
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Companies
          </Link>
          <Link
            href="/cv-templates"
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            CV Templates
          </Link>
          <Link
            href="/blog"
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Blog
          </Link>
        </nav>

        {/* Right side - Bell + Avatar / Auth buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isAuthenticated && user ? (
            <ProfileDropdown
              userName={profile?.fullName || userInfo?.username || user?.username || userInfo?.name || "User"}
              userEmail={userInfo?.email || user?.email}
              role={role || undefined}
              userAvatar={profile?.image || undefined}
            />
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-3 lg:px-4 py-2 text-white hover:text-gray-300 transition-colors text-sm whitespace-nowrap"
              >
                Sign In
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-neutral-800 border-t border-gray-700">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
            <Link
              href="/jobs-detail"
              className="text-gray-300 hover:text-white transition-colors py-2 text-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              All Jobs
            </Link>
            <Link
              href="/companies"
              className="text-gray-300 hover:text-white transition-colors py-2 text-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Companies
            </Link>
            <Link
              href="/cv-templates"
              className="text-gray-300 hover:text-white transition-colors py-2 text-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              CV Templates
            </Link>
            <Link
              href="/blog"
              className="text-gray-300 hover:text-white transition-colors py-2 text-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </Link>
          </nav>
        </div>
      )}

      {/* User Type Selection Modal */}
      <UserTypeSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </header>
  );
}