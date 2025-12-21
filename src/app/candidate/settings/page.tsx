"use client";

import { useState, useEffect } from "react";
import CVSidebar from "@/components/layout/CVSidebar";
import Link from "next/link";
import { useLayout } from "@/contexts/LayoutContext";
import { useAuthStore } from "@/store/use-auth-store";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/user-api";
import { fetchCurrentCandidateProfile } from "@/lib/candidate-profile-api";

const SettingsPage = () => {
  // Sử dụng context thay vì useEffect
  const { headerHeight } = useLayout();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // User data state (fetched from API)
  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const userId = user?.id;

  // Backup solution nếu context chưa hoạt động
  const [headerH, setHeaderH] = useState(headerHeight || 0);

  // Password change states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Password validation errors
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Chỉ sử dụng localStorage ở client-side
  useEffect(() => {
    // Kiểm tra nếu đang ở client-side
    if (typeof window !== 'undefined') {
      const savedHeight = localStorage.getItem("headerHeight");
      if (savedHeight && !headerHeight) {
        setHeaderH(parseInt(savedHeight));
      } else if (headerHeight) {
        setHeaderH(headerHeight);
      }
    }
  }, [headerHeight]);

  // Fetch user data from API (similar to dashboard)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch current user (for email, username, and auth type)
        const currentUser = await getCurrentUser();
        console.log('✅ Settings: User data fetched:', currentUser);
        
        if (currentUser?.email) {
          setDisplayEmail(currentUser.email);
        }
        
        // Check if user signed up with Google OAuth
        // Backend should provide this info via a field (e.g., authProvider, isOAuthUser)
        // For now, we'll try to fetch the user's password status via API
        try {
          const token = localStorage.getItem("accessToken");
          const checkResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/users/password-status`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          // Assuming backend returns { hasPassword: boolean } or { authProvider: 'GOOGLE' | 'EMAIL' }
          const hasPassword = checkResponse.data?.result?.hasPassword !== false;
          const authProvider = checkResponse.data?.result?.authProvider;
          
          setIsGoogleUser(authProvider === 'GOOGLE' || !hasPassword);
          console.log('✅ Settings: Auth type -', authProvider === 'GOOGLE' ? 'Google OAuth' : 'Email/Password');
        } catch (error) {
          // If endpoint doesn't exist, assume email/password user (backward compatibility)
          console.log('ℹ️ Settings: Could not determine auth type, assuming email/password');
          setIsGoogleUser(false);
        }
        
        // Try to fetch candidate profile (for fullName)
        try {
          const profile = await fetchCurrentCandidateProfile();
          console.log('✅ Settings: Candidate profile fetched:', profile);
          
          if (profile?.fullName) {
            setDisplayName(profile.fullName);
          } else if (currentUser?.username) {
            setDisplayName(currentUser.username);
          }
        } catch (profileError) {
          // If candidate profile fails, use username from currentUser
          console.log('ℹ️ Settings: Using username from user API');
          if (currentUser?.username) {
            setDisplayName(currentUser.username);
          }
        }
        
      } catch (error) {
        console.error("❌ Settings: Failed to fetch user data:", error);
        // Fallback to auth store
        if (user?.email) {
          setDisplayEmail(user.email);
        }
        if (user?.fullName || user?.name) {
          setDisplayName(user.fullName || user.name || '');
        }
        setIsGoogleUser(false); // Default to email/password
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Validate password function (matching sign-up validation)
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setPasswordErrors({});

    // Validation
    const errors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else {
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        errors.newPassword = passwordError;
      }
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // If there are errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/change-password/${encodeURIComponent(displayEmail)}`,
        {
          currentPassword: currentPassword,
          password: newPassword,
          repeatPassword: confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordErrors({});
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to change password";
      toast.error(errorMessage);
      
      // Handle specific error for wrong current password
      if (errorMessage.toLowerCase().includes('current password')) {
        setPasswordErrors({ currentPassword: errorMessage });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
    );

    if (!confirmDelete) return;

    const doubleConfirm = window.confirm(
      "This is your last chance. Are you absolutely sure you want to delete your account?"
    );

    if (!doubleConfirm) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Account deleted successfully. Redirecting...");
        
        // Logout and redirect
        setTimeout(() => {
          logout();
          router.push("/");
        }, 2000);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to delete account";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* GRID 2 cột: sidebar | content */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start transition-all duration-300"
          style={{
            ["--sticky-offset" as any]: `${headerH}px`, // cao header
            ["--content-pad" as any]: "24px", // vì main có py-6 = 24px
          }}
        >
          {/* Sidebar trái: sticky + ẩn mobile */}
          <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
            <CVSidebar activePage="settings" />
          </aside>

          {/* Main Content */}
          <section className="space-y-6 min-w-0 transition-all duration-300">
            {/* Account Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h1>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                  <div className="flex items-center">
                    {isLoading ? (
                      <div className="h-5 w-48 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <>
                        <span className="text-gray-900">{displayEmail || 'No email provided'}</span>
                        <div className="ml-2 text-xs text-gray-500 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          You cannot change your account email.
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name:</label>
                  <div className="flex items-center">
                    {isLoading ? (
                      <div className="h-5 w-40 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <>
                        <span className="text-gray-900">{displayName || 'No name provided'}</span>
                        <div className="ml-2 text-xs text-gray-500 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Your account name is synchronized with profile information.
                        </div>
                      </>
                    )}
                  </div>
                  {!isLoading && (
                    <Link href="/candidate/cm-profile" className="text-gray-600 hover:text-gray-800 text-sm mt-2 inline-flex items-center">
                      Update profile information
                      <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Password</h2>

              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ) : isGoogleUser ? (
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">Google Account</p>
                    <p className="text-sm text-blue-700">
                      You signed up with Google, so your account doesn&apos;t have a password. 
                      Password management is handled through your Google account.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          if (passwordErrors.currentPassword) {
                            setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter current password"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passwordErrors.newPassword) {
                            setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter new password"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
                    )}
                    {!passwordErrors.newPassword && (
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 8 characters, including uppercase, lowercase, and special character
                      </p>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordErrors.confirmPassword) {
                            setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Confirm new password"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </button>
                </form>
              )}
            </div>

            {/* Job Invitation Settings */}
            {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Job Invitation Settings</h2>
                <Link href="#" className="text-gray-600 hover:text-gray-800 text-sm inline-flex items-center">
                  Learn more
                  <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </Link>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
                  <span className="text-gray-700">Receive job invitations from employers via email, SMS and CM Inbox</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-500"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Yes</span>
                  </label>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Don't receive invitations from:</h3>
                  <p className="text-xs text-gray-500 mb-4">Maximum 5 employers</p>

                  <div className="relative mb-2">
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Search company"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">No companies selected</p>
                </div>
              </div>
            </div> */}

            {/* Delete Account */}
            <div className="bg-white rounded-xl shadow-sm border border-red-50 border-2 p-6">
              <h2 className="text-xl font-semibold text-red-600 mb-6">Delete Account</h2>

              <p className="text-gray-600 mb-6">
                Account deletion is a permanent action and cannot be undone. If you are deleting your account due to excessive email
                notifications, you can unsubscribe from emails <Link href="#" className="text-gray-600 underline">here</Link>.
              </p>

              <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 border border-red-300 rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete your account
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default SettingsPage;