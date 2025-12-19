'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Briefcase, Building2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { fetchCompanies, fetchCompanyJobs, type CompanyListItem } from '@/lib/company-api';
import { getCompanyStatistics, type CompanyStatisticsResponse } from '@/lib/review-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyStats, setCompanyStats] = useState<Record<number, CompanyStatisticsResponse | null>>({});
  const [statsLoading, setStatsLoading] = useState<Record<number, boolean>>({});
  const [openJobsCount, setOpenJobsCount] = useState<Record<number, number | null>>({});
  const [openJobsLoading, setOpenJobsLoading] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 9;

  const loadCompanies = async (page: number, address?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchCompanies({
        page,
        size: pageSize,
        companyAddress: address || undefined,
      });
      
      if (response.code === 200 || response.code === 1000) {
        setCompanies(response.result.content || []);
        setTotalPages(response.result.totalPages || 0);
        setTotalElements(response.result.totalElements || 0);
        setCurrentPage(response.result.number || page);
      } else {
        setError('Failed to load companies');
      }
    } catch (err: any) {
      console.error('Error loading companies:', err);
      setError(err.message || 'Failed to load companies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies(0);
  }, []);

  // Load real rating stats for companies on the page
  useEffect(() => {
    if (!companies.length) return;

    companies.forEach((c) => {
      if (companyStats[c.id] !== undefined || statsLoading[c.id]) return;

      setStatsLoading((prev) => ({ ...prev, [c.id]: true }));
      getCompanyStatistics(c.id)
        .then((stats) => {
          setCompanyStats((prev) => ({ ...prev, [c.id]: stats }));
        })
        .catch(() => {
          setCompanyStats((prev) => ({ ...prev, [c.id]: null }));
        })
        .finally(() => {
          setStatsLoading((prev) => ({ ...prev, [c.id]: false }));
        });
    });
  }, [companies, companyStats, statsLoading]);

  // Load real open positions count (public job postings) for companies on the page
  useEffect(() => {
    if (!companies.length) return;

    companies.forEach((c) => {
      if (openJobsCount[c.id] !== undefined || openJobsLoading[c.id]) return;

      setOpenJobsLoading((prev) => ({ ...prev, [c.id]: true }));
      fetchCompanyJobs({ recruiterId: c.id, page: 0, size: 1 })
        .then((res: any) => {
          const total =
            typeof res?.result?.totalElements === 'number'
              ? res.result.totalElements
              : typeof res?.result?.totalElements === 'bigint'
                ? Number(res.result.totalElements)
                : typeof res?.result?.totalElements === 'string'
                  ? Number(res.result.totalElements)
                  : 0;
          setOpenJobsCount((prev) => ({ ...prev, [c.id]: Number.isFinite(total) ? total : 0 }));
        })
        .catch(() => {
          setOpenJobsCount((prev) => ({ ...prev, [c.id]: null }));
        })
        .finally(() => {
          setOpenJobsLoading((prev) => ({ ...prev, [c.id]: false }));
        });
    });
  }, [companies, openJobsCount, openJobsLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadCompanies(0, searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadCompanies(newPage, searchQuery);
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Dark Theme */}
      <div className="bg-gradient-to-b from-[#1a1a3e] to-[#0f0f23] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Discover Amazing Companies
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Explore top companies hiring now. Find your dream workplace and take the next step in your career.
            </p>
            
            {/* Search Bar - Glass Effect */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="flex gap-3 p-2 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by location (e.g., Hanoi, Ho Chi Minh)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="px-8 py-4 h-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl font-semibold shadow-lg shadow-blue-500/25"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </div>
            </form>

            {/* Quick Suggestions */}
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <span className="text-gray-500 text-sm">Suggestions for you:</span>
              {['Ho Chi Minh', 'Hanoi', 'Da Nang', 'Remote'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    loadCompanies(0, tag);
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm text-gray-300 border border-white/10 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Building2 className="h-5 w-5" />
              <span className="font-semibold text-gray-900">{totalElements}</span>
              <span>companies found</span>
              {searchQuery && (
                <span className="text-gray-500">
                  in &quot;{searchQuery}&quot;
                </span>
              )}
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  loadCompanies(0);
                }}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                Clear filter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Error State */}
        {error && (
          <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => loadCompanies(currentPage, searchQuery)}
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-20 h-20 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mt-6" />
                <Skeleton className="h-12 w-full mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && companies.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No companies found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery
                ? `No companies match your search "${searchQuery}"`
                : 'No companies are currently listed'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  loadCompanies(0);
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                View all companies
              </Button>
            )}
          </div>
        )}

        {/* Companies Grid */}
        {!isLoading && !error && companies.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => {
                const stats = companyStats[company.id];
                const isStatsLoading = !!statsLoading[company.id] && stats === undefined;
                const jobsCount = openJobsCount[company.id];
                const isJobsLoading = !!openJobsLoading[company.id] && jobsCount === undefined;
                const avgRating = stats ? stats.averageOverallRating || 0 : 0;
                const totalReviews = stats ? stats.totalReviews || 0 : 0;
                
                return (
                  <Link
                    key={company.id}
                    href={`/companies/${company.id}`}
                    className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                  >
                    {/* Header with Logo and Info */}
                    <div className="flex items-start gap-4 mb-5">
                      {/* Company Logo */}
                      <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 group-hover:border-blue-300 transition-colors">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.companyName}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Building2 className={`h-10 w-10 text-gray-400 ${company.logoUrl ? 'hidden' : ''}`} />
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {company.companyName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                          <span className="truncate">{company.companyAddress || 'Location not specified'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating Section */}
                    <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
                      {isStatsLoading ? (
                        <div className="flex items-center gap-3 w-full">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-10" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ) : stats ? (
                        <>
                          {renderStars(avgRating)}
                          <span className="font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm">({totalReviews} reviews)</span>
                        </>
                      ) : (
                        <>
                          {renderStars(0)}
                          <span className="font-bold text-gray-900">0.0</span>
                          <span className="text-gray-500 text-sm">(0 reviews)</span>
                        </>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-blue-500" />
                          {isJobsLoading ? (
                            <Skeleton className="h-4 w-20" />
                          ) : (
                            <span className="text-gray-600">
                              <span className="font-bold text-blue-600">{jobsCount ?? 0}</span>
                              {' '}open position{(jobsCount ?? 0) !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* View Button */}
                    <div className="mt-5">
                      <div className="w-full py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-xl text-center text-blue-600 font-semibold group-hover:border-blue-300 transition-all">
                        View Company →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-12 ${
                          pageNum === currentPage
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
