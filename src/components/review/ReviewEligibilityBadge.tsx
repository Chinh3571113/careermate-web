/**
 * ReviewEligibilityBadge Component
 * Shows review eligibility status with actionable CTA directly on job cards
 * Production-ready with loading states, tooltips, and smooth animations
 */

"use client";

import { memo, useMemo, useState } from 'react';
import { Star, Clock, MessageSquare, Briefcase, Calendar, HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type ReviewType, getReviewTypeText } from '@/lib/review-api';

export interface ReviewEligibilityBadgeProps {
  eligible: boolean;
  reviewTypes: ReviewType[];
  qualification: string;
  message?: string;
  loading?: boolean;
  existingReviews?: { reviewType: string; reviewId: number }[];
  onReviewClick?: (reviewType: ReviewType) => void;
  variant?: 'compact' | 'full' | 'inline';
  className?: string;
  // For calculating days until eligible
  daysSinceApplication?: number;
}

/**
 * Get icon for review type
 */
const getReviewTypeIcon = (type: ReviewType) => {
  if (type.includes('WORK')) return <Briefcase className="w-3.5 h-3.5" />;
  if (type.includes('INTERVIEW')) return <Calendar className="w-3.5 h-3.5" />;
  return <MessageSquare className="w-3.5 h-3.5" />;
};

/**
 * Get badge variant based on qualification
 */
const getQualificationBadgeColor = (qualification: string) => {
  switch (qualification) {
    case 'HIRED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'INTERVIEWED':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'REJECTED':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'APPLICANT':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
  }
};

/**
 * Get CTA text based on qualification
 */
const getCtaText = (qualification: string, reviewTypes: ReviewType[]) => {
  if (reviewTypes.length === 0) return 'Not eligible yet';
  
  switch (qualification) {
    case 'HIRED':
      return 'Rate your employer';
    case 'INTERVIEWED':
      return 'Rate your interview';
    case 'REJECTED':
    case 'APPLICANT':
      return 'Share your experience';
    default:
      return 'Write a review';
  }
};

/**
 * Loading skeleton for the badge
 */
const LoadingSkeleton = () => (
  <div className="flex items-center gap-2 animate-pulse">
    <div className="w-4 h-4 bg-gray-200 rounded" />
    <div className="w-24 h-5 bg-gray-200 rounded" />
  </div>
);

const ReviewEligibilityBadge = memo(function ReviewEligibilityBadge({
  eligible,
  reviewTypes,
  qualification,
  message,
  loading,
  existingReviews = [],
  onReviewClick,
  variant = 'inline',
  className,
  daysSinceApplication,
}: ReviewEligibilityBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter out already reviewed types
  const availableReviewTypes = useMemo(() => {
    const reviewedTypes = new Set(existingReviews.map(r => r.reviewType));
    return reviewTypes.filter(type => {
      // Normalize comparison
      const normalizedType = type.includes('_EXPERIENCE') ? type : `${type}_EXPERIENCE`;
      return !reviewedTypes.has(normalizedType) && !reviewedTypes.has(type);
    });
  }, [reviewTypes, existingReviews]);

  const hasAvailableReviews = availableReviewTypes.length > 0;
  const allReviewed = reviewTypes.length > 0 && availableReviewTypes.length === 0;

  // Days until eligible (if not yet eligible)
  const daysUntilEligible = useMemo(() => {
    if (eligible || daysSinceApplication === undefined) return null;
    const daysNeeded = 7 - daysSinceApplication;
    return daysNeeded > 0 ? daysNeeded : null;
  }, [eligible, daysSinceApplication]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Compact variant - just an icon badge
  if (variant === 'compact') {
    if (!eligible && !daysUntilEligible) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => hasAvailableReviews && onReviewClick?.(availableReviewTypes[0])}
              disabled={!hasAvailableReviews}
              className={cn(
                'p-1.5 rounded-full transition-all',
                hasAvailableReviews
                  ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 cursor-pointer'
                  : allReviewed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500',
                className
              )}
            >
              <Star className={cn('w-4 h-4', hasAvailableReviews && 'fill-yellow-500')} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {allReviewed ? (
              <p>Already reviewed ✓</p>
            ) : hasAvailableReviews ? (
              <p>{getCtaText(qualification, availableReviewTypes)}</p>
            ) : daysUntilEligible ? (
              <p>Review available in {daysUntilEligible} days</p>
            ) : (
              <p>Not eligible for review</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant - expanded card with all options
  if (variant === 'full') {
    return (
      <div className={cn('rounded-lg border p-4', className)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className={cn('w-5 h-5', hasAvailableReviews ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400')} />
            <span className="font-medium text-gray-900">
              {allReviewed ? 'Reviews Submitted' : hasAvailableReviews ? 'Share Your Experience' : 'Review Status'}
            </span>
          </div>
          <Badge variant="outline" className={cn('text-xs', getQualificationBadgeColor(qualification))}>
            {qualification.replace('_', ' ')}
          </Badge>
        </div>

        {message && (
          <p className="text-sm text-gray-600 mb-3">{message}</p>
        )}

        {hasAvailableReviews ? (
          <div className="space-y-2">
            {availableReviewTypes.map(type => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="w-full justify-between hover:bg-yellow-50 hover:border-yellow-300"
                onClick={() => onReviewClick?.(type)}
              >
                <span className="flex items-center gap-2">
                  {getReviewTypeIcon(type)}
                  {getReviewTypeText(type)}
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ))}
          </div>
        ) : allReviewed ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md p-2">
            <Star className="w-4 h-4 fill-green-500" />
            Thank you for your feedback!
          </div>
        ) : daysUntilEligible ? (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-md p-2">
            <Clock className="w-4 h-4" />
            You can review in {daysUntilEligible} day{daysUntilEligible > 1 ? 's' : ''}
          </div>
        ) : null}
      </div>
    );
  }

  // Inline variant (default) - badge with expandable review options
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Main eligibility indicator */}
      {hasAvailableReviews ? (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100 hover:border-yellow-400"
            onClick={() => {
              if (availableReviewTypes.length === 1) {
                onReviewClick?.(availableReviewTypes[0]);
              } else {
                setIsExpanded(!isExpanded);
              }
            }}
          >
            <Star className="w-3.5 h-3.5 fill-yellow-500" />
            {getCtaText(qualification, availableReviewTypes)}
            {availableReviewTypes.length > 1 && (
              <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-90')} />
            )}
          </Button>

          {/* Expandable review type selector */}
          {isExpanded && availableReviewTypes.length > 1 && (
            <div className="flex flex-wrap gap-1.5 w-full mt-2">
              {availableReviewTypes.map(type => (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 bg-yellow-50 hover:bg-yellow-100"
                  onClick={() => onReviewClick?.(type)}
                >
                  {getReviewTypeIcon(type)}
                  {getReviewTypeText(type)}
                </Button>
              ))}
            </div>
          )}
        </>
      ) : allReviewed ? (
        <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
          <Star className="w-3 h-3 mr-1 fill-green-500" />
          Reviewed
        </Badge>
      ) : daysUntilEligible ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-600 cursor-help">
                <Clock className="w-3 h-3 mr-1" />
                Review in {daysUntilEligible}d
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>You can write a review after 7 days of applying</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}

      {/* Show existing reviews count if any */}
      {existingReviews.length > 0 && !allReviewed && (
        <span className="text-xs text-gray-500">
          ({existingReviews.length} submitted)
        </span>
      )}
    </div>
  );
});

export default ReviewEligibilityBadge;
