'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Briefcase, 
  ArrowLeft,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock
} from 'lucide-react';
import { fetchCompanyDetail, fetchCompanyJobs, type CompanyDetail } from '@/lib/company-api';
import { getCompanyStatistics, type CompanyStatisticsResponse } from '@/lib/review-api';
import CompanyReviews from '@/components/reviews/CompanyReviews';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface JobPosting {
  id: number;
  title: string;
  address: string;
  salaryRange: string;
  workModel: string;
  yearsOfExperience: number;
  expirationDate: string;
  jobPackage: string;
}

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const companyId = parseInt(resolvedParams.id);
  
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [companyStats, setCompanyStats] = useState<CompanyStatisticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobsPage, setJobsPage] = useState(0);
  const [jobsTotalPages, setJobsTotalPages] = useState(0);
  const [jobsTotalElements, setJobsTotalElements] = useState(0);

  // Render star rating
  const renderStars = (ratingValue: number) => {
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
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

  useEffect(() => {
    const loadCompanyDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetchCompanyDetail(companyId);
        
        if (response.code === 200 || response.code === 1000) {
          setCompany(response.result);
        } else {
          setError('Failed to load company details');
        }
      } catch (err: any) {
        console.error('Error loading company detail:', err);
        setError(err.message || 'Failed to load company details');
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      loadCompanyDetail();
    }
  }, [companyId]);

  useEffect(() => {
    let cancelled = false;

    const loadCompanyStats = async () => {
      try {
        setIsLoadingStats(true);
        const stats = await getCompanyStatistics(companyId);
        if (!cancelled) setCompanyStats(stats);
      } catch (err) {
        if (!cancelled) setCompanyStats(null);
      } finally {
        if (!cancelled) setIsLoadingStats(false);
      }
    };

    if (companyId) {
      loadCompanyStats();
    }

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    const loadCompanyJobs = async () => {
      try {
        setIsLoadingJobs(true);
        
        const response = await fetchCompanyJobs({
          recruiterId: companyId,
          page: jobsPage,
          size: 6,
        });
        
        if (response.code === 200 || response.code === 1000) {
          setJobs(response.result?.content || []);
          setJobsTotalPages(response.result?.totalPages || 0);
          setJobsTotalElements(response.result?.totalElements || 0);
        }
      } catch (err: any) {
        console.error('Error loading company jobs:', err);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    if (companyId) {
      loadCompanyJobs();
    }
  }, [companyId, jobsPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-b from-[#1a1a3e] to-[#0f0f23] border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-start gap-6">
              <Skeleton className="w-28 h-28 rounded-2xl bg-white/10" />
              <div className="flex-1">
                <Skeleton className="h-10 w-1/3 mb-3 bg-white/10" />
                <Skeleton className="h-5 w-1/4 mb-4 bg-white/10" />
                <Skeleton className="h-5 w-1/2 bg-white/10" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-40 mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full border border-gray-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Building2 className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Company not found</h2>
          <p className="text-gray-600 mb-6">{error || 'The company you are looking for does not exist.'}</p>
          <Link href="/companies">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Company Header */}
      <div className="bg-gradient-to-b from-[#1a1a3e] to-[#0f0f23] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link 
            href="/companies" 
            className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Company Logo */}
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
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
              <Building2 className={`h-14 w-14 text-gray-500 ${company.logoUrl ? 'hidden' : ''}`} />
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {company.companyName}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                {isLoadingStats ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-28 bg-white/10" />
                    <Skeleton className="h-5 w-10 bg-white/10" />
                    <Skeleton className="h-5 w-24 bg-white/10" />
                  </div>
                ) : (
                  <>
                    {renderStars(companyStats?.averageOverallRating || 0)}
                    <span className="font-bold text-white text-lg">
                      {(companyStats?.averageOverallRating || 0).toFixed(1)}
                    </span>
                    <span className="text-gray-500">({companyStats?.totalReviews || 0} reviews)</span>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-4">
                {company.website && (
                  <a 
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    {company.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2">
                  <Briefcase className="h-4 w-4 mr-2" />
                  {jobsTotalElements} Open Position{jobsTotalElements !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* About Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About Company</h2>
              {company.about ? (
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{company.about}</p>
              ) : (
                <p className="text-gray-500 italic">No company description available.</p>
              )}
            </div>

            {/* Open Positions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Open Positions ({jobsTotalElements})
                </h2>
              </div>

              {isLoadingJobs ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full border border-gray-200 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No open positions at the moment.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/candidate/jobs/${job.id}`}
                        className="block p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-white transition-all group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.address}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-blue-600">{job.workModel}</span>
                              <span className="text-gray-400">•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {job.yearsOfExperience}+ years
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-green-600 text-lg">{job.salaryRange}</p>
                            {job.jobPackage === 'Premium' && (
                              <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 mt-2">
                                HOT
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Jobs Pagination */}
                  {jobsTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setJobsPage(p => Math.max(0, p - 1))}
                        disabled={jobsPage === 0}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {jobsPage + 1} of {jobsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setJobsPage(p => Math.min(jobsTotalPages - 1, p + 1))}
                        disabled={jobsPage === jobsTotalPages - 1}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Company Reviews */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Reviews</h2>
              <CompanyReviews recruiterId={companyId} companyName={company.companyName} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Info Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6 text-lg">Company Information</h3>
              
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Company Name</p>
                  <p className="font-medium text-gray-900">{company.companyName}</p>
                </div>
                
                {company.website && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Website</p>
                    <a 
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      {company.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Open Positions</p>
                  <p className="font-medium text-gray-900">{jobsTotalElements} jobs</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Rating</p>
                  <div className="flex items-center gap-2">
                    {isLoadingStats ? (
                      <Skeleton className="h-5 w-32" />
                    ) : (
                      <>
                        {renderStars(companyStats?.averageOverallRating || 0)}
                        <span className="font-bold text-gray-900">{(companyStats?.averageOverallRating || 0).toFixed(1)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
