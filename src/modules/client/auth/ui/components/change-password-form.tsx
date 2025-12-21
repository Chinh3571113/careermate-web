"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChangePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email");

  const [formData, setFormData] = useState({
    email: emailFromUrl || "",
    password: "",
    repeatPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    repeatPassword: "",
  });

  // Password validation regex (matching sign-up)
  const validatePassword = (password: string): string => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must include at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must include at least one lowercase letter";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must include at least one special character";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({
      email: "",
      password: "",
      repeatPassword: "",
    });

    // Validate email
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      toast.error("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setErrors((prev) => ({ ...prev, password: passwordError }));
      toast.error(passwordError);
      return;
    }

    // Validate repeat password
    if (!formData.repeatPassword) {
      setErrors((prev) => ({ ...prev, repeatPassword: "Please confirm your password" }));
      toast.error("Please confirm your password");
      return;
    }

    if (formData.password !== formData.repeatPassword) {
      setErrors((prev) => ({ ...prev, repeatPassword: "Passwords do not match" }));
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Gọi API change password with email in URL
      await api.put(
        `/api/users/change-password/${encodeURIComponent(formData.email)}`,
        {
          password: formData.password,
          repeatPassword: formData.repeatPassword,
        }
      );

      toast.success("Password changed successfully!");

      // Redirect về login sau 2 giây
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    } catch (error: any) {
      console.error("Change password error:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="py-16 md:py-20 lg:py-24">
        <div className="container">
          <div className={cn("-mx-4 flex flex-wrap", className)} {...props}>
            <div className="w-full px-4">
              <div className="shadow-three dark:bg-dark mx-auto max-w-[500px] rounded-sm bg-white px-6 py-10 sm:p-[60px]">
                <h3 className="mb-3 text-center text-2xl font-bold text-black sm:text-3xl dark:text-white">
                  Reset Your Password
                </h3>
                <p className="text-body-color mb-11 text-center text-base font-medium">
                  Enter your new password to reset your account.
                </p>

                <form onSubmit={handleSubmit}>
                  {/* Email */}
                  <div className="mb-8">
                    <label
                      className="text-dark mb-3 block text-sm dark:text-white"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      className={cn(
                        "border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none",
                        errors.email && "border-destructive focus:border-destructive"
                      )}
                      placeholder="Enter your email"
                      autoComplete="email"
                      disabled={loading}
                      required
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="mb-8">
                    <label
                      className="text-dark mb-3 block text-sm dark:text-white"
                      htmlFor="password"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        className={cn(
                          "border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none",
                          errors.password && "border-destructive focus:border-destructive"
                        )}
                        placeholder="Enter your new password"
                        autoComplete="new-password"
                        disabled={loading}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="group absolute top-1/2 right-0 h-full -translate-y-1/2 px-3 py-2 hover:cursor-pointer hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="text-muted-foreground size-5 group-hover:text-blue-600" />
                        ) : (
                          <Eye className="text-muted-foreground size-5 group-hover:text-blue-600" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-destructive">{errors.password}</p>
                    )}
                    <p className="text-body-color mt-2 text-xs">
                      Password must be at least 8 characters and include uppercase, lowercase, and special characters.
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-8">
                    <label
                      className="text-dark mb-3 block text-sm dark:text-white"
                      htmlFor="repeatPassword"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        id="repeatPassword"
                        type={showRepeatPassword ? "text" : "password"}
                        value={formData.repeatPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, repeatPassword: e.target.value });
                          setErrors((prev) => ({ ...prev, repeatPassword: "" }));
                        }}
                        className={cn(
                          "border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none",
                          errors.repeatPassword && "border-destructive focus:border-destructive"
                        )}
                        placeholder="Confirm your new password"
                        autoComplete="new-password"
                        disabled={loading}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="group absolute top-1/2 right-0 h-full -translate-y-1/2 px-3 py-2 hover:cursor-pointer hover:bg-transparent"
                        onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                        disabled={loading}
                      >
                        {showRepeatPassword ? (
                          <EyeOff className="text-muted-foreground size-5 group-hover:text-blue-600" />
                        ) : (
                          <Eye className="text-muted-foreground size-5 group-hover:text-blue-600" />
                        )}
                      </Button>
                    </div>
                    {errors.repeatPassword && (
                      <p className="mt-1 text-sm text-destructive">{errors.repeatPassword}</p>
                    )}
                  </div>

                  <div className="mb-6">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="shadow-submit dark:shadow-submit-dark bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-xs px-9 py-4 text-base font-medium text-white duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Changing Password..." : "Change Password"}
                    </Button>
                  </div>
                </form>

                <p className="text-body-color text-center text-base font-medium">
                  Remember your password?{" "}
                  <Link href="/sign-in" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 z-[-1]">
          <svg
            width="1440"
            height="969"
            viewBox="0 0 1440 969"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <mask
              id="mask0_95:1005"
              style={{ maskType: "alpha" }}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1440"
              height="969"
            >
              <rect width="1440" height="969" fill="#090E34" />
            </mask>
            <g mask="url(#mask0_95:1005)">
              <path
                opacity="0.1"
                d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
                fill="url(#paint0_linear_95:1005)"
              />
              <path
                opacity="0.1"
                d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
                fill="url(#paint1_linear_95:1005)"
              />
            </g>
            <defs>
              <linearGradient
                id="paint0_linear_95:1005"
                x1="1178.4"
                y1="151.853"
                x2="780.959"
                y2="453.581"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_95:1005"
                x1="160.5"
                y1="220"
                x2="1099.45"
                y2="1192.04"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>
    </>
  );
}
