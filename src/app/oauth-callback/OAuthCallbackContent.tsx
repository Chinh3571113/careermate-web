"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const email = searchParams.get("email");
    // Backend sends "status" but fallback to "account_status" for compatibility
    const accountStatus = searchParams.get("status") || searchParams.get("account_status");
    const accountType = searchParams.get("account_type");
    const profileCompleted = searchParams.get("profile_completed");
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    console.log("🔍 [OAuth Callback Page] Parameters:", {
      success,
      email,
      accountStatus,
      accountType,
      profileCompleted,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    const handleRecruiterFlow = async () => {
      // Check if profile is completed
      if (profileCompleted === "false") {
        // Recruiter needs to complete profile with organization info
        console.log("📝 [OAuth Callback] Recruiter profile incomplete, redirecting to complete registration");
        toast("Vui lòng điền thông tin doanh nghiệp để hoàn tất đăng ký");
        router.replace(`/auth/oauth/complete-recruiter?email=${encodeURIComponent(email || '')}`);
        return;
      }

      // If we have access token and recruiter status, check their profile
      if (accessToken && accountStatus) {
        try {
          // Fetch recruiter profile to get rejection reason - use direct API call with token
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/recruiter/my-profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch profile');
          }

          const profileResponse = await response.json();
          const profile = profileResponse.result;

          console.log("🔍 [OAuth Callback] Recruiter profile fetched:", {
            accountStatus: profile.accountStatus,
            hasRejectionReason: !!profile.rejectionReason,
          });

          // Handle REJECTED status
          if (profile.accountStatus === "REJECTED" || accountStatus.toLowerCase() === 'rejected') {
            console.error("❌ [OAuth Callback] Recruiter account rejected:", {
              accountStatus: profile.accountStatus,
              rejectionReason: profile.rejectionReason,
            });

            const message = profile.rejectionReason
              ? `Tài khoản bị từ chối: ${profile.rejectionReason}`
              : `Tài khoản của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ.`;
            toast.error(message);

            // Redirect to rejected page with reason AND tokens
            const rejectedUrl = `/auth/account-rejected?reason=${encodeURIComponent(profile.rejectionReason || 'Không có thông tin chi tiết')}&accessToken=${encodeURIComponent(accessToken)}&email=${encodeURIComponent(email || '')}${refreshToken ? `&refreshToken=${encodeURIComponent(refreshToken)}` : ''}`;
            router.replace(rejectedUrl);
            return;
          }

          // Handle PENDING status
          if (profile.accountStatus === "PENDING" || accountStatus.toLowerCase() === 'pending') {
            console.log("⏳ [OAuth Callback] Recruiter account pending approval");
            toast("Tài khoản đang chờ phê duyệt. Vui lòng chờ chúng tôi xác nhận và sẽ thông báo lại sau.");
            router.replace(`/auth/account-pending`);
            return;
          }

          // Handle ACTIVE/APPROVED status
          if (profile.accountStatus === "ACTIVE" || profile.accountStatus === "APPROVED" || accountStatus.toLowerCase() === 'active' || accountStatus.toLowerCase() === 'approved') {
            console.log("✅ [OAuth Callback] Recruiter login successful (active status)");
            toast.success("Đăng nhập thành công!");
            const successUrl = `/auth/oauth/success?token=${encodeURIComponent(accessToken)}&email=${encodeURIComponent(email || "")}${refreshToken ? `&refreshToken=${encodeURIComponent(refreshToken)}` : ""}`;
            router.replace(successUrl);
            return;
          }
        } catch (error) {
          console.error("🔴 [OAuth Callback] Error fetching recruiter profile:", error);
          // If API call fails, fall back to URL params
          if (accountStatus.toLowerCase() === 'rejected') {
            toast.error("Tài khoản của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ.");
            const rejectedUrl = `/auth/account-rejected?reason=Không thể tải thông tin chi tiết&accessToken=${encodeURIComponent(accessToken)}&email=${encodeURIComponent(email || '')}${refreshToken ? `&refreshToken=${encodeURIComponent(refreshToken)}` : ''}`;
            router.replace(rejectedUrl);
            return;
          }
        }
      }

      // Fallback handling based on URL params only
      if (accountStatus && accountStatus.toLowerCase() === 'pending') {
        console.log("⏳ [OAuth Callback] Recruiter account pending approval (fallback)");
        toast("Tài khoản đang chờ phê duyệt. Vui lòng chờ chúng tôi xác nhận và sẽ thông báo lại sau.");
        router.replace(`/auth/account-pending`);
      } else if ((accountStatus === "active" || accountStatus === "approved" || (accountStatus && accountStatus.toLowerCase() === 'active')) && accessToken) {
        console.log("✅ [OAuth Callback] Recruiter login successful (active status - fallback)");
        toast.success("Đăng nhập thành công!");
        const successUrl = `/auth/oauth/success?token=${encodeURIComponent(accessToken)}&email=${encodeURIComponent(email || "")}${refreshToken ? `&refreshToken=${encodeURIComponent(refreshToken)}` : ""}`;
        router.replace(successUrl);
      } else {
        // Other recruiter status (inactive, etc.)
        console.error("❌ [OAuth Callback] Recruiter account not active:", { accountStatus });
        toast.error(`Trạng thái tài khoản: ${accountStatus}. Vui lòng liên hệ hỗ trợ.`);
        router.replace(`/auth/oauth/error?message=${encodeURIComponent(`Account status: ${accountStatus}`)}`);
      }
    };

    if (success === "true" && accountType === "recruiter") {
      // Handle recruiter flow
      handleRecruiterFlow();
    } else if (success === "true" && accessToken) {
      // Non-recruiter (candidate) successful login
      console.log("✅ [OAuth Callback] Candidate login successful");
      toast.success("Đăng nhập thành công!");
      const successUrl = `/auth/oauth/success?token=${encodeURIComponent(accessToken)}&email=${encodeURIComponent(email || "")}${refreshToken ? `&refreshToken=${encodeURIComponent(refreshToken)}` : ""}`;
      router.replace(successUrl);
    } else {
      // Unknown or error state
      console.error("❌ [OAuth Callback] Error state:", { success, accountStatus, accountType, hasAccessToken: !!accessToken });
      toast.error("Lỗi xác thực OAuth. Vui lòng thử lại.");
      router.replace("/auth/oauth/error?message=OAuth%20callback%20error");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang xử lý xác thực OAuth...</p>
      </div>
    </div>
  );
}
