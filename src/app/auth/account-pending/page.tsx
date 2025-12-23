"use client";

import { Clock, ArrowLeft, Info, Home, CheckCircle2, Mail, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccountPendingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-12 text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-white/30 animate-pulse">
              <Clock className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Account Pending Approval
            </h1>
            <p className="text-amber-50 text-lg">
              Your profile is being reviewed by our administrators
            </p>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12">
            {/* Important Information Box */}
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-6 mb-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Info className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 mb-3 text-lg">
                    Thông tin quan trọng:
                  </h3>
                  <ul className="space-y-2.5 text-sm text-amber-800">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>Quá trình xét duyệt thường mất từ <strong>24-48 giờ làm việc</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>Bạn sẽ nhận được <strong>email thông báo</strong> khi tài khoản được phê duyệt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>Vui lòng kiểm tra cả <strong>hộp thư spam/junk</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>Không thể đăng nhập cho đến khi tài khoản được kích hoạt</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-5 flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5" />
                Điều gì xảy ra tiếp theo?
              </h3>
              <div className="space-y-5">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                      1
                    </div>
                  </div>
                  <div className="flex-1 pt-1.5">
                    <h4 className="font-semibold text-blue-900 mb-1">Kiểm tra thông tin</h4>
                    <p className="text-sm text-blue-700">
                      Admin sẽ xác minh thông tin doanh nghiệp và giấy phép kinh doanh của bạn
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                      2
                    </div>
                  </div>
                  <div className="flex-1 pt-1.5">
                    <h4 className="font-semibold text-blue-900 mb-1">Phê duyệt tài khoản</h4>
                    <p className="text-sm text-blue-700">
                      Nếu hồ sơ hợp lệ, bạn sẽ nhận được email xác nhận phê duyệt
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                      3
                    </div>
                  </div>
                  <div className="flex-1 pt-1.5">
                    <h4 className="font-semibold text-blue-900 mb-1">Kích hoạt tài khoản</h4>
                    <p className="text-sm text-blue-700">
                      Đăng nhập lại để truy cập đầy đủ tính năng recruiter
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Email Tips */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Kiểm tra Email
                </h3>
                <ul className="space-y-2.5 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Hộp thư đến chính</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Thư mục Spam/Junk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Thư mục Promotions</span>
                  </li>
                </ul>
              </div>

              {/* Notification Tips */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Thông Báo
                </h3>
                <ul className="space-y-2.5 text-sm text-purple-800">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    <span>Email phê duyệt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    <span>Hướng dẫn kích hoạt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">✓</span>
                    <span>Link đăng nhập</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
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
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl hover:from-sky-700 hover:to-blue-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
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
