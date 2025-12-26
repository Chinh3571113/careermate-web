"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { useAuthStore } from "@/store/use-auth-store";
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
import { useClientAuth } from "@/hooks/useClientAuth";
import { decodeJWT } from "@/lib/auth-admin";
import api from "@/lib/api";

// Animated Counter Component
interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
}

function AnimatedCounter({
  end,
  duration = 2000,
  suffix = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | undefined;
    const startCount = 0;
    const endCount = end;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(
        startCount + (endCount - startCount) * easeOutQuart
      );

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold text-gray-600">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function RecruiterHomePage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [userInfo, setUserInfo] = useState<{
    username: string;
    email: string;
  } | null>(null);

  // Lấy trạng thái auth
  const { mounted, isAuthenticated, accessToken, role } = useClientAuth();
  const { logout, user, recruiterAvatarUrl, setRecruiterAvatarUrl } = useAuthStore();
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  // Decode token CHỈ sau khi có accessToken ở client
  useEffect(() => {
    if (!accessToken) {
      setUserInfo(null);
      return;
    }
    try {
      const decoded = decodeJWT(accessToken);
      setUserInfo({
        email: decoded?.sub || decoded?.email || "User",
        username: decoded?.name || decoded?.sub || "User",
      });

      // Update store user if not set
      if (!user && decoded) {
        useAuthStore.setState({
          user: {
            id: decoded?.sub,
            email: decoded?.email || decoded?.sub,
            username: decoded?.name || decoded?.email || decoded?.sub,
          },
        });
      }
    } catch {
      setUserInfo(null);
    }
  }, [accessToken, user]);

  // Fetch recruiter avatar
  const fetchRecruiterAvatar = useCallback(async () => {
    if (!accessToken || !isAuthenticated) return;
    
    const isRecruiter = role?.toUpperCase().includes("RECRUITER");
    if (!isRecruiter) return;

    try {
      console.log('🔄 [RecruiterHomePage] Fetching recruiter profile for avatar...');
      const response = await api.get<{ code: number; result: { avatarUrl?: string } }>('/api/recruiter/profile');
      
      if (response.data?.result?.avatarUrl) {
        console.log('✅ [RecruiterHomePage] Avatar URL:', response.data.result.avatarUrl);
        setLocalAvatarUrl(response.data.result.avatarUrl);
        setRecruiterAvatarUrl(response.data.result.avatarUrl);
      }
    } catch (error) {
      console.error('❌ [RecruiterHomePage] Error fetching avatar:', error);
    }
  }, [accessToken, isAuthenticated, role, setRecruiterAvatarUrl]);

  // Fetch avatar on mount
  useEffect(() => {
    if (!localAvatarUrl && !recruiterAvatarUrl && isAuthenticated) {
      fetchRecruiterAvatar();
    }
  }, [localAvatarUrl, recruiterAvatarUrl, isAuthenticated, fetchRecruiterAvatar]);

  const handleConsultation = () => {
    // Handle consultation request
    console.log("Consultation requested for:", email);
  };

  const handleStartPosting = () => {
    // Handle start posting
    console.log("Start posting job");
  };

  // Show loading state while auth is hydrating to prevent flash
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#1b1b20f5]">
        <header className="bg-[#1b1b20f5] sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-14 w-14 bg-white/20 rounded animate-pulse" />
                <span className="text-xl font-bold text-[#ffffff]">Recruiter</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-8 w-20 bg-white/20 rounded animate-pulse" />
                <div className="h-8 w-24 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-[#1b1b20f5] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <Image
                    src="/images/general/newlogo.png"
                    alt="Logo"
                    width={56}
                    height={56}
                    className="h-14 w-auto"
                  />
                  <span className="text-xl font-bold text-[#ffffff]">
                    Recruiter
                  </span>
                </Link>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                href="/recruiter/recruiter-feature/dashboard"
                className="text-[#ffffff] hover:text-[#c8c8c8]"
              >
                Dashboard
              </Link>
              <Link
                href="/recruiter/recruiter-feature/profile?tab=account"
                className="text-[#ffffff] hover:text-[#c8c8c8]"
              >
                Account
              </Link>
              <Link
                href="/recruiter/recruiter-feature/candidates/applications"
                className="text-[#ffffff] hover:text-[#c8c8c8]"
              >
                Candidates
              </Link>
              <Link
                href="/recruiter/recruiter-feature/services"
                className="text-[#ffffff] hover:text-[#c8c8c8]"
              >
                Services
              </Link>
              <Link
                href="/recruiter/recruiter-feature/jobs"
                className="text-[#ffffff] hover:text-[#c8c8c8]"
              >
                Upload Jobs
              </Link>
              <Link
                href="/recruiter/recruiter-feature/support"
                className="text-[#ffffff] hover:text-[#c8c8c8]"
              >
                Support
              </Link>
            </nav>

            {/* Bên phải header */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  <span className="sm:block text-gray-300 hover:text-white transition-colors hidden text-xs md:inline">
                    For Recruiter {userInfo?.username || user?.username || "User"}
                  </span>

                  <ProfileDropdown
                    userName={user?.username || userInfo?.username || "User"}
                    userEmail={user?.email || userInfo?.email}
                    role={role || undefined}
                    userAvatar={localAvatarUrl || recruiterAvatarUrl || undefined}
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="px-4 py-2 text-white hover:text-gray-300 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
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
                  Post job openings,
                  <br />
                  find candidates{" "}
                  <span className="cta-highlighted text-[#6da9e9]">
                    effectively.
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
      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-[#e8f1fe] to-[#ccdff9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="mb-2">
                <AnimatedCounter end={1000} suffix="+" duration={2500} />
              </div>
              <div className="text-gray-600 text-lg font-sans">Users</div>
            </div>
            <div className="group">
              <div className="mb-2">
                <AnimatedCounter end={900} suffix="+" duration={2000} />
              </div>
              <div className="text-gray-600 text-lg font-sans">Employers</div>
            </div>
            <div className="group">
              <div className="mb-2">
                <AnimatedCounter end={8100} suffix="+" duration={3000} />
              </div>
              <div className="text-gray-600 text-lg font-sans">
                Applications/year
              </div>
            </div>
            <div className="group">
              <div className="mb-2">
                <AnimatedCounter end={95} suffix="%" duration={1500} />
              </div>
              <div className="text-gray-600 text-lg font-sans">
                Satisfaction Rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#e8f1fe] to-[#ccdff9]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Start hiring the best talent today!
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of businesses that trust CareerMate
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleConsultation}
                className="bg-white text-[#5099f8] border border-[#4691f3] px-8 py-4 rounded-lg font-medium hover:bg-[#b9d2f3] transition-colors"
              >
                Free Consultation
              </button>
              <Link
                href="/user-confirmpage"
                className="bg-[#5196f1] text-white px-8 py-4 rounded-lg font-medium hover:bg-[#87bafd] transition-colors inline-flex items-center gap-2"
              >
                <PlusCircle className="h-5 w-5" />
                Start Posting Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Platform Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Link
              href="/recruiter/recruiter-feature/services/search"
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
              href="/recruiter/recruiter-feature/services/premium"
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
              href="/recruiter/recruiter-feature/jobs/create"
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
                  công nghệ lõi xoay quanh tối ưu hóa biết là ứng dụng sâu tri
                  tuệ nhân tạo, AI CareerMate kỳ vọng mang tới các giải pháp
                  nhân sự hiệu quả hơn nữa trong tương lai.
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
                    <Link href="/recruiter/recruiter-feature/profile/account">
                      <div
                        className="w-20 h-20 bg-[#c9dffc] rounded-full flex items-center justify-center 
                            shadow-md hover:scale-110 transition-transform duration-300"
                      >
                        <Users className="h-8 w-8 text-[#6697d8]" />
                      </div>
                    </Link>
                    {/* Target */}
                    <Link href="/recruiter/recruiter-feature/support/contact">
                      <div
                        className="w-20 h-20 bg-[#bed8f9] rounded-full flex items-center justify-center 
                            shadow-md hover:scale-110 transition-transform duration-300"
                      >
                        <Target className="h-8 w-8 text-[#6697d8]" />
                      </div>
                    </Link>
                    {/* TrendingUp */}
                    <Link href="/recruiter/recruiter-feature/dashboard">
                      <div
                        className="w-20 h-20 bg-[#b5ceef] rounded-full flex items-center justify-center 
                            shadow-md hover:scale-110 transition-transform duration-300"
                      >
                        <TrendingUp className="h-8 w-8 text-[#6697d8]" />
                      </div>
                    </Link>
                    {/* Star */}
                    <Link href="/recruiter/recruiter-feature/services/premium">
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

      {/* Footer */}
      <footer className="bg-[#3e5570] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-[#85b9fe]">
                CareerMate
              </h3>
              <p className="text-gray-300">
                Nền tảng tuyển dụng thông minh hàng đầu Việt Nam
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Dịch vụ</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Đăng tin tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Tìm kiếm CV
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-[#3588f4]">
                    Đánh giá năng lực
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
