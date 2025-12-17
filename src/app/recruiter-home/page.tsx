"use client";

import { useState } from "react";
import {
  Users,
  Target,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Star,
  Building2,
  Briefcase,
  Search,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";

export default function RecruiterHomePage() {
  const [email, setEmail] = useState("");

  const handleConsultation = () => {
    // Handle consultation request
    console.log("Consultation requested for:", email);
  };

  const handleStartPosting = () => {
    // Handle start posting
    console.log("Start posting job");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-[#436a9d]">
                CareerMate
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/recruiter/dashboard"
                  className="text-gray-600 hover:text-[#436a9d]"
                >
                  Dashboard
                </Link>
                <Link
                  href="/recruiter/profile?tab=account"
                  className="text-gray-600 hover:text-[#436a9d]"
                >
                  Account
                </Link>
                <Link
                  href="/recruiter/candidates/applications"
                  className="text-gray-600 hover:text-[#436a9d]"
                >
                  Candidates
                </Link>
                <Link
                  href="/recruiter/services"
                  className="text-gray-600 hover:text-[#436a9d]"
                >
                  Services
                </Link>
                <Link
                  href="/recruiter/blog"
                  className="text-gray-600 hover:text-[#436a9d]"
                >
                  Blog
                </Link>
                <Link
                  href="/recruiter/support"
                  className="text-gray-600 hover:text-[#436a9d]"
                >
                  Support
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/recruiter/dashboard"
                className="bg-[#24497b] text-white px-4 py-2 rounded-lg hover:bg-[#436a9d] transition-colors"
              >
                Đăng tuyển & Quản lý
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#ffff] to-[#758499] py-16 relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Đăng tin tuyển dụng,
                  <br />
                  tìm kiếm ứng viên{" "}
                  <span className="cta-highlighted text-[#6da9e9]">
                    hiệu quả
                  </span>
                </h1>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-[#0ead43] flex-shrink-0" />
                  <span className="text-gray-700 text-lg">
                    Đăng tin tuyển dụng miễn phí, dễ dàng và nhanh chóng
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-[#0ead43] flex-shrink-0" />
                  <span className="text-gray-700 text-lg">
                    Nguồn ứng viên không lo từ nhiều ngành nghề, kinh nghiệm
                    khác nhau
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-[#0ead43] flex-shrink-0" />
                  <span className="text-gray-700 text-lg">
                    CareerMate AI đề xuất ứng viên tiềm năng, lọc thông tin nổi
                    bật và tự động sắp xếp theo điểm phù hợp
                  </span>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-[500px] mx-auto">
              <div className="relative z-10">
                {/* Laptop mockup */}
                <div className="bg-gray-900 rounded-t-xl p-4 transform rotate-12 hover:rotate-6 transition-transform duration-300">
                  <div className="bg-white rounded-lg p-6 space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-emerald-50 p-3 rounded">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-4 w-4 text-[#466895]" />
                          <span className="text-sm font-medium">
                            Việc làm mới
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-gray-100 p-2 rounded text-xs">
                          Senior Developer - 25M
                        </div>
                        <div className="bg-gray-100 p-2 rounded text-xs">
                          Marketing Manager - 20M
                        </div>
                        <div className="bg-gray-100 p-2 rounded text-xs">
                          UI/UX Designer - 18M
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-[#6697d8] rounded-full opacity-50"></div>
              <div className="absolute top-16 -right-8 w-12 h-12 bg-[#063067] rounded-full opacity-40"></div>
              <div className="absolute -bottom-4 right-8 w-16 h-16 bg-[#6697d8] rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Platform Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Link
              href="/recruiter/services/search"
              className="block relative hover:scale-105 transition-transform duration-300"
            >
              {/* 3D illustration placeholder */}
              <div className="relative hover:-rotate-6 transition-transform duration-300 w-full max-w-[500px] mx-auto">
                <div className="bg-gradient-to-br from-[#bcd1ec] to-[#6b85a7] rounded-2xl flex items-center justify-center cursor-pointer">
                  <div className="text-center">
                    <img
                      src="/img/home3.png"
                      alt="3D Illustration"
                      className="w-full h-80 object-contain p-8"
                    />
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute top-8 -right-4 w-8 h-8 bg-[#6697d8] rounded-full"></div>
                <div className="absolute bottom-12 -left-6 w-6 h-6 bg-[#558dd6] rounded-full"></div>
                <div className="absolute top-1/2 left-8 w-4 h-4 bg-[#6697d8] rounded-full"></div>
              </div>
            </Link>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="text-[#305c96] font-extrabold text-sm tracking-wider uppercase">
                  Find Your Candidates
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  CareerMate Smart Recruitment Platform
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed text-lg">
                Nền tảng công nghệ AI và Machine Learning trong lĩnh vực
                Recruitment Marketing, mang đến các giải pháp toàn diện giúp
                doanh nghiệp giải quyết bài toán nguồn nhân lực trong quá trình
                số hóa, từ việc tiếp cận CV, sàng lọc hồ sơ ứng viên cho đến
                đánh giá ứng viên và đo lường hiệu quả.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Promotion Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-12">
            <div className="text-[#305c96] font-extrabold text-sm tracking-wider uppercase mb-3">
              Brand Promotion
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              CareerMate Vietnam
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
                <p>
                  CareerMate Việt Nam là công ty hàng đầu trong lĩnh vực HR Tech
                  tại Việt Nam, ngay từ những ngày đầu thành lập và vận hành,
                  sản phẩm của chúng tôi.
                </p>
                <p>
                  Nền tảng tuyển dụng thông minh CareerMate, Nền tảng thiết lập
                  và đánh giá năng lực nhân viên TestCenter, Nền tảng quản lý và
                  gia tăng trải nghiệm nhân viên HappyTime và Giải pháp tri
                  tuyển dụng thần tốc suất cao cấp Strings.
                </p>
                <p>
                  CareerMate đang có nhiều hơn 6.3 triệu người dùng, 190.000 nhà
                  tuyển dụng và 4 đối tác thành công hàng triệu lượt ứng viên
                  mỗi năm tại các doanh nghiệp phù hợp.
                </p>
                <p>
                  Thông qua việc nghiên cứu và không ngừng phát triển năng lực
                  công nghệ lõi xoay quanh tối ưu hóa b các giải pháp nhân sự
                  hiệu quả hơn nữa trong tương lai.
                </p>
              </div>
            </div>

            <Link
              href="/recruiter/services/premium"
              className="block relative hover:scale-105 transition-transform duration-300"
            >
              <div className="relative hover:rotate-6 transition-transform duration-300 w-full max-w-[500px] mx-auto">
                {/* Team illustration */}
                <div className="relative bg-gradient-to-br from-[#0c2426] to-[#6697d8] rounded-2xl h-80">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <img
                      src="/img/home2.png"
                      alt="Team Illustration"
                      className="w-full h-80 object-contain"
                    />
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute top-4 right-8 w-16 h-16 bg-[#6697d8] rounded-full opacity-60"></div>
                  <div className="absolute bottom-8 left-5 w-10 h-10 bg-[#3573c5] rounded-full opacity-50"></div>
                  <div className="absolute top-1/3 left-4 w-8 h-8 bg-[#6697d8] rounded-full opacity-40"></div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Smart Platform Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Link
              href="/recruiter/jobs/create"
              className="block relative hover:scale-105 transition-transform duration-300"
            >
              <div className="relative">
                {/* 3D illustration placeholder */}
                <div className="relative hover:-rotate-6 transition-transform duration-300 w-full max-w-[500px] mx-auto">
                  <div className="bg-gradient-to-br from-[#bcd1ec] to-[#6b85a7] rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <img
                        src="/img/home1.png"
                        alt="3D Illustration"
                        className="w-full h-80 object-contain p-8"
                      />
                    </div>
                  </div>
                  {/* Floating elements */}
                  <div className="absolute top-8 -right-4 w-8 h-8 bg-[#6697d8] rounded-full"></div>
                  <div className="absolute bottom-12 -left-6 w-6 h-6 bg-[#558dd6] rounded-full"></div>
                  <div className="absolute top-1/2 left-8 w-4 h-4 bg-[#6697d8] rounded-full"></div>
                </div>
              </div>
            </Link>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="text-[#305c96] font-extrabold text-sm tracking-wider uppercase">
                  Posting Recruitment
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  CareerMate Smart Recruitment Platform
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed text-lg">
                Nền tảng công nghệ AI và Machine Learning trong lĩnh vực
                Recruitment Marketing, mang đến các giải pháp toàn diện giúp
                doanh nghiệp giải quyết bài toán nguồn nhân lực trong quá trình
                số hóa, từ việc tiếp cận CV, sàng lọc hồ sơ ứng viên cho đến
                đánh giá ứng viên và đo lường hiệu quả.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-12">
            <div className="text-[#305c96] font-extrabold text-sm tracking-wider uppercase mb-3">
              MORE FEATURES
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              CareerMate Vietnam
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
                <p>
                  CareerMate Vietnam is a leading company in the HR Tech industry
                  in Vietnam, and from the very beginning of its establishment and operation,
                  our products have made a significant impact.
                </p>
                <p>
                  The intelligent recruitment platform CareerMate, the employee capability 
                  assessment platform TestCenter, the employee experience management platform 
                  HappyTime, and the premium rapid recruitment solution Strings.
                </p>
                <p>
                  CareerMate currently has more than 6.3 million users, 190,000 
                  recruiters, and successfully connects millions of candidates 
                  each year to suitable enterprises.
                </p>
                <p>
                  Through research and continuous development of core technology 
                  centered around optimization and deep application of artificial 
                  intelligence, AI CareerMate aims to provide even more effective 
                  human resource solutions in the future.
                </p>
              </div>
            </div>

            <div className="relative group transition-transform duration-500 w-full max-w-[500px] mx-auto">
              {/* Outer rotation and hover effect */}
              <div
                className="relative bg-gradient-to-br from-[#0c2426] to-[#6697d8] rounded-2xl h-80 
                      shadow-lg transform group-hover:rotate-3 group-hover:scale-105 
                      transition-all duration-500 ease-out overflow-hidden"
              >
                {/* Main grid of icons */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-8 p-8">
                    {/* Users */}
                    <Link href="/recruiter/profile/account">
                      <div
                        className="w-20 h-20 bg-[#c9dffc] rounded-full flex items-center justify-center 
                            shadow-md hover:scale-110 transition-transform duration-300"
                      >
                        <Users className="h-8 w-8 text-[#6697d8]" />
                      </div>
                    </Link>
                    {/* Target */}
                    <Link href="recruiter/support/contact">
                      <div
                        className="w-20 h-20 bg-[#bed8f9] rounded-full flex items-center justify-center 
                            shadow-md hover:scale-110 transition-transform duration-300"
                      >
                        <Target className="h-8 w-8 text-[#6697d8]" />
                      </div>
                    </Link>
                    {/* TrendingUp */}
                    <Link href="/recruiter/dashboard">
                      <div
                        className="w-20 h-20 bg-[#b5ceef] rounded-full flex items-center justify-center 
                            shadow-md hover:scale-110 transition-transform duration-300"
                      >
                        <TrendingUp className="h-8 w-8 text-[#6697d8]" />
                      </div>
                    </Link>
                    {/* Star */}
                    <Link href="/recruiter/services/premium">
                      <div
                        className="w-20 h-20 bg-[#b2cef4] rounded-full flex items-center justify-center 
                            shadow-md hover:scale-110 transition-transform duration-300"
                      >
                        <Star className="h-8 w-8 text-[#6697d8]" />
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Decorative background circles */}
                <div className="absolute top-4 right-8 w-16 h-16 bg-[#6697d8] rounded-full opacity-50 blur-md"></div>
                <div className="absolute bottom-8 left-5 w-10 h-10 bg-[#3573c5] rounded-full opacity-40 blur-sm"></div>
                <div className="absolute top-1/3 left-4 w-8 h-8 bg-[#6697d8] rounded-full opacity-30 blur-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-[#e8f1fe] to-[#ccdff9]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-[#2a4669]">
            <div className="space-y-2">
              <div className="text-3xl lg:text-4xl font-bold">6.3M+</div>
              <div className="text-[#2a4669]">Người dùng</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl lg:text-4xl font-bold">190K+</div>
              <div className="text-[#2a4669]">Nhà tuyển dụng</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl lg:text-4xl font-bold">1M+</div>
              <div className="text-[#2a4669]">Lượt ứng tuyển/năm</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl lg:text-4xl font-bold">99%</div>
              <div className="text-[#2a4669]">Độ hài lòng</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#e8f1fe] to-[#ccdff9]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Bắt đầu tuyển dụng hiệu quả ngay hôm nay
            </h2>
            <p className="text-xl text-gray-600">
              Tham gia cùng hàng nghìn doanh nghiệp đã tin tưởng CareerMate
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleConsultation}
                className="bg-white text-[#5099f8] border border-[#4691f3] px-8 py-4 rounded-lg font-medium hover:bg-[#b9d2f3] transition-colors"
              >
                Tư vấn miễn phí
              </button>
              <Link
                href="/user-confirmpage"
                className="bg-[#5196f1] text-white px-8 py-4 rounded-lg font-medium hover:bg-[#87bafd] transition-colors inline-flex items-center gap-2"
              >
                <PlusCircle className="h-5 w-5" />
                Đăng tin tuyển dụng
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3e5570] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-[#85b9fe]">
                CareerMate
              </h3>
              <p className="text-gray-300">
                Leading intelligent recruitment platform in Vietnam
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Services</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Post Jobs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Search CVs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Capability Assessment
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Trung tâm trợ giúp
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Liên hệ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Báo cáo lỗi
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Công ty</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Về chúng tôi
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 CareerMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
