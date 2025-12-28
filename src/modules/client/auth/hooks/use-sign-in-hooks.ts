import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/use-auth-store";
import { decodeJWT, ADMIN_ROLES } from "@/lib/auth-admin";
import { safeLog, DEBUG } from "@/lib/debug-config";
import { getDefaultRedirectPath, isRecruiter } from "@/lib/role-utils";
import { getMyRecruiterProfile } from "@/lib/recruiter-api";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(1, "Password is required")
    .min(2, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof formSchema>;

const useSignInHook = () => {
  const route = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((s) => s.login);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Get redirect URL from query params (set by middleware when session expired)
  const redirectUrl = searchParams.get("redirect");

  const checkIsAdmin = (token: string): boolean => {
    try {
      const decoded = decodeJWT(token);
      const roles = decoded?.scope ? [decoded.scope] : decoded?.roles || [];
      return ADMIN_ROLES.some((role) => roles.includes(role));
    } catch (error) {
      safeLog.error("Error checking admin role:", error);
      return false;
    }
  };

  const onSubmit = async (data: FormValues) => {
    // ⚠️ SECURITY: Never log email in production
    if (DEBUG.LOGIN) {
      safeLog.authState("🔵 [SIGNIN] Starting login", {
        hasEmail: !!data.email,
      });
    }

    try {
      const result = await login(data.email, data.password);

      if (DEBUG.LOGIN) {
        safeLog.authState("🔵 [SIGNIN] Login result received", {
          success: result.success,
          isAdmin: result.isAdmin,
        });
      }

      if (result.success) {
        toast.success("Login successful!");
        form.reset(); // Clear form after successful login

        // Wait a bit to ensure the store is updated
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Get the updated auth state from the store after login
        const { accessToken, user, role, isAuthenticated } =
          useAuthStore.getState();

        if (DEBUG.LOGIN) {
          safeLog.authState("🔵 [SIGNIN] Updated store state", {
            hasToken: !!accessToken,
            isAuth: isAuthenticated,
            hasUser: !!user,
            role,
            tokenLength: accessToken?.length || 0,
          });
        }

        if (accessToken) {
          // ⚠️ SECURITY: Never log token or decoded payload
          // OLD: console.log("🔵 [SIGNIN] Token payload:", tokenPayload);

          // Check admin status with the new token
          const isAdmin = checkIsAdmin(accessToken);

          if (DEBUG.LOGIN) {
            safeLog.authState("🔵 [SIGNIN] Admin check", {
              isAdmin,
              roleFromStore: role,
            });
          }

          // Check if user is recruiter and verify account status
          if (role === "RECRUITER" || role === "ROLE_RECRUITER") {
            try {
              const profileResponse = await getMyRecruiterProfile();
              const profile = profileResponse.result;

              if (DEBUG.LOGIN) {
                safeLog.authState("🔵 [SIGNIN] Recruiter profile fetched", {
                  accountStatus: profile.accountStatus,
                  hasRejectionReason: !!profile.rejectionReason,
                });
              }

              // Handle REJECTED status
              if (profile.accountStatus === "REJECTED") {
                toast.error(
                  profile.rejectionReason 
                    ? `Tài khoản bị từ chối: ${profile.rejectionReason}`
                    : "Tài khoản của bạn đã bị từ chối"
                );
                
                // Keep auth token (don't clear) and redirect to rejected page so user can resubmit
                setTimeout(() => {
                  const rejectionReason = encodeURIComponent(profile.rejectionReason || '');
                  window.location.href = `/auth/account-rejected?reason=${rejectionReason}`;
                }, 500);
                return;
              }

              // Handle PENDING status
              if (profile.accountStatus === "PENDING") {
                toast("Tài khoản đang chờ phê duyệt. Vui lòng chờ chúng tôi xác nhận và sẽ thông báo lại sau.");
                
                // Redirect to pending page
                setTimeout(() => {
                  window.location.href = "/auth/account-pending";
                }, 500);
                return;
              }

              // If status is APPROVED or ACTIVE, continue with normal flow
              if (profile.accountStatus === "APPROVED" || profile.accountStatus === "ACTIVE") {
                if (DEBUG.LOGIN) {
                  safeLog.authState("✅ [SIGNIN] Recruiter account is active", {
                    status: profile.accountStatus,
                  });
                }
              }
            } catch (error) {
              // If we can't fetch profile, log error but continue
              safeLog.error("🔴 [SIGNIN] Error fetching recruiter profile:", error);
              // Don't block login if profile fetch fails
            }
          }

          // Determine redirect path:
          // 1. Use redirect URL from query params if available (session expired redirect)
          // 2. Otherwise use role-based default path
          const defaultPath = getDefaultRedirectPath(role);
          const redirectPath = redirectUrl || defaultPath;

          // Use multiple redirect methods for reliability
          // Wait longer to ensure state is fully updated
          setTimeout(() => {
            if (DEBUG.LOGIN) {
              safeLog.authState("🟢 [SIGNIN] Redirecting after login", {
                role,
                redirectPath,
                hadRedirectParam: !!redirectUrl,
              });
            }

            // Use window.location for more reliable navigation
            window.location.href = redirectPath;
          }, 500); // Increased delay to ensure state sync
        } else {
          const error = new Error("No access token found after login");
          safeLog.error("🔴 [SIGNIN] No access token found after login", error);
          // toast.error("Login failed - no token received"); // Hidden - internal error
          route.push("/");
        }
      } else {
        if (DEBUG.LOGIN) {
          safeLog.authState("🔴 [SIGNIN] Login failed", {});
        }
        toast.error("Invalid credentials");
      }
    } catch (err: any) {
      safeLog.error("🔴 [SIGNIN] Login error:", err);
      // Extract the actual error message for the toast
      const errorMessage =
        err?.message || err?.response?.data?.message || "Login failed";
      toast.error(errorMessage);
    }
  };

  const clearForm = () => {
    form.reset({ email: "", password: "" });
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return { onSubmit, form, showPassword, togglePasswordVisibility, clearForm };
};

export default useSignInHook;
