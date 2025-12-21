"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import useSignInHook from "@/modules/client/auth/hooks/use-sign-in-hooks";
import Link from "next/link";
import React from "react";
import GoogleOAuthSignInButton from "@/components/auth/GoogleOAuthSignInButton";

export default function SignInForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { form, onSubmit, showPassword, togglePasswordVisibility } =
    useSignInHook();
  
  const isSubmitting = form.formState.isSubmitting;
  return (
    <>
      <section className="py-16 md:py-20 lg:py-24">
        <div className="container">
          <div className={cn("-mx-4 flex flex-wrap", className)} {...props}>
            <div className="w-full px-4">
              <div className="shadow-three dark:bg-dark mx-auto max-w-[500px] rounded-sm bg-white px-6 py-10 sm:p-[60px]">
                <h3 className="mb-3 text-center text-2xl font-bold text-black sm:text-3xl dark:text-white">
                  Sign in to your account
                </h3>
                <p className="text-body-color mb-11 text-center text-base font-medium">
                  Login to your account for a faster checkout.
                </p>
                <GoogleOAuthSignInButton label="Sign in with Google" />
                <div className="mb-8 flex items-center justify-center">
                  <span className="bg-body-color/50 hidden h-[1px] w-full max-w-[70px] sm:block"></span>
                  <p className="text-body-color w-full px-5 text-center text-base font-medium">
                    Or, sign in with your email
                  </p>
                  <span className="bg-body-color/50 hidden h-[1px] w-full max-w-[70px] sm:block"></span>
                </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="mb-8">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel
                              className="text-dark mb-3 block text-sm dark:text-white"
                              htmlFor="email"
                            >
                              Email
                            </FormLabel>
                            <FormControl data-slot="form-control">
                              <Input
                                id="email"
                                type="email"
                                className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                                placeholder="Enter your email"
                                autoComplete="email"
                                disabled={isSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Password field */}
                    <div className="mb-8">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel
                              className="text-dark mb-3 block text-sm dark:text-white"
                              htmlFor="password"
                            >
                              Password
                            </FormLabel>
                            <FormControl data-slot="form-control">
                              <div className="relative">
                                <Input
                                  id="password"
                                  type={showPassword ? "text" : "password"}
                                  className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                                  placeholder="Enter your password"
                                  autoComplete="current-password"
                                  disabled={isSubmitting}
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="group absolute top-1/2 right-0 h-full -translate-y-1/2 px-3 py-2 hover:cursor-pointer hover:bg-transparent"
                                  onClick={togglePasswordVisibility}
                                  disabled={isSubmitting}
                                >
                                  {showPassword ? (
                                    <EyeOff className="text-muted-foreground size-5 group-hover:text-blue-600" />
                                  ) : (
                                    <Eye className="text-muted-foreground size-5 group-hover:text-blue-600" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Keep me */}
                    <div className="mb-8 flex flex-col justify-between sm:flex-row sm:items-center">
                      <div className="mb-4 sm:mb-0">
                        <label
                          htmlFor="checkboxLabel"
                          className="text-body-color flex cursor-pointer items-center text-sm font-medium select-none"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              id="checkboxLabel"
                              className="sr-only"
                            />
                            <div className="box border-body-color/20 mr-4 flex h-5 w-5 items-center justify-center rounded-sm border dark:border-white/10">
                              <span className="opacity-0">
                                <svg
                                  width="11"
                                  height="8"
                                  viewBox="0 0 11 8"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                                    fill="#3056D3"
                                    stroke="#3056D3"
                                    strokeWidth="0.4"
                                  />
                                </svg>
                              </span>
                            </div>
                          </div>
                          Keep me signed in
                        </label>
                      </div>
                      <div>
                        <Link
                          href="/change-password"
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          Forgot Password?
                        </Link>
                      </div>
                    </div>
                    <div className="mb-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="shadow-submit dark:shadow-submit-dark bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-xs px-9 py-4 text-base font-medium text-white duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmitting ? "Signing in..." : "Sign in"}
                      </Button>
                    </div>
                  </form>
                </Form>
                <p className="text-body-color text-center text-base font-medium">
                  Don’t you have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="text-primary hover:underline"
                  >
                    Sign up
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
