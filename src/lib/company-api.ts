import api, { publicApi } from '@/lib/api';

// ==================== COMPANY LIST API ====================

export interface CompanyListItem {
  id: number;
  companyName: string;
  companyAddress: string;
  logoUrl: string;
  jobCount: number;
}

export interface CompanyListResponse {
  code: number;
  message: string;
  result: {
    content: CompanyListItem[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
}

export interface CompanyListParams {
  page?: number;
  size?: number;
  companyAddress?: string;
}

/**
 * Fetch list of companies with pagination (PUBLIC - no auth required)
 * GET /api/job-postings/company
 */
export const fetchCompanies = async (params: CompanyListParams = {}): Promise<CompanyListResponse> => {
  const { page = 0, size = 12, companyAddress } = params;
  
  try {
    const response = await publicApi.get<any>('/api/job-postings/company', {
      params: {
        page,
        size,
        ...(companyAddress && { companyAddress }),
      },
    });
    
    console.log('✅ Companies API response:', response.data);
    
    // Handle the response format
    if (response.data.code === 200 || response.data.code === 1000) {
      return response.data;
    }
    
    // Handle direct pagination format
    if (response.data.content) {
      return {
        code: 200,
        message: 'Success',
        result: response.data,
      };
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching companies:', error);
    throw error;
  }
};

// ==================== COMPANY DETAIL API ====================

export interface CompanyDetail {
  recruiterId: number;
  companyName: string;
  website: string;
  logoUrl: string;
  about: string;
}

export interface CompanyDetailResponse {
  code: number;
  message: string;
  result: CompanyDetail;
}

/**
 * Fetch company detail by recruiter ID (PUBLIC - no auth required)
 * GET /api/job-postings/company/{recruiterId}
 */
export const fetchCompanyDetail = async (recruiterId: number): Promise<CompanyDetailResponse> => {
  try {
    const response = await publicApi.get<CompanyDetailResponse>(`/api/job-postings/company/${recruiterId}`);
    console.log('✅ Company detail response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching company detail:', error);
    throw error;
  }
};

// ==================== COMPANY JOBS API ====================

export interface CompanyJobsParams {
  recruiterId: number;
  page?: number;
  size?: number;
  keyword?: string;
  candidateId?: number;
}

/**
 * Fetch job postings of a specific company (PUBLIC - no auth required)
 * GET /api/job-postings/company/list/{recruiterId}
 */
export const fetchCompanyJobs = async (params: CompanyJobsParams) => {
  const { recruiterId, page = 0, size = 10, keyword, candidateId = 0 } = params;
  
  try {
    const response = await publicApi.get<any>(`/api/job-postings/company/list/${recruiterId}`, {
      params: {
        page,
        size,
        ...(keyword && { keyword }),
        candidateId,
      },
    });
    
    console.log('✅ Company jobs response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching company jobs:', error);
    throw error;
  }
};
