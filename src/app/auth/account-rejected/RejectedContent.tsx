"use client";

import { XCircle, ArrowLeft, AlertTriangle, RefreshCw, Home, Building2, FileText, Phone, MapPin, Globe, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import OrganizationUpdateForm from "@/components/auth/OrganizationUpdateForm";
import { useAuthStore } from "@/store/use-auth-store";

export function RejectedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const setAuthFromTokens = useAuthStore((s) => s.setAuthFromTokens);
  const { accessToken: storedToken } = useAuthStore();

  useEffect(() => {
    // Lấy lý do từ query params và decode URL encoding
    const reason = searchParams.get("reason");
    setRejectionReason(reason ? decodeURIComponent(reason) : "Không có thông tin chi tiết");

    // Lấy tokens từ URL params (nếu có) và lưu vào auth store
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && !storedToken) {
      console.log("🔑 [Account Rejected] Saving tokens to auth store from URL params");

      // Decode JWT to get expiration
      try {
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);

        const expiresAt = payload.exp * 1000; // Convert to milliseconds

        // Save to localStorage first (for persistence)
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("token_expires_at", expiresAt.toString());
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }

        // Then save to Zustand store
        setAuthFromTokens({
          accessToken,
          tokenExpiresAt: expiresAt,
          isAuthenticated: true,
          role: payload.scope || 'ROLE_RECRUITER',
        });

        console.log("✅ [Account Rejected] Tokens saved to auth store and localStorage");
      } catch (error) {
        console.error("❌ [Account Rejected] Error decoding token:", error);
      }
    }
  }, [searchParams, setAuthFromTokens, storedToken]);

  if (showUpdateForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Cập Nhật Hồ Sơ Doanh Nghiệp
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Điền đầy đủ thông tin để được xét duyệt lại
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpdateForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Quay lại"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Rejection Reason Box */}
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-5 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Lý do từ chối trước đó:
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  {rejectionReason}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <OrganizationUpdateForm
              onCancel={() => setShowUpdateForm(false)}
              onSuccess={() => {
                router.push("/auth/account-pending");
              }}
            />
          </div>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Cần hỗ trợ?{" "}
              <a href="/contact" className="text-sky-600 hover:text-sky-700 font-medium underline">
                Liên hệ với chúng tôi
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 px-8 py-12 text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-white/30">
              <XCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Account Rejected
            </h1>
            <p className="text-red-50 text-lg">
              Your profile did not meet the approval requirements
            </p>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12">
            {/* Rejection Reason Box */}
            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6 mb-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 mb-2 text-lg">
                    Lý do từ chối:
                  </h3>
                  <p className="text-red-800 leading-relaxed whitespace-pre-wrap">
                    {rejectionReason}
                  </p>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* What to do */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Bạn có thể làm gì?
                </h3>
                <ul className="space-y-3 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Xem lại lý do từ chối phía trên</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Cập nhật thông tin doanh nghiệp chính xác</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Cung cấp giấy phép kinh doanh hợp lệ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Gửi lại hồ sơ để xét duyệt</span>
                  </li>
                </ul>
              </div>

              {/* Required Information */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Thông tin cần chuẩn bị
                </h3>
                <ul className="space-y-3 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 mt-0.5 text-green-600" />
                    <span>Tên công ty chính xác</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 text-green-600" />
                    <span>Số giấy phép kinh doanh</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <User className="w-4 h-4 mt-0.5 text-green-600" />
                    <span>Thông tin người liên hệ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-green-600" />
                    <span>Địa chỉ công ty</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => setShowUpdateForm(true)}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl hover:from-sky-700 hover:to-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200 text-lg"
              >
                <RefreshCw className="w-5 h-5" />
                Cập Nhật & Gửi Lại Hồ Sơ
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => router.push("/auth/signin")}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Quay Lại Đăng Nhập
                </button>

                <button
                  onClick={() => router.push("/")}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  <Home className="w-5 h-5" />
                  Về Trang Chủ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Cần hỗ trợ?{" "}
            <a href="/contact" className="text-sky-600 hover:text-sky-700 font-medium underline">
              Liên hệ với chúng tôi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
