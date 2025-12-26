"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import toast from "react-hot-toast";

export function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthFromTokens } = useAuthStore();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent duplicate execution in React StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const refreshToken = searchParams.get("refreshToken");

    if (token && email) {
      console.log("✅ [OAuth Success] Storing tokens and redirecting...");

      // Decode JWT to get expiration
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        const expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + 3600 * 1000;

        // Extract role
        const roles = decoded.scope?.split(" ") || decoded.roles || [];
        const role = roles[0] || null;

        // Store refresh token in cookie if provided
        if (refreshToken) {
          console.log("🔐 [OAuth Success] Storing refresh token in cookie");
          document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;
        }

        // Set auth state
        setAuthFromTokens({
          accessToken: token,
          tokenExpiresAt: expiresAt,
          isAuthenticated: true,
          role,
          user: {
            email,
            name: decoded.name || email,
          },
        });

        toast.success("Login successful!");

        // Redirect based on role
        if (role === "RECRUITER" || role === "ROLE_RECRUITER") {
          router.push("/recruiter");
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("❌ [OAuth Success] Error decoding token:", error);
        toast.error("Authentication error");
        router.push("/");
      }
    } else {
      console.error("❌ [OAuth Success] Missing token or email");
      toast.error("Authentication failed");
      router.push("/");
    }
  }, [searchParams, router, setAuthFromTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
