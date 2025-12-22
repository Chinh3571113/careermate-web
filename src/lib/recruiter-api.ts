import api from './api';
import { RecruiterResponse } from '@/types/recruiter';
import { JobApplicationStatus } from '@/types/status';
import { normalizeStatus } from '@/lib/status-utils';

// Skill Interface
export interface Skill {
  id: number;
  name: string;
  type?: string; // Optional: technical, soft, etc.
}

export interface SkillsResponse {
  code: number;
  message: string;
  result: Skill[];
}

// Get all skills
// type: 'core' | 'soft' | '' (empty string for all types)
// keyword: optional search term for autocomplete
export const getSkills = async (type: string = '', keyword?: string): Promise<SkillsResponse> => {
  try {
    console.log(`🔵 [GET SKILLS] Fetching skills (type: "${type || 'all'}", keyword: ${keyword || 'none'})`);
    const params: any = { type }; // Required parameter, empty string = all types
    if (keyword) params.keyword = keyword;
    
    const response = await api.get('/api/jdskill', { params });
    console.log('✅ [GET SKILLS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET SKILLS] Error:', error.response?.data || error.message || error);
    
    // Provide more detailed error information
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      if (status === 401) {
        throw new Error('Authentication required. Please sign in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to access skills.');
      } else if (status === 404) {
        throw new Error('Skills endpoint not found. Please contact support.');
      } else {
        throw new Error(message || `Failed to fetch skills (Status: ${status})`);
      }
    } else if (error.request) {
      // Request made but no response received
      throw new Error('Cannot connect to server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Failed to fetch skills');
    }
  }
};

export const getRecruiters = async (): Promise<RecruiterResponse> => {
  try {
    // Use the dedicated endpoint for pending recruiters
    const response = await api.get(`/api/admin/recruiters/pending`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching recruiters:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch recruiters');
  }
};

// Search all recruiters with filters
export interface SearchRecruitersParams {
  keyword?: string;
  status?: string; // PENDING, APPROVED, ACTIVE, REJECTED, BANNED
  page?: number;
  size?: number;
  sortBy?: string; // Default: 'id'
  sortDir?: string; // 'asc' or 'desc'
}

export interface PaginatedRecruiterResponse {
  code: number;
  message: string;
  result: {
    content: any[]; // Array of recruiters
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export const searchRecruiters = async (params?: SearchRecruitersParams): Promise<PaginatedRecruiterResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.keyword) {
      queryParams.append('keyword', params.keyword);
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString());
    }
    if (params?.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params?.sortDir) {
      queryParams.append('sortDir', params.sortDir);
    }
    
    const queryString = queryParams.toString();
    const url = `/api/admin/recruiters/search${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔍 [Search Recruiters] URL:', url);
    const response = await api.get(url);
    console.log('✅ [Search Recruiters] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error searching recruiters:', error);
    throw new Error(error.response?.data?.message || 'Failed to search recruiters');
  }
};

export const approveRecruiter = async (recruiterId: number): Promise<any> => {
  try {
    // Use PUT method as per new API requirements
    const response = await api.put(`/api/admin/recruiters/${recruiterId}/approve`);
    return response.data;
  } catch (error: any) {
    console.error('Error approving recruiter:', error);
    throw new Error(error.response?.data?.message || 'Failed to approve recruiter');
  }
};

export const rejectRecruiter = async (recruiterId: number, reason: string): Promise<any> => {
  try {
    // Use PUT as the API expects PUT /api/admin/recruiters/{recruiterId}/reject
    const response = await api.put(`/api/admin/recruiters/${recruiterId}/reject?reason=${encodeURIComponent(reason)}`);
    return response.data;
  } catch (error: any) {
    console.error('Error rejecting recruiter:', error);
    throw new Error(error.response?.data?.message || 'Failed to reject recruiter');
  }
};

export interface UpdateOrganizationRequest {
  companyName: string;
  website?: string;
  logoUrl?: string;
  contactPerson: string;
  phoneNumber: string;
  companyAddress: string;
  companyEmail?: string;
}

export interface UpdateOrganizationResponse {
  code: number;
  message: string;
  result: any;
}

// Update Organization Profile (creates pending update request for admin approval)
export const updateOrganization = async (data: UpdateOrganizationRequest): Promise<UpdateOrganizationResponse> => {
  try {
    console.log('🔵 [UPDATE ORGANIZATION] Sending update request:', data);
    const response = await api.put('/api/recruiter/profile', data);
    console.log('✅ [UPDATE ORGANIZATION] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [UPDATE ORGANIZATION] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to submit update request');
  }
};

// Recruiter Profile Interface
export interface PendingUpdateRequest {
  requestId: number;
  recruiterId: number;
  recruiterEmail: string;
  recruiterUsername: string;
  currentCompanyName: string;
  currentWebsite: string;
  currentLogoUrl: string;
  currentAbout: string;
  currentCompanyEmail: string;
  currentContactPerson: string;
  currentPhoneNumber: string;
  currentCompanyAddress: string;
  newCompanyName: string;
  newWebsite: string;
  newLogoUrl: string;
  newAbout: string;
  newCompanyEmail: string;
  newContactPerson: string;
  newPhoneNumber: string;
  newCompanyAddress: string;
  status: string;
  adminNote: string;
  rejectionReason: string;
  createdAt: string;
  reviewedAt: string;
}

export interface RecruiterProfileData {
  recruiterId: number;
  accountId: number;
  email: string;
  username: string;
  companyName: string;
  website: string;
  logoUrl: string;
  about: string;
  rating: number;
  companyEmail: string | null;
  contactPerson: string;
  phoneNumber: string;
  companyAddress: string;
  verificationStatus: string;
  rejectionReason: string | null;
  hasPendingUpdate: boolean;
  pendingUpdateRequest: PendingUpdateRequest | null;
}

export interface RecruiterProfileApiResponse {
  code: number;
  message: string;
  result: RecruiterProfileData;
}

// Get Recruiter Profile (New endpoint)
export const getRecruiterProfile = async (): Promise<RecruiterProfileApiResponse> => {
  try {
    console.log('🔵 [GET RECRUITER PROFILE] Fetching profile...');
    const response = await api.get('/api/recruiter/profile');
    console.log('✅ [GET RECRUITER PROFILE] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET RECRUITER PROFILE] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch recruiter profile');
  }
};

// Admin - Get All Profile Update Requests
export interface ProfileUpdateRequest {
  requestId: number;
  recruiterId: number;
  recruiterEmail: string;
  recruiterUsername: string;
  currentCompanyName: string;
  currentWebsite: string;
  currentLogoUrl: string;
  currentAbout: string;
  currentCompanyEmail: string | null;
  currentContactPerson: string;
  currentPhoneNumber: string;
  currentCompanyAddress: string;
  newCompanyName: string;
  newWebsite: string;
  newLogoUrl: string;
  newAbout: string | null;
  newCompanyEmail: string;
  newContactPerson: string;
  newPhoneNumber: string;
  newCompanyAddress: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ProfileUpdateRequestsParams {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface ProfileUpdateRequestsResponse {
  code: number;
  message: string;
  result: {
    content: ProfileUpdateRequest[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export const getProfileUpdateRequests = async (params?: ProfileUpdateRequestsParams): Promise<ProfileUpdateRequestsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString());
    }
    if (params?.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params?.sortDir) {
      queryParams.append('sortDir', params.sortDir);
    }
    
    const queryString = queryParams.toString();
    const url = `/api/admin/recruiter-update-requests${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔍 [GET PROFILE UPDATE REQUESTS] URL:', url);
    const response = await api.get(url);
    console.log('✅ [GET PROFILE UPDATE REQUESTS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET PROFILE UPDATE REQUESTS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch profile update requests');
  }
};

// Approve Profile Update Request
export const approveProfileUpdateRequest = async (requestId: number, adminNote?: string): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    if (adminNote) {
      queryParams.append('adminNote', adminNote);
    }
    
    const url = `/api/admin/recruiter-update-requests/${requestId}/approve${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('🔵 [APPROVE PROFILE UPDATE] Request ID:', requestId, 'Admin Note:', adminNote);
    const response = await api.put(url);
    console.log('✅ [APPROVE PROFILE UPDATE] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [APPROVE PROFILE UPDATE] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to approve profile update request');
  }
};

// Reject Profile Update Request
export const rejectProfileUpdateRequest = async (requestId: number, rejectionReason: string): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('rejectionReason', rejectionReason);
    
    const url = `/api/admin/recruiter-update-requests/${requestId}/reject?${queryParams.toString()}`;
    
    console.log('🔵 [REJECT PROFILE UPDATE] Request ID:', requestId, 'Reason:', rejectionReason);
    const response = await api.put(url);
    console.log('✅ [REJECT PROFILE UPDATE] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [REJECT PROFILE UPDATE] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to reject profile update request');
  }
};

// Recruiter - Get My Profile Update Requests History
export interface RecruiterUpdateRequestHistoryResponse {
  code: number;
  message: string;
  result: ProfileUpdateRequest[];
}

export const getMyUpdateRequestsHistory = async (): Promise<RecruiterUpdateRequestHistoryResponse> => {
  try {
    console.log('🔍 [GET MY UPDATE REQUESTS] Fetching update request history...');
    const response = await api.get('/api/recruiter/profile/update-requests');
    console.log('✅ [GET MY UPDATE REQUESTS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET MY UPDATE REQUESTS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch update request history');
  }
};

export interface RecruiterProfile {
  recruiterId: number;
  accountId: number;
  email: string;
  username: string;
  companyName: string;
  website?: string;
  logoUrl?: string;
  about?: string;
  rating?: number;
  companyEmail?: string;
  contactPerson: string;
  phoneNumber: string;
  companyAddress: string;
  accountStatus: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'BANNED';
  accountRole: string;
  verificationStatus?: string;
  rejectionReason?: string;
}

export interface RecruiterProfileResponse {
  code: number;
  message: string;
  result: RecruiterProfile;
}

// Get My Recruiter Profile
export const getMyRecruiterProfile = async (): Promise<RecruiterProfileResponse> => {
  try {
    const response = await api.get('/api/recruiter/my-profile');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching recruiter profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch recruiter profile');
  }
};

// Ban Recruiter
export const banRecruiter = async (accountId: number, reason: string): Promise<any> => {
  try {
    const response = await api.put(`/api/admin/recruiters/account/${accountId}/ban`, null, {
      params: { reason }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error banning recruiter:', error);
    throw new Error(error.response?.data?.message || 'Failed to ban recruiter');
  }
};

// Unban Recruiter
export const unbanRecruiter = async (accountId: number): Promise<any> => {
  try {
    const response = await api.put(`/api/admin/recruiters/account/${accountId}/unban`);
    return response.data;
  } catch (error: any) {
    console.error('Error unbanning recruiter:', error);
    throw new Error(error.response?.data?.message || 'Failed to unban recruiter');
  }
};

// Job Posting APIs
export interface JdSkill {
  id: number;
  mustToHave: boolean;
}

export interface RecruiterJobPosting {
  id: number;
  title: string;
  description: string;
  address: string;
  expirationDate: string;
  createAt: string;
  yearsOfExperience: number;
  workModel: string;
  salaryRange: string;
  reason: string;
  jobPackage: string;
  status: string;
  skills?: Array<{ id: number; name: string; mustToHave: boolean }>;
}

export interface RecruiterJobPostingsResponse {
  code: number;
  message: string;
  result: {
    content: RecruiterJobPosting[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
}

export interface GetJobPostingsParams {
  page?: number;
  size?: number; // Default: 5
}

// Get all job postings of current recruiter with pagination
// Default: page=0, size=5
export const getRecruiterJobPostings = async (params?: GetJobPostingsParams): Promise<RecruiterJobPostingsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Default page to 0 if not provided
    const page = params?.page !== undefined ? params.page : 0;
    queryParams.append('page', page.toString());
    
    // Default size to 5 if not provided
    const size = params?.size !== undefined ? params.size : 5;
    queryParams.append('size', size.toString());
    
    const queryString = queryParams.toString();
    const url = `/api/jobposting/recruiter${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔵 [GET RECRUITER JOB POSTINGS] Fetching:', url);
    const response = await api.get(url);
    console.log('✅ [GET RECRUITER JOB POSTINGS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET RECRUITER JOB POSTINGS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch job postings');
  }
};

// JdSkill interface for job posting
export interface JdSkill {
  id: number;
  mustToHave: boolean;
}

export interface CreateJobPostRequest {
  title: string;
  description: string;
  address: string;
  expirationDate: string; // Format: YYYY-MM-DD (will be converted to LocalDate by backend)
  jdSkills: JdSkill[]; // Array of skill IDs with mustToHave flag
  yearsOfExperience: number;
  workModel: string; // 'Onsite' | 'Remote' | 'Hybrid' or 'AT_OFFICE' | 'REMOTE' | 'HYBRID'
  salaryRange: string;
  reason: string;
  jobPackage: string;
}

export interface JobPostResponse {
  code: number;
  message: string;
  result: any;
}

// Create Job Post
export const createJobPost = async (data: CreateJobPostRequest): Promise<JobPostResponse> => {
  try {
    console.log('🔵 [CREATE JOB] Sending request:', JSON.stringify(data, null, 2));
    const response = await api.post('/api/jobposting', data);
    console.log('✅ [CREATE JOB] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [CREATE JOB] Error:', error.response?.data || error.message || error);
    
    // Provide detailed error information
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      const message = errorData?.message || error.message;
      
      console.error('❌ [CREATE JOB] Status:', status);
      console.error('❌ [CREATE JOB] Error Data:', errorData);
      
      if (status === 400) {
        // Validation error - provide detailed feedback
        if (errorData?.errors) {
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('; ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
        throw new Error(message || 'Invalid job posting data. Please check all required fields.');
      } else if (status === 401) {
        throw new Error('Authentication required. Please sign in again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to create job postings.');
      } else {
        throw new Error(message || `Failed to create job post (Status: ${status})`);
      }
    } else if (error.request) {
      throw new Error('Cannot connect to server. Please check your connection.');
    } else {
      throw new Error(error.message || 'Failed to create job post');
    }
  }
};

// Update Job Posting
// - For ACTIVE/EXPIRED jobs: Only expiration date can be changed
// - For PENDING/REJECTED jobs: Full update is allowed
// Note: ACTIVE jobs with applicants have limits on date changes (max -7 to +60 days)
export const updateJobPosting = async (jobPostingId: number, data: CreateJobPostRequest): Promise<JobPostResponse> => {
  try {
    console.log('🔵 [UPDATE JOB] Job ID:', jobPostingId, 'Data:', data);
    const response = await api.put(`/api/jobposting/recruiter/${jobPostingId}`, data);
    console.log('✅ [UPDATE JOB] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [UPDATE JOB] Error:', error.response?.data || error);
    // Handle specific error codes from backend
    const errorCode = error.response?.data?.code;
    let errorMessage = error.response?.data?.message || 'Failed to update job posting';
    
    if (errorCode === 6023) {
      errorMessage = 'Cannot edit job content after candidates have applied. Only expiration date can be changed.';
    } else if (errorCode === 6024) {
      errorMessage = 'Cannot shorten deadline by more than 7 days for jobs with applicants.';
    } else if (errorCode === 6025) {
      errorMessage = 'Cannot extend deadline by more than 60 days for jobs with applicants.';
    }
    
    throw new Error(errorMessage);
  }
};

// Update Job Posting Expiration Date
export const extendJobPosting = async (jobPostingId: number, newExpirationDate: string): Promise<JobPostResponse> => {
  try {
    console.log('🔵 [EXTEND JOB] Job ID:', jobPostingId, 'New date:', newExpirationDate);
    const response = await api.put(`/api/jobposting/${jobPostingId}/extend`, null, {
      params: { expirationDate: newExpirationDate }
    });
    console.log('✅ [EXTEND JOB] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [EXTEND JOB] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to extend job posting');
  }
};

// Pause Job Posting (ACTIVE → PAUSED)
export const pauseJobPosting = async (jobPostingId: number): Promise<JobPostResponse> => {
  try {
    console.log('🔵 [PAUSE JOB] Job ID:', jobPostingId);
    const response = await api.patch(`/api/jobposting/recruiter/${jobPostingId}/pause`);
    console.log('✅ [PAUSE JOB] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [PAUSE JOB] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to pause job posting');
  }
};

// Resume Job Posting (PAUSED → ACTIVE)
export const resumeJobPosting = async (jobPostingId: number): Promise<JobPostResponse> => {
  try {
    console.log('🔵 [RESUME JOB] Job ID:', jobPostingId);
    const response = await api.patch(`/api/jobposting/recruiter/${jobPostingId}/resume`);
    console.log('✅ [RESUME JOB] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [RESUME JOB] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to resume job posting');
  }
};

// Close Job Posting (ACTIVE → CLOSED)
export const closeJobPosting = async (jobPostingId: number): Promise<JobPostResponse> => {
  try {
    console.log('🔵 [CLOSE JOB] Job ID:', jobPostingId);
    const response = await api.patch(`/api/jobposting/recruiter/${jobPostingId}/close`);
    console.log('✅ [CLOSE JOB] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [CLOSE JOB] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to close job posting');
  }
};

// Get Job Posting Statistics (Recruiter Dashboard Stats)
export interface JobPostingStats {
  totalJobPostings: number;
  pendingJobPostings: number;
  activeJobPostings: number;
  rejectedJobPostings: number;
  pausedJobPostings: number;
  expiredJobPostings: number;
  deletedJobPostings: number;
  totalApplications: number;
  submittedApplications: number;
  reviewingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  interviewScheduledApplications: number;
  hiredApplications: number;
  withdrawnApplications: number;
}

export interface JobPostingStatsResponse {
  code: number;
  message: string;
  result: JobPostingStats;
}

// Get all recruiter stats (new endpoint)
export const getRecruiterStats = async (): Promise<JobPostingStatsResponse> => {
  try {
    console.log('🔵 [GET RECRUITER STATS] Fetching...');
    const response = await api.get('/api/jobposting/recruiter/stats');
    console.log('✅ [GET RECRUITER STATS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET RECRUITER STATS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch recruiter statistics');
  }
};

// Legacy function - for individual job posting stats (if endpoint exists)
export const getJobPostingStats = async (jobPostingId: number): Promise<any> => {
  try {
    console.log('🔵 [GET JOB STATS] Job ID:', jobPostingId);
    // Try the new recruiter stats endpoint as fallback
    const response = await api.get('/api/jobposting/recruiter/stats');
    console.log('✅ [GET JOB STATS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET JOB STATS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch job statistics');
  }
};

// AI Candidate Recommendations
export interface CandidateRecommendation {
  candidateId: number;
  candidateName: string | null;
  email: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  totalYearsExperience: number;
  profileSummary: string;
  educationLevel: string | null;
  certificatesCount: number;
  projectsCount: number;
  awardsCount: number;
  languagesCount: number;
  scoreBreakdown: any | null;
}

export interface RecommendationsResult {
  jobPostingId: number;
  jobTitle: string;
  totalCandidatesFound: number;
  recommendations: CandidateRecommendation[];
  processingTimeMs: number;
}

export interface RecommendationsResponse {
  code: number;
  result: RecommendationsResult;
}

export interface GetRecommendationsParams {
  maxCandidates?: number;
  minMatchScore?: number;
}

// Get AI-powered candidate recommendations for a job posting
export const getJobRecommendations = async (
  jobPostingId: number, 
  params?: GetRecommendationsParams
): Promise<RecommendationsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.maxCandidates !== undefined) {
      queryParams.append('maxCandidates', params.maxCandidates.toString());
    }
    if (params?.minMatchScore !== undefined) {
      queryParams.append('minMatchScore', params.minMatchScore.toString());
    }
    
    const queryString = queryParams.toString();
    const url = `/api/recruiter/recommendations/job/${jobPostingId}${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔵 [GET RECOMMENDATIONS] Fetching:', url);
    const response = await api.get(url);
    console.log('✅ [GET RECOMMENDATIONS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET RECOMMENDATIONS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch candidate recommendations');
  }
};

// Check if recruiter has AI matching entitlement
export interface AIMatchingCheckerResponse {
  code: number;
  message: string;
  result: boolean;
}

export const checkAIMatchingEntitlement = async (): Promise<AIMatchingCheckerResponse> => {
  try {
    console.log('🔵 [CHECK AI MATCHING] Checking entitlement');
    const response = await api.get('/api/recruiter-entitlement/ai-matching-checker');
    console.log('✅ [CHECK AI MATCHING] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [CHECK AI MATCHING] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to check AI matching entitlement');
  }
};

// Job Application APIs
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
  // Additional fields that may be present
  companyName?: string;
  companyEmail?: string;
  recruiterPhone?: string;
  companyAddress?: string;
  contactPerson?: string;
}

export interface JobApplicationResponse {
  code: number;
  message: string;
  result: JobApplication;
}

export interface JobApplicationsResponse {
  code: number;
  message: string;
  result: JobApplication[];
}

// Get Single Application by ID
export const getApplicationById = async (applicationId: number): Promise<JobApplicationResponse> => {
  try {
    console.log('🔵 [GET APPLICATION BY ID] Fetching:', applicationId);
    // First get all recruiter applications and find the specific one
    const response = await api.get('/api/job-apply/recruiter');
    const applications = response.data.result || [];
    const application = applications.find((app: JobApplication) => app.id === applicationId);
    
    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }
    
    console.log('✅ [GET APPLICATION BY ID] Found:', application);
    return {
      code: 200,
      message: 'Success',
      result: application
    };
  } catch (error: any) {
    console.error('❌ [GET APPLICATION BY ID] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch application');
  }
};

// Get All Applications for Recruiter (new endpoint)
export const getRecruiterApplications = async (): Promise<JobApplicationsResponse> => {
  try {
    console.log('🔵 [GET RECRUITER APPLICATIONS] Fetching all...');
    const response = await api.get('/api/job-apply/recruiter');
    console.log('✅ [GET RECRUITER APPLICATIONS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET RECRUITER APPLICATIONS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch applications');
  }
};

// Get Paginated/Filtered Applications for Recruiter (new endpoint)
export const getRecruiterApplicationsFiltered = async (params?: {
  status?: JobApplicationStatus;
  page?: number;
  size?: number;
}): Promise<JobApplicationsResponse> => {
  try {
    console.log('🔵 [GET RECRUITER APPLICATIONS FILTERED] Params:', params);
    const response = await api.get('/api/job-apply/recruiter/filter', { params });
    console.log('✅ [GET RECRUITER APPLICATIONS FILTERED] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET RECRUITER APPLICATIONS FILTERED] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch filtered applications');
  }
};

// Get Job Applications by Job Posting ID (legacy - kept for backward compatibility)
export const getJobApplications = async (jobPostingId?: number): Promise<JobApplicationsResponse> => {
  try {
    // If no jobPostingId provided, get all recruiter applications
    if (!jobPostingId) {
      return getRecruiterApplications();
    }
    
    console.log('🔵 [GET APPLICATIONS] Fetching for job posting:', jobPostingId);
    // Try to get all recruiter applications and filter by jobPostingId
    const response = await api.get('/api/job-apply/recruiter');
    const allApplications = response.data.result || [];
    const filtered = allApplications.filter((app: JobApplication) => app.jobPostingId === jobPostingId);
    
    console.log('✅ [GET APPLICATIONS] Filtered Response:', filtered.length, 'applications');
    return {
      code: 200,
      message: 'Success',
      result: filtered
    };
  } catch (error: any) {
    console.error('❌ [GET APPLICATIONS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch job applications');
  }
};

// Update Job Application Status
export const updateJobApplicationStatus = async (
  applicationId: number, 
  status: JobApplicationStatus
): Promise<any> => {
  try {
    console.log(`🔵 [UPDATE APPLICATION STATUS] ID: ${applicationId}, Status: ${status}`);
    console.log(`🔵 [UPDATE APPLICATION STATUS] URL: PUT /api/job-apply/${applicationId}`);
    console.log(`🔵 [UPDATE APPLICATION STATUS] Body: "${status}"`);
    // Backend expects status as a JSON string in request body (e.g., "REVIEWING")
    const response = await api.put(`/api/job-apply/${applicationId}`, JSON.stringify(status), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ [UPDATE APPLICATION STATUS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [UPDATE APPLICATION STATUS] Full error:', error);
    console.error('❌ [UPDATE APPLICATION STATUS] Error response:', error.response);
    console.error('❌ [UPDATE APPLICATION STATUS] Error data:', error.response?.data);
    console.error('❌ [UPDATE APPLICATION STATUS] Error status:', error.response?.status);
    console.error('❌ [UPDATE APPLICATION STATUS] Error message:', error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to update job application status');
  }
};

// Approve Job Application (using updateJobApplicationStatus)
export const approveJobApplication = async (applicationId: number): Promise<any> => {
  return updateJobApplicationStatus(applicationId, 'APPROVED');
};

// Extend Job Offer to candidate (v3.1 - transitions APPROVED → OFFER_EXTENDED)
export const extendJobOffer = async (applicationId: number): Promise<any> => {
  return updateJobApplicationStatus(applicationId, 'OFFER_EXTENDED');
};

// Reject Job Application (using updateJobApplicationStatus)
export const rejectJobApplication = async (applicationId: number, reason?: string): Promise<any> => {
  return updateJobApplicationStatus(applicationId, 'REJECTED');
};

// Set Job Application to Reviewing (using updateJobApplicationStatus)
export const setReviewingJobApplication = async (applicationId: number): Promise<any> => {
  return updateJobApplicationStatus(applicationId, 'REVIEWING');
};

// Change Password
export interface ChangePasswordRequest {
  password: string;
  repeatPassword: string;
}

export interface ChangePasswordResponse {
  code: number;
  message: string;
  result?: any;
}

export const changePassword = async (email: string, data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  try {
    console.log('🔵 [CHANGE PASSWORD] Sending request for email:', email);
    const response = await api.put(`/api/users/change-password/${encodeURIComponent(email)}`, data);
    console.log('✅ [CHANGE PASSWORD] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [CHANGE PASSWORD] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to change password');
  }
};

// Candidate Recommendation Interfaces
export interface CandidateRecommendation {
  candidateId: number;
  candidateName: string;
  email: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  totalYearsExperience: number;
  profileSummary: string;
  educationLevel: string;
  certificatesCount: number;
  projectsCount: number;
  awardsCount: number;
  languagesCount: number;
  scoreBreakdown: Record<string, number>;
  applicationId?: number;
  applicationStatus?: string;
  cvFilePath?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  preferredWorkLocation?: string;
  appliedAt?: string;
  coverLetter?: string;
}

export interface RecommendationResponse {
  code: number;
  message: string;
  result: {
    jobPostingId: number;
    jobTitle: string;
    totalCandidatesFound: number;
    recommendations: CandidateRecommendation[];
    processingTimeMs: number;
  };
}

// Get Recommended Candidates for a Job
export const getRecommendedCandidates = async (
  jobPostingId: number,
  maxCandidates?: number,
  minMatchScore?: number
): Promise<RecommendationResponse> => {
  try {
    console.log(`🔵 [GET RECOMMENDATIONS] Fetching candidates for job ${jobPostingId}`);
    const params: any = {};
    if (maxCandidates) params.maxCandidates = maxCandidates;
    if (minMatchScore) params.minMatchScore = minMatchScore;
    
    const response = await api.get(`/api/recruiter/recommendations/job/${jobPostingId}`, { params });
    console.log('✅ [GET RECOMMENDATIONS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET RECOMMENDATIONS] Error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to fetch recommended candidates');
  }
};
