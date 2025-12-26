"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Briefcase, AlertTriangle, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { useAuthHydration } from "@/hooks/useAuthHydration";
import { safeLog, DEBUG } from "@/lib/debug-config";
import { getRoleFromToken, canAccessRecruiter, getRoleDisplayName } from "@/lib/role-utils";

interface RecruiterAuthGuardProps {
  children: ReactNode;
  redirectIfGuest?: string; // mặc định: /sign-in
  redirectIfNotRecruiter?: string; // mặc định: /
}

export default function RecruiterAuthGuard({
  children,
  redirectIfGuest = "/sign-in",
  redirectIfNotRecruiter = "/",
}: RecruiterAuthGuardProps) {
  // ✅ ALWAYS call ALL hooks at the top - unconditionally
  const [mounted, setMounted] = useState(false);
  const hasHydrated = useAuthHydration();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Compute these values consistently (not conditionally)
  const hasRecruiterRole = canAccessRecruiter(role);

  // ✅ Mount effect - must be called unconditionally
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Redirect effect - must be called unconditionally  
  useEffect(() => {
    if (!mounted || !hasHydrated || isLoading) {
      console.debug("🔍 Recruiter Guard: Still loading or not hydrated yet");
      return;
    }

    // Check localStorage after mount (client-side only)
    const storedToken = localStorage.getItem("access_token");
    const currentTokenRole = storedToken ? getRoleFromToken(storedToken) : null;

    // Debug
    console.debug("🔍 Recruiter Guard Check", {
      isAuthenticated,
      role,
      hasRecruiterRole,
      hasToken: !!accessToken,
      storedToken: storedToken ? "present" : "missing",
      roleFromToken: currentTokenRole,
    });

    // If NOT authenticated => redirect to sign-in
    if (!isAuthenticated || !accessToken) {
      console.debug(
        "🔍 Recruiter Guard: Not authenticated, redirecting to",
        redirectIfGuest
      );
      setTimeout(() => {
        router.replace(redirectIfGuest);
      }, 100);
      return;
    }

    // Check recruiter from both current state and stored state
    const hasAccess =
      hasRecruiterRole || canAccessRecruiter(currentTokenRole);

    // If authenticated but waiting for role to sync
    if (isAuthenticated && !role && currentTokenRole) {
      console.debug(
        "🔍 Recruiter Guard: Authenticated but role not synced yet, waiting..."
      );
      return;
    }

    // Only redirect if we're SURE user is not recruiter
    if (isAuthenticated && !hasAccess && !currentTokenRole) {
      console.debug(
        "🔍 Recruiter Guard: Authenticated but not recruiter/admin, redirecting to",
        redirectIfNotRecruiter
      );
      setTimeout(() => {
        router.replace(redirectIfNotRecruiter);
      }, 100);
      return;
    }

    if (hasAccess) {
      console.debug("✅ Recruiter Guard: Access granted - user is recruiter or admin");
    }
  }, [
    mounted,
    hasHydrated,
    isLoading,
    isAuthenticated,
    hasRecruiterRole,
    accessToken,
    role,
    router,
    redirectIfGuest,
    redirectIfNotRecruiter,
  ]);

  // ===== RENDER LOGIC (after all hooks) =====
  
  // Server-side or not mounted yet - show loading to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Briefcase className="h-12 w-12 mx-auto text-blue-600 mb-4" />
          <LoaderCircle className="h-8 w-8 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Now check localStorage (client-side only, after mount)
  const storedToken = localStorage.getItem("access_token");
  const tokenRole = storedToken ? getRoleFromToken(storedToken) : null;
  const hasRecruiterAccess = canAccessRecruiter(tokenRole);

  // Debug logging
  if (DEBUG.ADMIN_GUARD) {
    safeLog.authState("🔍 [RecruiterAuthGuard] Initial check", {
      hasToken: !!storedToken,
      role: tokenRole,
      hasRecruiterAccess,
    });
  }

  // Loading state
  if (!hasHydrated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Briefcase className="h-12 w-12 mx-auto text-blue-600 mb-4" />
          <LoaderCircle className="h-8 w-8 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập…</p>
        </div>
      </div>
    );
  }

  // Compute access
  const hasAccess = hasRecruiterRole || hasRecruiterAccess;

  if (DEBUG.ADMIN_GUARD) {
    safeLog.authState("🔍 [RecruiterAuthGuard] Render check", {
      hasHydrated,
      isLoading,
      isAuthenticated,
      role,
      hasRecruiterRole,
      hasToken: !!accessToken,
      tokenRole,
      hasAccess,
    });
  }

  // If we have token and recruiter role (from either source), render children
  if ((isAuthenticated && hasRecruiterRole) || (storedToken && hasAccess)) {
    if (DEBUG.ADMIN_GUARD) {
      safeLog.authState("✅ [RecruiterAuthGuard] Rendering children - access granted", {});
    }
    return <>{children}</>;
  }

  // If we're still waiting for authentication state
  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Briefcase className="h-12 w-12 mx-auto text-blue-600 mb-4" />
          <LoaderCircle className="h-8 w-8 mx-auto text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // ===== ACCESS DENIED UI =====
  // If authenticated but NO recruiter role
  if (isAuthenticated && !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600 mb-6">
            Trang này chỉ dành cho <strong>Nhà tuyển dụng</strong> và{" "}
            <strong>Quản trị viên</strong>.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Vai trò hiện tại:</strong>{" "}
              <span className="text-blue-600">{getRoleDisplayName(role)}</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </button>

          {/* Debug Info (Development Only) */}
          {process.env.NODE_ENV === "development" && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                🔍 Debug Info (Dev Only)
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono space-y-1">
                <p>
                  <strong>Authenticated:</strong>{" "}
                  {isAuthenticated ? "✅" : "❌"}
                </p>
                <p>
                  <strong>Role (Store):</strong> {role || "(none)"}
                </p>
                <p>
                  <strong>Role (Token):</strong> {tokenRole || "(none)"}{" "}
                  {hasAccess ? "✅ Has Access" : "❌ No Access"}
                </p>
                <p>
                  <strong>Token:</strong>{" "}
                  {accessToken || storedToken ? "✅ Present" : "❌ Missing"}
                </p>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  // Default loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Briefcase className="h-12 w-12 mx-auto text-blue-600 mb-4" />
        <LoaderCircle className="h-8 w-8 mx-auto animate-spin" />
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    </div>
  );
}
