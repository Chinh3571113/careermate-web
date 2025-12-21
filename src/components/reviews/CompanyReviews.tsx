"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, User, Building2, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCompanyReviews,
  getCompanyStatistics,
  type NormalizedReviewType,
  type PublicReviewResponse,
  type CompanyStatisticsResponse
} from "@/lib/review-api";
import { useAuthStore } from "@/store/use-auth-store";
import { isRecruiter } from "@/lib/role-utils";

interface CompanyReviewsProps {
  recruiterId: number;
  companyName?: string;
  variant?: 'light' | 'dark';
}

export default function CompanyReviews({ recruiterId, companyName, variant = 'light' }: CompanyReviewsProps) {
  const isDark = variant === 'dark';
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<PublicReviewResponse[]>([]);
  const [statistics, setStatistics] = useState<CompanyStatisticsResponse | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'APPLICATION' | 'INTERVIEW' | 'WORK'>('ALL');
  const [expanded, setExpanded] = useState(false);

  const role = useAuthStore((s) => s.role);
  const canBrowseReviewList = !!role && !isRecruiter(role);

  useEffect(() => {
    loadReviews();
  }, [recruiterId, filter, expanded, canBrowseReviewList]);

  const toBackendReviewType = (value: typeof filter): NormalizedReviewType | undefined => {
    if (value === 'ALL') return undefined;
    return `${value}_EXPERIENCE` as NormalizedReviewType;
  };

  const loadReviews = async () => {
    try {
      setLoading(true);

      // Business rule: recruiters must not be able to browse/monitor review listings.
      // They may still see aggregates (rating/statistics).
      const statsPromise = getCompanyStatistics(recruiterId);
      const reviewsPromise = canBrowseReviewList
        ? getCompanyReviews(recruiterId, {
            reviewType: toBackendReviewType(filter),
            size: expanded ? 20 : 5,
          })
        : Promise.resolve({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 });

      const [reviewsData, statsData] = await Promise.all([reviewsPromise, statsPromise]);

      setReviews(reviewsData.content || []);
      setStatistics(statsData);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : isDark ? 'text-gray-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getReviewTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = isDark
      ? {
          APPLICATION_EXPERIENCE: {
            label: 'Application',
            className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          },
          INTERVIEW_EXPERIENCE: {
            label: 'Interview',
            className: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          },
          WORK_EXPERIENCE: {
            label: 'Work Experience',
            className: 'bg-green-500/20 text-green-300 border border-green-500/30'
          }
        }
      : {
          APPLICATION_EXPERIENCE: { label: 'Application', className: 'bg-blue-100 text-blue-800' },
          INTERVIEW_EXPERIENCE: { label: 'Interview', className: 'bg-purple-100 text-purple-800' },
          WORK_EXPERIENCE: { label: 'Work Experience', className: 'bg-green-100 text-green-800' }
        };
    const { label, className } =
      config[type] ||
      (isDark
        ? { label: type, className: 'bg-white/10 text-gray-200 border border-white/10' }
        : { label: type, className: 'bg-gray-100 text-gray-800' });
    return <Badge className={className}>{label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !statistics) {
    return (
      <div className="space-y-4">
        <Skeleton className={`h-32 w-full ${isDark ? 'bg-white/10' : ''}`} />
        <Skeleton className={`h-24 w-full ${isDark ? 'bg-white/10' : ''}`} />
        <Skeleton className={`h-24 w-full ${isDark ? 'bg-white/10' : ''}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card className={isDark ? 'bg-white/5 border-white/10' : undefined}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-yellow-100'}`}>
                <Star className={`h-6 w-6 ${isDark ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-600 fill-yellow-600'}`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : ''}`}>Company Reviews</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {statistics?.totalReviews || 0} reviews from employees & applicants
                </p>
              </div>
            </div>
            {statistics && (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {statistics.averageOverallRating?.toFixed(1) || '0.0'}
                  </span>
                  {renderStars(Math.round(statistics.averageOverallRating || 0), 'md')}
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Public reviews</p>
              </div>
            )}
          </div>
        </CardHeader>
        
        {statistics && (
          <CardContent className="pt-0">
            {/* Rating Distribution */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = (statistics.ratingDistribution?.[rating] as number) || 0;
                const percentage = statistics.totalReviews ? (count / statistics.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className={`text-xs w-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{rating}</span>
                    <Progress value={percentage} className="h-2 flex-1" />
                    <span className={`text-xs w-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Review Type Breakdown */}
            <div className={`flex gap-4 pt-3 border-t ${isDark ? 'border-white/10' : ''}`}>
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-600">{statistics.applicationReviews || 0}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Application</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-purple-600">{statistics.interviewReviews || 0}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Interview</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">{statistics.workExperienceReviews || 0}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Work</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filter */}
      {canBrowseReviewList ? (
        <div className="flex items-center gap-3">
          <Filter className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className={`w-[180px] ${isDark ? 'bg-white/5 border-white/10 text-white' : ''}`}>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Reviews</SelectItem>
              <SelectItem value="APPLICATION">Application Reviews</SelectItem>
              <SelectItem value="INTERVIEW">Interview Reviews</SelectItem>
              <SelectItem value="WORK">Work Experience</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <Card className={isDark ? 'bg-white/5 border-white/10' : undefined}>
          <CardContent className={`py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Review details are only visible to candidates and admins.
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {!canBrowseReviewList ? null : reviews.length === 0 ? (
        <Card className={isDark ? 'bg-white/5 border-white/10' : undefined}>
          <CardContent className="py-8 text-center">
            <Building2 className={`h-12 w-12 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />
            <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Reviews Yet</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Be the first to share your experience with this company.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className={isDark ? 'bg-white/5 border-white/10' : undefined}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                      <User className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {review.isAnonymous || !review.candidateName ? 'Anonymous' : review.candidateName}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(review.jobTitle || 'Unknown role')} • {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getReviewTypeBadge(review.reviewType)}
                    {renderStars(review.overallRating)}
                  </div>
                </div>

                {review.reviewTitle && (
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{review.reviewTitle}</h4>
                )}
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{review.reviewText}</p>

                {/* Pros & Cons */}
                {(review.pros || review.cons) && (
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {review.pros && (
                      <div className={`rounded-lg p-3 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-green-50'}`}>
                        <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-green-700'}`}>Pros</p>
                        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-green-800'}`}>{review.pros}</p>
                      </div>
                    )}
                    {review.cons && (
                      <div className={`rounded-lg p-3 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-red-50'}`}>
                        <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-red-700'}`}>Cons</p>
                        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-red-800'}`}>{review.cons}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Would Recommend */}
                <div className={`flex items-center gap-4 pt-3 border-t ${isDark ? 'border-white/10' : ''}`}>
                  {review.wouldRecommend !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <ThumbsUp className={`h-4 w-4 ${review.wouldRecommend ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={review.wouldRecommend ? 'text-green-700' : 'text-gray-500'}>
                        {review.wouldRecommend ? 'Recommends' : 'Does not recommend'}
                      </span>
                    </div>
                  )}
                  <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <ThumbsUp className="h-3 w-3" />
                    <span>{review.helpfulCount || 0} found helpful</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Show More / Less Button */}
          {(statistics?.totalReviews || 0) > 5 && (
            <Button
              variant="outline"
              className={`w-full ${isDark ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
              onClick={() => {
                setExpanded((prev) => !prev);
              }}
            >
              <ChevronDown className={`h-4 w-4 mr-2 ${expanded ? 'rotate-180' : ''}`} />
              {expanded ? 'Show Less' : `Show All ${statistics?.totalReviews} Reviews`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
