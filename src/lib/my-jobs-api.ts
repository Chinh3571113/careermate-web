import api from '@/lib/api';
import { JobApplicationStatus } from '@/types/status';
import {
  getStatusColor as getStatusColorUtil,
  getStatusText as getStatusTextUtil,
  normalizeStatus,
} from '@/lib/status-utils';

// API Response Interfaces
export interface JobApplication {
  id: number;
  jobPostingId: number;
  jobTitle: string;
  jobDescription: string;
  expirationDate: string;
  candidateId: number;
  cvFilePath: string;
  fullName: string;
  phoneNumber: string;
  preferredWorkLocation: string;
  coverLetter: string;
  status: JobApplicationStatus;
  createAt: string;
  // Contact info - only populated when status >= APPROVED
  companyName?: string;
  companyEmail?: string;
  recruiterPhone?: string;
  companyAddress?: string;
  contactPerson?: string;
}

export interface MyJobsResponse {
  code: number;
  message: string;
  result: JobApplication[];
}

/**
 * Fetch job applications for a specific candidate
 * @param candidateId - The ID of the candidate
 * @returns Promise with job applications array
 */
export const fetchMyJobApplications = async (candidateId: number): Promise<JobApplication[]> => {
  try {
    console.log(`📋 Fetching job applications for candidate ID: ${candidateId}`);
    
    const response = await api.get<MyJobsResponse>(`/api/job-apply/candidate/${candidateId}`);
    
    console.log('✅ My Jobs API Response:', response.data);
    
    if (response.data?.result) {
      return response.data.result;
    }
    
    return [];
  } catch (error: any) {
    console.error('❌ Error fetching my job applications:', error);
    console.error('Error details:', error?.response?.data);
    throw error;
  }
};

/**
 * Get status badge color based on application status
 * @deprecated Use getStatusColor from @/lib/status-utils instead
 */
export const getStatusColor = (status: JobApplicationStatus | string): string => {
  const normalized = normalizeStatus(status as string);
  return getStatusColorUtil(normalized);
};

/**
 * Get status display text
 * @deprecated Use getStatusText from @/lib/status-utils instead
 */
export const getStatusText = (status: JobApplicationStatus | string): string => {
  const normalized = normalizeStatus(status as string);
  return getStatusTextUtil(normalized);
};

/**
 * Format date to display format
 * Handles timezone differences - backend sends LocalDateTime which needs to be treated as Vietnam time
 */
export const formatApplicationDate = (dateString: string): string => {
  try {
    // Backend sends LocalDateTime without timezone info
    // We need to parse it as if it's already in Vietnam time (UTC+7)
    // Example: "2024-12-16T10:30:00" should be treated as Vietnam time, not UTC
    
    // Remove any timezone indicators and parse as local time
    const cleanDateString = dateString.replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, '');
    
    // Create date object - this will parse as local browser time
    const date = new Date(cleanDateString);
    
    // Calculate time difference
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return dateString;
  }
};

// ==================== OFFER CONFIRMATION API (v3.1) ====================

export interface OfferConfirmationResponse {
  code: number;
  message: string;
  result: JobApplication;
}

/**
 * Confirm a job offer (Candidate only)
 * Transitions application from OFFER_EXTENDED to WORKING
 * @param jobApplyId - The ID of the job application
 */
export const confirmJobOffer = async (jobApplyId: number): Promise<OfferConfirmationResponse> => {
  try {
    console.log(`✅ [CONFIRM OFFER] Confirming offer for application ID: ${jobApplyId}`);
    const response = await api.post<OfferConfirmationResponse>(`/api/job-apply/${jobApplyId}/confirm-offer`);
    console.log('✅ [CONFIRM OFFER] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [CONFIRM OFFER] Full Error:', error);
    console.error('❌ [CONFIRM OFFER] Response:', error?.response);
    console.error('❌ [CONFIRM OFFER] Status:', error?.response?.status);
    console.error('❌ [CONFIRM OFFER] Data:', error?.response?.data);
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to confirm job offer');
  }
};

/**
 * Candidate terminates current employment (WORKING/ACCEPTED → TERMINATED)
 */
export const terminateEmployment = async (jobApplyId: number): Promise<OfferConfirmationResponse> => {
  try {
    console.log(`✅ [TERMINATE EMPLOYMENT] Terminating employment for application ID: ${jobApplyId}`);
    const response = await api.post<OfferConfirmationResponse>(`/api/job-apply/${jobApplyId}/terminate`);
    console.log('✅ [TERMINATE EMPLOYMENT] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [TERMINATE EMPLOYMENT] Full Error:', error);
    console.error('❌ [TERMINATE EMPLOYMENT] Response:', error?.response);
    console.error('❌ [TERMINATE EMPLOYMENT] Status:', error?.response?.status);
    console.error('❌ [TERMINATE EMPLOYMENT] Data:', error?.response?.data);
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to terminate employment');
  }
};

/**
 * Decline a job offer (Candidate only)
 * Transitions application from OFFER_EXTENDED to WITHDRAWN
 * @param jobApplyId - The ID of the job application
 */
export const declineJobOffer = async (jobApplyId: number): Promise<OfferConfirmationResponse> => {
  try {
    console.log(`❌ [DECLINE OFFER] Declining offer for application ID: ${jobApplyId}`);
    const response = await api.post<OfferConfirmationResponse>(`/api/job-apply/${jobApplyId}/decline-offer`);
    console.log('✅ [DECLINE OFFER] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [DECLINE OFFER] Error:', error?.response?.data || error);
    throw new Error(error?.response?.data?.message || 'Failed to decline job offer');
  }
};

