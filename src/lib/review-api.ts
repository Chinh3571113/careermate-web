/**
 * Company Review API
 * Handles application, interview, and work experience reviews
 */

import api from '@/lib/api';

// ==================== Types & Interfaces ====================

// Review types - backend uses *_EXPERIENCE
export type ReviewType =
  | 'APPLICATION' | 'INTERVIEW' | 'WORK'
  | 'APPLICATION_EXPERIENCE' | 'INTERVIEW_EXPERIENCE' | 'WORK_EXPERIENCE';

// Normalized review type for API calls (backend enum values)
export type NormalizedReviewType = 'APPLICATION_EXPERIENCE' | 'INTERVIEW_EXPERIENCE' | 'WORK_EXPERIENCE';

// Convert any review type to backend enum value
export const normalizeReviewType = (type: ReviewType): NormalizedReviewType => {
  if (type.includes('APPLICATION')) return 'APPLICATION_EXPERIENCE';
  if (type.includes('INTERVIEW')) return 'INTERVIEW_EXPERIENCE';
  if (type.includes('WORK')) return 'WORK_EXPERIENCE';
  return type as NormalizedReviewType;
};

// Qualification levels for review eligibility
export type ReviewQualification = 'APPLICANT' | 'INTERVIEWED' | 'EMPLOYED' | 'FORMER_EMPLOYEE' | 'HIRED' | 'REJECTED' | 'NOT_ELIGIBLE';

export interface ReviewEligibilityResponse {
  // Primary identification
  jobApplyId?: number;
  candidateId?: number;
  recruiterId?: number;
  companyName?: string;
  
  // Primary fields (either naming convention)
  eligible?: boolean;
  canReview?: boolean;
  reason?: string;
  message?: string;
  
  // Review types (short or long names)
  reviewTypes?: ReviewType[];
  allowedReviewTypes?: ReviewType[];
  eligibleReviewTypes?: ReviewType[]; // Alias used by some pages
  
  // Existing reviews tracking
  existingReviews?: {
    reviewType: string;
    reviewId: number;
  }[];
  alreadyReviewed?: Record<string, boolean>;
  
  // Qualification level
  qualification?: ReviewQualification;
  
  // Time-based eligibility info
  daysSinceApplication?: number;
  daysEmployed?: number;
}

export interface SubmitReviewRequest {
  jobApplyId: number;
  reviewType: NormalizedReviewType;
  overallRating: number; // 1-5 stars
  reviewText: string; // 20-2000 chars

  // Client-only fields (not persisted by current backend)
  reviewTitle?: string;
  
  // Rating categories (flexible - backend may use different field names)
  // Application/Interview ratings
  communicationRating?: number;
  responsivenessRating?: number;
  interviewProcessRating?: number;
  
  // Work experience ratings
  workEnvironmentRating?: number;
  workCultureRating?: number;
  managementRating?: number;
  compensationRating?: number;
  benefitsRating?: number;
  careerGrowthRating?: number;
  workLifeBalanceRating?: number;
  
  // Category ratings (grouped object for form state)
  categoryRatings?: {
    workEnvironment?: number;
    management?: number;
    compensation?: number;
    careerGrowth?: number;
    workLifeBalance?: number;
  };
  
  // Optional fields
  pros?: string;
  cons?: string;
  wouldRecommend?: boolean;
  isAnonymous?: boolean;
}

export interface ReviewResponse {
  id: number;
  candidateId: number;
  candidateName?: string; // Only if not anonymous
  jobApplyId: number;
  recruiterId: number;
  companyName: string;
  jobTitle: string;
  reviewType: ReviewType;
  overallRating: number;
  reviewText: string;
  
  // Category ratings (flexible naming)
  communicationRating?: number;
  responsivenessRating?: number;
  interviewProcessRating?: number;
  workEnvironmentRating?: number;
  workCultureRating?: number;
  managementRating?: number;
  compensationRating?: number;
  benefitsRating?: number;
  careerGrowthRating?: number;
  workLifeBalanceRating?: number;
  
  // Optional fields
  isAnonymous: boolean;
  
  // Status
  status: 'ACTIVE' | 'FLAGGED' | 'REMOVED' | 'ARCHIVED';
  flagCount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface PublicReviewResponse {
  id: number;
  recruiterId: number;
  companyName: string;
  jobPostingId: number;
  jobTitle: string;
  reviewType: ReviewType;
  reviewText: string;
  overallRating: number;
  communicationRating?: number;
  responsivenessRating?: number;
  interviewProcessRating?: number;
  workCultureRating?: number;
  managementRating?: number;
  benefitsRating?: number;
  workLifeBalanceRating?: number;
  isAnonymous: boolean;
  candidateName?: string;
  createdAt: string;

  // Client-only fields (some UIs expect these; backend public DTO may omit them)
  reviewTitle?: string;
  pros?: string;
  cons?: string;
  wouldRecommend?: boolean;
  helpfulCount?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CompanyReviewsResponse {
  // Deprecated: backend returns Spring Page
  reviews: ReviewResponse[];
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  reviewTypeBreakdown: {
    APPLICATION: number;
    INTERVIEW: number;
    WORK: number;
  };
}

export interface CompanyStatisticsResponse {
  recruiterId: number;
  companyName?: string;
  totalReviews: number;
  averageOverallRating: number;
  applicationReviews: number;
  interviewReviews: number;
  workExperienceReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

// Job application with review status for each type
export interface JobApplicationReviewStatus {
  jobApplyId: number;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  appliedAt: string;
  interviewedAt?: string;
  hiredAt?: string;
  daysSinceApplication: number;
  daysEmployed?: number;
  
  // Status for each review type
  applicationReview: ReviewTypeStatus;
  interviewReview: ReviewTypeStatus;
  workReview: ReviewTypeStatus;
}

export interface ReviewTypeStatus {
  status: 'submitted' | 'available' | 'not_eligible';
  reviewId?: number; // If submitted
  rating?: number;   // If submitted
  reason?: string;   // Why not eligible (e.g., "Need 7 more days")
}

// ==================== Review Eligibility ====================

/**
 * Check review eligibility for a candidate
 * GET /api/v1/reviews/eligibility?candidateId={id}&jobApplyId={id}
 */
export const checkReviewEligibility = async (
  candidateId: number,
  jobApplyId: number
): Promise<ReviewEligibilityResponse> => {
  try {
    console.log(`✅ [CHECK ELIGIBILITY] Candidate: ${candidateId}, Job Apply: ${jobApplyId}`);
    const response = await api.get<ApiResponse<ReviewEligibilityResponse>>(
      '/api/v1/reviews/eligibility',
      { params: { candidateId, jobApplyId } }
    );
    console.log('✅ [CHECK ELIGIBILITY] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [CHECK ELIGIBILITY] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to check review eligibility');
  }
};

// ==================== Review Submission ====================

/**
 * Submit a company review
 * POST /api/v1/reviews
 */
export const submitReview = async (
  request: SubmitReviewRequest & { candidateId: number }
): Promise<ReviewResponse> => {
  try {
    console.log('⭐ [SUBMIT REVIEW]', request);
    const { candidateId, ...payload } = request;
    const response = await api.post<ApiResponse<ReviewResponse>>(
      '/api/v1/reviews',
      payload,
      { params: { candidateId } }
    );
    console.log('✅ [SUBMIT REVIEW] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [SUBMIT REVIEW] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to submit review');
  }
};

/**
 * Update an existing review
 * PUT /api/v1/reviews/{reviewId}
 */
export const updateReview = async (
  reviewId: number,
  request: SubmitReviewRequest & { candidateId: number }
): Promise<ReviewResponse> => {
  try {
    console.log('⭐ [UPDATE REVIEW]', reviewId, request);
    // Remove candidateId (sent as query param), but keep jobApplyId (required by backend validation)
    const { candidateId, ...payload } = request;
    const response = await api.put<ApiResponse<ReviewResponse>>(
      `/api/v1/reviews/${reviewId}`,
      payload,
      { params: { candidateId } }
    );
    console.log('✅ [UPDATE REVIEW] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [UPDATE REVIEW] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to update review');
  }
};

// ==================== Review Management ====================

/**
 * Get all reviews for a company (recruiter)
 * GET /api/v1/reviews/company/{recruiterId}
 */
export const getCompanyReviews = async (
  recruiterId: number,
  params?: {
    reviewType?: NormalizedReviewType;
    minRating?: number;
    page?: number;
    size?: number;
  }
): Promise<PageResponse<PublicReviewResponse>> => {
  try {
    console.log(`⭐ [GET COMPANY REVIEWS] Recruiter: ${recruiterId}`, params);
    const response = await api.get<ApiResponse<PageResponse<PublicReviewResponse>>>(
      `/api/v1/reviews/company/${recruiterId}`,
      { params }
    );
    console.log('✅ [GET COMPANY REVIEWS] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [GET COMPANY REVIEWS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch company reviews');
  }
};

/**
 * Get company review statistics
 * GET /api/v1/reviews/company/{recruiterId}/statistics
 */
export const getCompanyStatistics = async (
  recruiterId: number
): Promise<CompanyStatisticsResponse> => {
  try {
    console.log(`📊 [GET STATISTICS] Recruiter: ${recruiterId}`);
    const response = await api.get<ApiResponse<CompanyStatisticsResponse>>(
      `/api/v1/reviews/company/${recruiterId}/statistics`
    );
    console.log('✅ [GET STATISTICS] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [GET STATISTICS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch company statistics');
  }
};

/**
 * Get company overall rating
 * GET /api/v1/reviews/company/{recruiterId}/rating
 */
export const getCompanyRating = async (
  recruiterId: number
): Promise<number> => {
  try {
    console.log(`⭐ [GET RATING] Recruiter: ${recruiterId}`);
    const response = await api.get<ApiResponse<number>>(
      `/api/v1/reviews/company/${recruiterId}/rating`
    );
    console.log('✅ [GET RATING] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [GET RATING] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch company rating');
  }
};

/**
 * Get candidate's submitted reviews
 * GET /api/v1/reviews/my-reviews?candidateId={id}
 */
export const getCandidateReviews = async (
  candidateId: number
): Promise<PageResponse<ReviewResponse>> => {
  try {
    console.log(`⭐ [GET MY REVIEWS] Candidate: ${candidateId}`);
    const response = await api.get<ApiResponse<PageResponse<ReviewResponse>>>(
      '/api/v1/reviews/my-reviews',
      { params: { candidateId } }
    );
    console.log('✅ [GET MY REVIEWS] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [GET MY REVIEWS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch candidate reviews');
  }
};

/**
 * Delete a review (candidate only, within 30 days)
 * DELETE /api/v1/reviews/{reviewId}
 */
export const deleteReview = async (reviewId: number): Promise<void> => {
  try {
    console.log(`🗑️ [DELETE REVIEW] Review ID: ${reviewId}`);
    await api.delete(`/api/v1/reviews/${reviewId}`, { params: { reason: 'Removed' } });
    console.log('✅ [DELETE REVIEW] Success');
  } catch (error: any) {
    console.error('❌ [DELETE REVIEW] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to delete review');
  }
};

/**
 * Get pending reviews (eligible for review but not yet submitted)
 * GET /api/v1/reviews/pending?candidateId={id}
 */
export const getPendingReviews = async (
  candidateId: number
): Promise<ReviewEligibilityResponse[]> => {
  try {
    console.log(`⭐ [GET PENDING REVIEWS] Candidate: ${candidateId}`);
    const response = await api.get<ApiResponse<ReviewEligibilityResponse[]>>(
      '/api/v1/reviews/pending',
      { params: { candidateId } }
    );
    console.log('✅ [GET PENDING REVIEWS] Response:', response.data);
    return response.data.result || [];
  } catch (error: any) {
    console.error('❌ [GET PENDING REVIEWS] Error:', error.response?.data || error);
    // Return empty array instead of throwing to allow graceful degradation
    return [];
  }
};

/**
 * Get all job applications with review status for each review type
 * GET /api/v1/reviews/applications?candidateId={id}
 * Returns grouped data showing which reviews are submitted, available, or not yet eligible
 */
export const getJobApplicationsWithReviewStatus = async (
  candidateId: number
): Promise<JobApplicationReviewStatus[]> => {
  try {
    console.log(`⭐ [GET APPLICATIONS WITH REVIEW STATUS] Candidate: ${candidateId}`);
    const response = await api.get<ApiResponse<JobApplicationReviewStatus[]>>(
      '/api/v1/reviews/applications',
      { params: { candidateId } }
    );
    console.log('✅ [GET APPLICATIONS WITH REVIEW STATUS] Response:', response.data);
    return response.data.result || [];
  } catch (error: any) {
    console.error('❌ [GET APPLICATIONS WITH REVIEW STATUS] Error:', error.response?.data || error);
    return [];
  }
};

/**
 * Flag a review as inappropriate
 * POST /api/v1/reviews/{reviewId}/flag
 */
export const flagReview = async (
  reviewId: number,
  reason: string
): Promise<void> => {
  try {
    console.log(`🚩 [FLAG REVIEW] Review ID: ${reviewId}, Reason: ${reason}`);
    const reporterId = localStorage.getItem('userId');
    await api.post(`/api/v1/reviews/${reviewId}/flag`, null, {
      params: { reporterId: reporterId ? parseInt(reporterId) : undefined, reason }
    });
    console.log('✅ [FLAG REVIEW] Success');
  } catch (error: any) {
    console.error('❌ [FLAG REVIEW] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to flag review');
  }
};

// ==================== Utility Functions ====================

/**
 * Get review type display text
 */
export const getReviewTypeText = (type: ReviewType): string => {
  const typeMap: Record<string, string> = {
    APPLICATION: 'Application Process',
    APPLICATION_EXPERIENCE: 'Application Process',
    INTERVIEW: 'Interview Experience',
    INTERVIEW_EXPERIENCE: 'Interview Experience',
    WORK: 'Work Experience',
    WORK_EXPERIENCE: 'Work Experience',
  };
  return typeMap[type] || type;
};

/**
 * Get review type icon
 */
export const getReviewTypeIcon = (type: ReviewType): string => {
  const iconMap: Record<string, string> = {
    APPLICATION: 'FileText',
    APPLICATION_EXPERIENCE: 'FileText',
    INTERVIEW: 'Calendar',
    INTERVIEW_EXPERIENCE: 'Calendar',
    WORK: 'Briefcase',
    WORK_EXPERIENCE: 'Briefcase',
  };
  return iconMap[type] || 'Star';
};

/**
 * Format star rating for display
 */
export const formatRating = (rating: number): string => {
  return `${rating.toFixed(1)} ⭐`;
};

/**
 * Get rating color based on score
 */
export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 3.5) return 'text-blue-600';
  if (rating >= 2.5) return 'text-yellow-600';
  if (rating >= 1.5) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Get rating background color
 */
export const getRatingBgColor = (rating: number): string => {
  if (rating >= 4.5) return 'bg-green-100 text-green-800 border-green-300';
  if (rating >= 3.5) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (rating >= 2.5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (rating >= 1.5) return 'bg-orange-100 text-orange-800 border-orange-300';
  return 'bg-red-100 text-red-800 border-red-300';
};

/**
 * Calculate review age
 */
export const getReviewAge = (createdAt: string): string => {
  try {
    const reviewDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - reviewDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return 'Recently';
  }
};

/**
 * Check if review is recent (within 30 days)
 */
export const isRecentReview = (createdAt: string): boolean => {
  try {
    const reviewDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - reviewDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  } catch {
    return false;
  }
};

/**
 * Check if review can be deleted (within 30 days)
 */
export const canDeleteReview = (createdAt: string): boolean => {
  return isRecentReview(createdAt);
};

/**
 * Calculate average rating from category ratings
 */
export const calculateAverageFromCategories = (ratings: {
  workEnvironment?: number;
  management?: number;
  compensation?: number;
  careerGrowth?: number;
  workLifeBalance?: number;
}): number => {
  const values = Object.values(ratings).filter((v): v is number => v !== undefined);
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

/**
 * Render star rating (string representation)
 */
export const renderStarRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '⭐'.repeat(fullStars) + 
         (hasHalfStar ? '⭐' : '') + 
         '☆'.repeat(emptyStars);
};

/**
 * Get review status color
 */
export const getReviewStatusColor = (status: ReviewResponse['status']): string => {
  const colorMap: Record<ReviewResponse['status'], string> = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-300',
    FLAGGED: 'bg-amber-100 text-amber-800 border-amber-300',
    REMOVED: 'bg-red-100 text-red-800 border-red-300',
    ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

// ==================== Admin Review Management ====================

export interface AdminReviewFilterRequest {
  searchText?: string;         // Combined search: company name, candidate name, job title, review content
  reviewType?: ReviewType;
  status?: 'ACTIVE' | 'HIDDEN' | 'FLAGGED' | 'REMOVED' | 'ARCHIVED';
  startDate?: string;          // ISO date string (YYYY-MM-DD)
  endDate?: string;
  minRating?: number;
  maxRating?: number;
  flaggedOnly?: boolean;
  minFlagCount?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface AdminReviewResponse {
  id: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  recruiterId: number;
  companyName: string;
  jobPostingId: number;
  jobTitle: string;
  jobApplyId: number;
  reviewType: ReviewType;
  status: 'ACTIVE' | 'HIDDEN' | 'FLAGGED' | 'REMOVED' | 'ARCHIVED';
  reviewText: string;
  overallRating: number;
  
  // Category ratings (actual backend fields)
  communicationRating?: number;      // All types
  responsivenessRating?: number;     // APPLICATION, INTERVIEW
  interviewProcessRating?: number;   // INTERVIEW, WORK_EXPERIENCE
  workCultureRating?: number;        // WORK_EXPERIENCE only
  managementRating?: number;         // WORK_EXPERIENCE only
  benefitsRating?: number;           // WORK_EXPERIENCE only
  workLifeBalanceRating?: number;    // WORK_EXPERIENCE only
  
  createdAt: string;
  updatedAt?: string;
  isAnonymous: boolean;
  isVerified: boolean;
  flagCount?: number;
  removalReason?: string;
  sentimentScore?: number;
}

export interface AdminBulkActionRequest {
  reviewIds: number[];
  newStatus: 'ACTIVE' | 'HIDDEN' | 'REMOVED';
  reason?: string;
}

export interface AdminReviewStats {
  totalReviews: number;
  activeReviews: number;
  hiddenReviews: number;
  flaggedReviews: number;
  removedReviews: number;
  application_experienceCount?: number;
  interview_experienceCount?: number;
  work_experienceCount?: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

/**
 * Admin: Search and filter reviews with advanced options
 */
export const adminSearchReviews = async (
  filters: AdminReviewFilterRequest
): Promise<{ content: AdminReviewResponse[]; totalElements: number; totalPages: number }> => {
  // Clean up filters: remove undefined values and convert dates properly
  const cleanFilters: Record<string, any> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Convert date strings to ISO format for backend
      if ((key === 'startDate' || key === 'endDate') && value) {
        // Backend expects LocalDateTime, convert date string to ISO format
        cleanFilters[key] = value + 'T00:00:00';
      } else {
        cleanFilters[key] = value;
      }
    }
  });
  
  console.log('📤 Sending search filters:', cleanFilters);
  const response = await api.post('/api/v1/admin/reviews/search', cleanFilters);
  console.log('📥 Search response:', response.data);
  return response.data.result;
};

/**
 * Admin: Update single review status
 */
export const adminUpdateReviewStatus = async (
  reviewId: number,
  newStatus: 'ACTIVE' | 'HIDDEN' | 'REMOVED',
  reason?: string
): Promise<AdminReviewResponse> => {
  const params = new URLSearchParams();
  params.append('newStatus', newStatus);
  if (reason) params.append('reason', reason);
  
  const url = `/api/v1/admin/reviews/${reviewId}/status?${params.toString()}`;
  console.log(`📤 Updating review ${reviewId} to status: ${newStatus}`);
  console.log(`📤 Full URL:`, url);
  console.log(`📤 Query params:`, params.toString());
  
  try {
    const response = await api.put(url);
    console.log('📥 Update response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ API Error Response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

/**
 * Admin: Bulk update review statuses
 */
export const adminBulkUpdateReviews = async (
  request: AdminBulkActionRequest
): Promise<string> => {
  console.log('📤 Bulk updating reviews:', request);
  const response = await api.post('/api/v1/admin/reviews/bulk-action', request);
  console.log('📥 Bulk update response:', response.data);
  return response.data.result;
};

/**
 * Admin: Get review statistics
 */
export const adminGetReviewStats = async (): Promise<AdminReviewStats> => {
  const response = await api.get('/api/v1/admin/reviews/stats');
  return response.data.result;
};

// ==================== Recruiter Review Viewing ====================

/**
 * Recruiter: Get reviews for their company (read-only)
 */
export const recruiterGetCompanyReviews = async (params: {
  page?: number;
  size?: number;
  reviewType?: string;
  startDate?: string;
  endDate?: string;
  rating?: number;
  maxRating?: number;
  searchText?: string;
}): Promise<{ content: AdminReviewResponse[]; totalElements: number; totalPages: number }> => {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());
  if (params.reviewType) queryParams.append('reviewType', params.reviewType);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.rating !== undefined) queryParams.append('rating', params.rating.toString());
  if (params.maxRating !== undefined) queryParams.append('maxRating', params.maxRating.toString());
  if (params.searchText) queryParams.append('searchText', params.searchText);
  
  const response = await api.get(`/api/v1/recruiter/reviews/my-company?${queryParams.toString()}`);
  return response.data.result;
};

/**
 * Recruiter: Get statistics for their company
 */
export const recruiterGetStats = async (): Promise<{
  totalActiveReviews: number;
  application_experienceCount?: number;
  interview_experienceCount?: number;
  work_experienceCount?: number;
  averageOverallRating: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}> => {
  const response = await api.get('/api/v1/recruiter/reviews/stats');
  return response.data.result;
};

