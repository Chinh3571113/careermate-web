/**
 * Employment Verification API
 * Handles employment creation, termination, and verification
 */

import api from '@/lib/api';

// ==================== Types & Interfaces ====================

export interface EmploymentVerificationRequest {
  startDate: string; // "YYYY-MM-DD" format
  position: string;
  department?: string;
  salary?: number;
  probationEndDate?: string;
  notes?: string;
}

// Simplified response from backend v3.1
export interface EmploymentVerificationResponse {
  id: number;
  jobApplyId: number;
  companyName?: string;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
  daysEmployed?: number;
  createdAt: string;
  updatedAt?: string;
  // Computed fields from backend
  isEligibleForWorkReview?: boolean;
  isCurrentlyEmployed?: boolean;
}

export type TerminationType = 
  | 'RESIGNATION' 
  | 'FIRED_PERFORMANCE' 
  | 'FIRED_MISCONDUCT' 
  | 'CONTRACT_END' 
  | 'MUTUAL_AGREEMENT' 
  | 'PROBATION_FAILED' 
  | 'COMPANY_CLOSURE' 
  | 'LAYOFF';

export interface TerminateEmploymentRequest {
  terminationType: TerminationType;
  terminationDate: string; // "YYYY-MM-DD" format
  reason?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

// ==================== Employment Verification ====================

/**
 * Create employment verification after hiring
 * POST /api/employment-verifications/job-apply/{jobApplyId}
 */
export const createEmploymentVerification = async (
  jobApplyId: number,
  request: EmploymentVerificationRequest
): Promise<EmploymentVerificationResponse> => {
  try {
    console.log(`💼 [CREATE EMPLOYMENT] Job Apply ID: ${jobApplyId}`, request);
    const response = await api.post<ApiResponse<EmploymentVerificationResponse>>(
      `/api/employment-verifications/job-apply/${jobApplyId}`,
      request
    );
    console.log('✅ [CREATE EMPLOYMENT] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [CREATE EMPLOYMENT] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to create employment verification');
  }
};

/**
 * Get employment verification by job application
 * GET /api/employment-verifications/job-apply/{jobApplyId}
 */
export const getEmploymentVerification = async (
  jobApplyId: number
): Promise<EmploymentVerificationResponse> => {
  try {
    console.log(`💼 [GET EMPLOYMENT] Job Apply ID: ${jobApplyId}`);
    const response = await api.get<ApiResponse<EmploymentVerificationResponse>>(
      `/api/employment-verifications/job-apply/${jobApplyId}`
    );
    console.log('✅ [GET EMPLOYMENT] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [GET EMPLOYMENT] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch employment verification');
  }
};

/**
 * Terminate employment
 * POST /api/employment-verifications/job-apply/{jobApplyId}/terminate
 */
export const terminateEmployment = async (
  jobApplyId: number,
  request: TerminateEmploymentRequest
): Promise<EmploymentVerificationResponse> => {
  try {
    console.log(`🏁 [TERMINATE EMPLOYMENT] Job Apply ID: ${jobApplyId}`, request);
    const response = await api.post<ApiResponse<EmploymentVerificationResponse>>(
      `/api/employment-verifications/job-apply/${jobApplyId}/terminate`,
      request
    );
    console.log('✅ [TERMINATE EMPLOYMENT] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [TERMINATE EMPLOYMENT] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to terminate employment');
  }
};

/**
 * Get active employments for a recruiter
 * GET /api/employment-verifications/recruiter/active
 */
export const getRecruiterActiveEmployments = async (): Promise<EmploymentVerificationResponse[]> => {
  try {
    console.log('💼 [GET ACTIVE EMPLOYMENTS]');
    const response = await api.get<ApiResponse<EmploymentVerificationResponse[]>>(
      '/api/employment-verifications/recruiter/active'
    );
    console.log('✅ [GET ACTIVE EMPLOYMENTS] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [GET ACTIVE EMPLOYMENTS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch active employments');
  }
};

/**
 * Get employment verification by job application
 * GET /api/employment-verifications/job-apply/{jobApplyId}
 */
export const getEmploymentByJobApply = async (
  jobApplyId: number
): Promise<EmploymentVerificationResponse> => {
  try {
    console.log(`💼 [GET EMPLOYMENT BY JOB APPLY] Job Apply ID: ${jobApplyId}`);
    const response = await api.get<ApiResponse<EmploymentVerificationResponse>>(
      `/api/employment-verifications/job-apply/${jobApplyId}`
    );
    console.log('✅ [GET EMPLOYMENT BY JOB APPLY] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [GET EMPLOYMENT BY JOB APPLY] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch employment verification');
  }
};

/**
 * Confirm 30-day employment status (candidate action)
 * POST /api/employment-verifications/{verificationId}/confirm-30-days
 */
export const confirmEmployment30Days = async (
  verificationId: number,
  stillEmployed: boolean,
  terminationDetails?: {
    terminationType?: string;
    terminationDate?: string;
    reasonForLeaving?: string;
  }
): Promise<EmploymentVerificationResponse> => {
  try {
    console.log(`✅ [CONFIRM 30 DAYS] Verification ID: ${verificationId}, Still Employed: ${stillEmployed}`);
    const response = await api.post<ApiResponse<EmploymentVerificationResponse>>(
      `/api/employment-verifications/${verificationId}/confirm-30-days`,
      {
        stillEmployed,
        ...terminationDetails
      }
    );
    console.log('✅ [CONFIRM 30 DAYS] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [CONFIRM 30 DAYS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to confirm 30-day status');
  }
};

/**
 * Confirm 90-day employment status (candidate action)
 * POST /api/employment-verifications/{verificationId}/confirm-90-days
 */
export const confirmEmployment90Days = async (
  verificationId: number,
  stillEmployed: boolean,
  terminationDetails?: {
    terminationType?: string;
    terminationDate?: string;
    reasonForLeaving?: string;
  }
): Promise<EmploymentVerificationResponse> => {
  try {
    console.log(`✅ [CONFIRM 90 DAYS] Verification ID: ${verificationId}, Still Employed: ${stillEmployed}`);
    const response = await api.post<ApiResponse<EmploymentVerificationResponse>>(
      `/api/employment-verifications/${verificationId}/confirm-90-days`,
      {
        stillEmployed,
        ...terminationDetails
      }
    );
    console.log('✅ [CONFIRM 90 DAYS] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [CONFIRM 90 DAYS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to confirm 90-day status');
  }
};

// ==================== Utility Functions ====================

/**
 * Calculate employment duration in days
 */
export const calculateEmploymentDuration = (
  startDate: string,
  endDate?: string
): number => {
  try {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

/**
 * Format employment duration for display
 */
export const formatEmploymentDuration = (
  startDate: string,
  endDate?: string
): string => {
  const days = calculateEmploymentDuration(startDate, endDate);
  
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(days / 365);
    const remainingMonths = Math.floor((days % 365) / 30);
    if (remainingMonths > 0) {
      return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
};

/**
 * Check if still within probation period
 */
export const isInProbation = (
  startDate: string,
  probationEndDate?: string
): boolean => {
  if (!probationEndDate) return false;
  
  try {
    const now = new Date();
    const probationEnd = new Date(probationEndDate);
    return now <= probationEnd;
  } catch {
    return false;
  }
};

/**
 * Check if eligible to submit work review (30+ days employed)
 */
export const isEligibleForReview = (startDate: string, endDate?: string): boolean => {
  return calculateEmploymentDuration(startDate, endDate) >= 30;
};

/**
 * Get employment status color
 */
export const getEmploymentStatusColor = (status: 'ACTIVE' | 'TERMINATED'): string => {
  return status === 'ACTIVE' 
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Format date for display
 */
export const formatEmploymentDate = (date: string): string => {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return date;
  }
};
