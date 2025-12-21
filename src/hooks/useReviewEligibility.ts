/**
 * useReviewEligibility Hook
 * Manages review eligibility checking for job applications
 * Production-ready with caching, batch fetching, and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { checkReviewEligibility, type ReviewEligibilityResponse, type ReviewType } from '@/lib/review-api';

export interface ReviewEligibilityState {
  eligible: boolean;
  reviewTypes: ReviewType[];
  message: string;
  qualification: string;
  loading: boolean;
  error: string | null;
  existingReviews: { reviewType: string; reviewId: number }[];
}

const DEFAULT_STATE: ReviewEligibilityState = {
  eligible: false,
  reviewTypes: [],
  message: '',
  qualification: 'NOT_ELIGIBLE',
  loading: true,
  error: null,
  existingReviews: [],
};

// Cache for eligibility results (avoid repeated API calls)
const eligibilityCache = new Map<string, { data: ReviewEligibilityState; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Hook for checking review eligibility for a single job application
 */
export function useReviewEligibility(
  candidateId: number | null,
  jobApplyId: number | null,
  options: { enabled?: boolean; skipCache?: boolean } = {}
): ReviewEligibilityState & { refetch: () => Promise<void> } {
  const { enabled = true, skipCache = false } = options;
  const [state, setState] = useState<ReviewEligibilityState>(DEFAULT_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchEligibility = useCallback(async () => {
    if (!candidateId || !jobApplyId || !enabled) {
      setState({ ...DEFAULT_STATE, loading: false });
      return;
    }

    const cacheKey = `${candidateId}-${jobApplyId}`;
    
    // Check cache first
    if (!skipCache) {
      const cached = eligibilityCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setState(cached.data);
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await checkReviewEligibility(candidateId, jobApplyId);
      
      const newState: ReviewEligibilityState = {
        eligible: response.eligible || response.canReview || false,
        reviewTypes: response.reviewTypes || response.allowedReviewTypes || response.eligibleReviewTypes || [],
        message: response.message || response.reason || '',
        qualification: response.qualification || 'NOT_ELIGIBLE',
        loading: false,
        error: null,
        existingReviews: response.existingReviews || [],
      };

      // Cache the result
      eligibilityCache.set(cacheKey, { data: newState, timestamp: Date.now() });
      setState(newState);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      setState({
        ...DEFAULT_STATE,
        loading: false,
        error: error.message || 'Failed to check review eligibility',
      });
    }
  }, [candidateId, jobApplyId, enabled, skipCache]);

  useEffect(() => {
    fetchEligibility();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchEligibility]);

  return { ...state, refetch: fetchEligibility };
}

/**
 * Hook for checking review eligibility for multiple job applications at once
 * Optimizes by batching requests and using cache
 */
export function useBatchReviewEligibility(
  candidateId: number | null,
  jobApplyIds: number[],
  options: { enabled?: boolean } = {}
): {
  eligibilityMap: Map<number, ReviewEligibilityState>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { enabled = true } = options;
  const [eligibilityMap, setEligibilityMap] = useState<Map<number, ReviewEligibilityState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllEligibility = useCallback(async () => {
    if (!candidateId || !enabled || jobApplyIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const newMap = new Map<number, ReviewEligibilityState>();
    const uncachedIds: number[] = [];

    // Check cache first
    for (const jobApplyId of jobApplyIds) {
      const cacheKey = `${candidateId}-${jobApplyId}`;
      const cached = eligibilityCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        newMap.set(jobApplyId, cached.data);
      } else {
        uncachedIds.push(jobApplyId);
      }
    }

    // Fetch uncached in parallel (with concurrency limit)
    const BATCH_SIZE = 5;
    const batches = [];
    for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
      batches.push(uncachedIds.slice(i, i + BATCH_SIZE));
    }

    try {
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map(id => checkReviewEligibility(candidateId, id))
        );

        results.forEach((result, index) => {
          const jobApplyId = batch[index];
          const cacheKey = `${candidateId}-${jobApplyId}`;

          if (result.status === 'fulfilled') {
            const response = result.value;
            const state: ReviewEligibilityState = {
              eligible: response.eligible || response.canReview || false,
              reviewTypes: response.reviewTypes || response.allowedReviewTypes || response.eligibleReviewTypes || [],
              message: response.message || response.reason || '',
              qualification: response.qualification || 'NOT_ELIGIBLE',
              loading: false,
              error: null,
              existingReviews: response.existingReviews || [],
            };
            newMap.set(jobApplyId, state);
            eligibilityCache.set(cacheKey, { data: state, timestamp: Date.now() });
          } else {
            newMap.set(jobApplyId, {
              ...DEFAULT_STATE,
              loading: false,
              error: result.reason?.message || 'Failed to check eligibility',
            });
          }
        });
      }

      setEligibilityMap(newMap);
    } catch (err: any) {
      setError(err.message || 'Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  }, [candidateId, jobApplyIds, enabled]);

  useEffect(() => {
    fetchAllEligibility();
  }, [fetchAllEligibility]);

  return { eligibilityMap, loading, error, refetch: fetchAllEligibility };
}

/**
 * Clear eligibility cache (useful after submitting a review)
 */
export function clearEligibilityCache(candidateId?: number, jobApplyId?: number) {
  if (candidateId && jobApplyId) {
    eligibilityCache.delete(`${candidateId}-${jobApplyId}`);
  } else {
    eligibilityCache.clear();
  }
}

/**
 * Get human-readable eligibility message based on qualification
 */
export function getEligibilityMessage(qualification: string, daysSinceApplication?: number): string {
  switch (qualification) {
    case 'HIRED':
      return 'Share your work experience with future candidates';
    case 'INTERVIEWED':
      return 'Share your interview experience';
    case 'REJECTED':
      return 'Help others by sharing your application experience';
    case 'APPLICANT':
      return 'Share how responsive the company was';
    case 'NOT_ELIGIBLE':
      if (daysSinceApplication !== undefined && daysSinceApplication < 7) {
        return `You can review in ${7 - daysSinceApplication} days`;
      }
      return 'Not yet eligible to review';
    default:
      return '';
  }
}

/**
 * Get review type priority order (for displaying main review CTA)
 */
export function getReviewTypePriority(reviewType: ReviewType): number {
  const priority: Record<string, number> = {
    WORK_EXPERIENCE: 1,
    INTERVIEW_EXPERIENCE: 2,
    APPLICATION_EXPERIENCE: 3,
    WORK: 1,
    INTERVIEW: 2,
    APPLICATION: 3,
  };
  return priority[reviewType] || 999;
}
