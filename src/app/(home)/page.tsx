"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientHomePage } from "@/modules/client/components";
import { useAuthStore } from "@/store/use-auth-store";
import { getRoleFromToken } from "@/lib/role-utils";
import { LoaderCircle } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Check localStorage for token and role
    const storedToken = localStorage.getItem("access_token");
    const tokenRole = storedToken ? getRoleFromToken(storedToken) : null;
    
    // Determine effective role from store or token
    const effectiveRole = role || tokenRole;
    
    // Redirect based on role
    if (effectiveRole) {
      const normalizedRole = effectiveRole.replace("ROLE_", "").toUpperCase();
      
      if (normalizedRole === "ADMIN") {
        console.log("🏠 Home: Admin detected, redirecting to admin dashboard");
        router.replace("/admin");
        return;
      }
      
      if (normalizedRole === "RECRUITER") {
        console.log("🏠 Home: Recruiter detected, redirecting to recruiter home");
        router.replace("/recruiter");
        return;
      }
    }
    
    // No redirect needed - show candidate home
    setChecking(false);
  }, [role, isAuthenticated, router]);

  // Show loading while checking role
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <ClientHomePage />
    </>
  );
}
