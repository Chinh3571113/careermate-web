"use client";

import { TopEmployers } from "./TopEmployers";
import { FeedbackButton } from "./FeedbackButton";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Star, 
  ChevronRight, 
  Briefcase, 
  MapPin, 
  Building2,
  BookOpen,
  Calendar
} from "lucide-react";
import { publicBlogApi } from "@/lib/public-blog-api";
import { fetchCompanies, type CompanyListItem } from "@/lib/company-api";
import { getCompanyStatistics, type CompanyStatisticsResponse } from "@/lib/review-api";
import type { BlogResponse } from "@/types/blog";

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

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
    <span ref={ref} className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-600">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}



// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Estimate read time based on content length
const estimateReadTime = (content: string) => {
  const wordsPerMinute = 200;
  const wordCount = content?.split(/\s+/).length || 0;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${Math.max(1, minutes)} min read`;
};

export function ClientHomePage() {
  // State for fetching real data
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companyStats, setCompanyStats] = useState<Record<number, CompanyStatisticsResponse | null>>({});

  // Fetch blogs on mount
  useEffect(() => {
    const loadBlogs = async () => {
      try {
        setIsLoadingBlogs(true);
        const response = await publicBlogApi.getBlogs({ page: 0, size: 3, sortBy: 'createdAt', sortDir: 'DESC' });
        setBlogs(response.content || []);
      } catch (error) {
        console.error('Error loading blogs:', error);
      } finally {
        setIsLoadingBlogs(false);
      }
    };
    loadBlogs();
  }, []);

  // Fetch companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setIsLoadingCompanies(true);
        const response = await fetchCompanies({ page: 0, size: 4 });
        if (response.code === 200 || response.code === 1000) {
          setCompanies(response.result?.content || []);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, []);

  // Fetch real review statistics for companies displayed on home page
  useEffect(() => {
    if (!companies.length) return;

    let cancelled = false;
    const loadStats = async () => {
      await Promise.all(
        companies.map(async (c) => {
          if (companyStats[c.id] !== undefined) return;
          try {
            const stats = await getCompanyStatistics(c.id);
            if (!cancelled) {
              setCompanyStats((prev) => ({ ...prev, [c.id]: stats }));
            }
          } catch {
            if (!cancelled) {
              setCompanyStats((prev) => ({ ...prev, [c.id]: null }));
            }
          }
        })
      );
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [companies, companyStats]);
  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        select {
          direction: ltr !important;
        }
        select option {
          direction: ltr !important;
        }
      `}</style>

      
        {/* Added margin-top equal to header height */}
        {/* Hero Section */}
        <section 
          className="relative text-white py-12 sm:py-16 md:py-20 pb-20 sm:pb-28 md:pb-32 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/general/job-search-bg.png')" }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/60"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Welcome to CareerMate
            </h1>
            <h2 className="text-base sm:text-lg md:text-xl lg:text-3xl mb-8 sm:mb-10 md:mb-12 text-blue-100 max-w-3xl mx-auto px-4">
              The bridge between opportunity and success.
            </h2>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20">
                <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                  <div className="flex-[2]">
                    <input
                      type="text"
                      placeholder="Job title, keywords, or company"
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-500 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-xl transition-all"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <select
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-10 sm:pr-12 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-xl transition-all appearance-none cursor-pointer"
                      style={{ direction: "ltr" }}
                    >
                      <option value="">Select Location</option>
                      <option value="remote">Remote</option>
                      <option value="new-york">New York, NY</option>
                      <option value="san-francisco">San Francisco, CA</option>
                      <option value="seattle">Seattle, WA</option>
                      <option value="austin">Austin, TX</option>
                      <option value="boston">Boston, MA</option>
                      <option value="chicago">Chicago, IL</option>
                      <option value="denver">Denver, CO</option>
                      <option value="los-angeles">Los Angeles, CA</option>
                      <option value="miami">Miami, FL</option>
                      <option value="phoenix">Phoenix, AZ</option>
                      <option value="portland">Portland, OR</option>
                      <option value="san-diego">San Diego, CA</option>
                      <option value="washington-dc">Washington, DC</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 pointer-events-none">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  <button className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl bg-gradient-to-r from-[#3a4660] to-gray-400 text-white rounded-lg sm:rounded-md hover:bg-gradient-to-r hover:from-[#3a4660] hover:to-[#3a4660] transition-colors">
                    Search Jobs
                  </button>
                </div>

                {/* Quick Filters */}
                <div className="mt-6 flex flex-wrap justify-center gap-3 items-center">
                  <span className="font-bold text-base text-white">
                    Suggestions for you:
                  </span>
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm text-white/90 hover:bg-white/30 transition-colors cursor-pointer">
                    Software Engineer
                  </span>
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm text-white/90 hover:bg-white/30 transition-colors cursor-pointer">
                    IT Comtor
                  </span>
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm text-white/90 hover:bg-white/30 transition-colors cursor-pointer">
                    Companies
                  </span>
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm text-white/90 hover:bg-white/30 transition-colors cursor-pointer">
                    Skills
                  </span>
                  
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div className="group">
                <div className="mb-2">
                  <AnimatedCounter end={10000} suffix="+" duration={2500} />
                </div>
                <div className="text-gray-600 text-lg font-sans">
                  Active Jobs
                </div>
              </div>
              <div className="group">
                <div className="mb-2">
                  <AnimatedCounter end={500} suffix="+" duration={2000} />
                </div>
                <div className="text-gray-600 text-lg font-sans">
                  Top Companies
                </div>
              </div>
              <div className="group">
                <div className="mb-2">
                  <AnimatedCounter end={50000} suffix="+" duration={3000} />
                </div>
                <div className="text-gray-600 text-lg font-sans">
                  Candidates
                </div>
              </div>
              <div className="group">
                <div className="mb-2">
                  <AnimatedCounter end={95} suffix="%" duration={1500} />
                </div>
                <div className="text-gray-600 text-lg font-sans">
                  Success Rate
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Employers Section */}
        <TopEmployers />

        {/* Hot Companies Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 to-indigo-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    Hot Companies
                  </h2>
                </div>
                <p className="text-gray-300 text-base sm:text-lg">
                  Top-rated companies actively hiring
                </p>
              </div>
              <Link 
                href="/companies"
                className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-white/10 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/20"
              >
                Explore Companies
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </div>

            {isLoadingCompanies ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/10 rounded-xl border border-white/20 p-6 animate-pulse">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-2xl bg-white/20 mb-4" />
                      <div className="h-5 w-32 bg-white/20 rounded mb-2" />
                      <div className="h-4 w-24 bg-white/20 rounded mb-3" />
                      <div className="h-4 w-28 bg-white/20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : companies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {companies.map((company) => {
                  const stats = companyStats[company.id];
                  const avgRating = stats ? stats.averageOverallRating || 0 : 0;
                  const totalReviews = stats ? stats.totalReviews || 0 : 0;
                  return (
                    <Link
                      key={company.id}
                      href={`/companies/${company.id}`}
                      className="group bg-white/10 backdrop-blur rounded-xl border border-white/20 p-6 hover:bg-white/20 hover:border-blue-400/50 transition-all duration-300"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center overflow-hidden mb-4 shadow-lg">
                          {company.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt={company.companyName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Building2 className={`h-10 w-10 text-gray-400 ${company.logoUrl ? 'hidden' : ''}`} />
                        </div>
                        <h3 className="font-bold text-white text-lg mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">
                          {company.companyName}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{company.companyAddress || 'Vietnam'}</span>
                        </p>
                        
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(avgRating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-white font-semibold">{avgRating.toFixed(1)}</span>
                          <span className="text-gray-400 text-sm">({totalReviews})</span>
                        </div>

                        <div className="flex items-center gap-2 text-blue-400">
                          <Briefcase className="h-4 w-4" />
                          <span className="font-semibold">{company.jobCount} open jobs</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No companies available at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* Career Insights Blog Section */}
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Career Insights
                  </h2>
                </div>
                <p className="text-gray-600 text-base sm:text-lg">
                  Expert tips and guides for your career journey
                </p>
              </div>
              <Link 
                href="/blog"
                className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                Read More Articles
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </div>

            {isLoadingBlogs ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-6">
                      <div className="h-6 w-3/4 bg-gray-200 rounded mb-3" />
                      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-2/3 bg-gray-200 rounded mb-4" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blog/${blog.id}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      {blog.thumbnailUrl ? (
                        <img
                          src={blog.thumbnailUrl}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                          <BookOpen className="h-16 w-16 text-blue-300" />
                        </div>
                      )}
                      {blog.category && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                            {blog.category}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {blog.summary || blog.content?.substring(0, 120) + '...'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{blog.authorName || 'CareerMate'}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(blog.createdAt)}
                          </span>
                          <span>•</span>
                          <span>{estimateReadTime(blog.content || '')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No articles available at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* AI Features Section */}
        <section className="py-12 sm:py-16 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                AI-Powered Features
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 px-4">
                Get personalized job recommendations and career insights
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-white rounded-lg p-6 sm:p-8 text-center shadow-sm">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl">🤖</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Smart Matching</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Our AI analyzes your skills and preferences to find the
                  perfect job matches.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 sm:p-8 text-center shadow-sm">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Career Insights</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Get personalized career advice and market insights to advance
                  your career.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 sm:p-8 text-center shadow-sm sm:col-span-2 md:col-span-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl">📝</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">CV Analysis</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Get your CV analyzed by AI to highlight strengths and suggest improvements.
                </p>
              </div>
            </div>
            
            <FeedbackButton />
          </div>
        </section>
      
    </div>
  );
}

export default ClientHomePage;
