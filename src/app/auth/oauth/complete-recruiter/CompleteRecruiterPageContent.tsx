"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Building2,
  Globe,
  Image as ImageIcon,
  FileText,
  User,
  Phone,
  MapPin,
  Mail,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface CompleteRecruiterPageContentProps {
  email: string | null;
}

export default function CompleteRecruiterPageContent({
  email,
}: CompleteRecruiterPageContentProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    companyName: "",
    website: "",
    logoUrl: "",
    about: "",
    companyEmail: "",
    contactPerson: "",
    phoneNumber: "",
    companyAddress: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.companyEmail.trim()) {
      newErrors.companyEmail = "Company email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      newErrors.companyEmail = "Please enter a valid email address";
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^0\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone must be 10 digits starting with 0";
    }

    if (!formData.companyAddress.trim()) {
      newErrors.companyAddress = "Company address is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      console.log("📤 [Complete Registration] Submitting:", formData);

      const response = await fetch(
        `${API_URL}/api/oauth2/recruiter/complete-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important! Sends session cookie
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      console.log("📥 [Complete Registration] Response:", data);

      if (data.code === 200) {
        // Success - redirect to pending page
        toast.success("Registration completed successfully!");
        router.push("/auth/oauth/pending-approval");
      } else if (data.code === 401) {
        // Session expired
        toast.error("Session expired. Please sign in with Google again.");
        setTimeout(() => router.push("/"), 3000);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("❌ [Complete Registration] Error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-sky-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hoàn Tất Hồ Sơ Recruiter
            </h1>
            <p className="text-gray-600">
              Vui lòng điền thông tin doanh nghiệp để hoàn tất đăng ký
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-700">
              Đăng nhập bằng: <strong>{email}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Tài khoản của bạn sẽ được admin xem xét trước khi kích hoạt.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 mr-2" />
                Tên Công Ty <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                required
                maxLength={255}
                value={formData.companyName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                  errors.companyName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="VD: FPT Corporation"
              />
              {errors.companyName && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 mr-2" />
                Website Công Ty
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                placeholder="https://www.example.com"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4 mr-2" />
                Logo Công Ty (URL)
              </label>
              <input
                type="url"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                placeholder="https://www.example.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cung cấp đường dẫn đến logo công ty của bạn
              </p>
            </div>

            {/* About */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                Giới Thiệu Công Ty
              </label>
              <textarea
                name="about"
                maxLength={2000}
                rows={4}
                value={formData.about}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                placeholder="Mô tả về công ty, sứ mệnh và văn hóa doanh nghiệp..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.about.length}/2000 ký tự
              </p>
            </div>

            {/* Company Email */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 mr-2" />
                Email Công Ty{" "}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="email"
                name="companyEmail"
                required
                maxLength={100}
                value={formData.companyEmail}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                  errors.companyEmail ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="hr@company.com"
              />
              {errors.companyEmail && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.companyEmail}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Email công ty dùng để xác minh và liên hệ công việc
              </p>
            </div>

            {/* Contact Person */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 mr-2" />
                Người Liên Hệ <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="contactPerson"
                required
                maxLength={100}
                value={formData.contactPerson}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                  errors.contactPerson ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nguyễn Văn A"
              />
              {errors.contactPerson && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.contactPerson}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 mr-2" />
                Số Điện Thoại <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                required
                maxLength={20}
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                  errors.phoneNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="0123456789"
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                Địa Chỉ Công Ty <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                name="companyAddress"
                required
                maxLength={500}
                rows={3}
                value={formData.companyAddress}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
                  errors.companyAddress ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="123 Đường Tech, Quận 1, TP. Hồ Chí Minh"
              />
              {errors.companyAddress && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.companyAddress}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading ||
                !formData.companyName ||
                !formData.companyEmail ||
                !formData.contactPerson ||
                !formData.phoneNumber ||
                !formData.companyAddress
              }
              className="w-full bg-sky-600 text-white py-3 rounded-lg 
                       hover:bg-sky-700 disabled:bg-gray-400 
                       transition-colors font-medium shadow-sm
                       disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang gửi...
                </span>
              ) : (
                "Hoàn Tất Đăng Ký"
              )}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Thông tin của bạn sẽ được xem xét bởi admin. Bạn sẽ nhận được email
            khi tài khoản được phê duyệt.
          </p>
        </div>
      </div>
    </div>
  );
}
