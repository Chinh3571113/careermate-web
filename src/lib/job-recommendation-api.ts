import axios from 'axios';

/**
 * Job Recommendation API
 * POST http://localhost:8000/api/v1/jobs/job-postings/
 * 
 * This is a separate AI/ML service running on port 8000
 */

// Create a dedicated axios instance for AI recommendation service
const aiApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export interface JobRecommendationRequest {
  candidate_id: number;
  skills: string[];
  title: string;
  description: string;
  top_n?: number; // Default: 5
}

export interface JobRecommendation {
  job_id: number;
  title: string;
  skills: string;
  description: string;
  semantic_similarity?: number;
  skill_overlap?: number;
  title_boost?: number;
  similarity?: number;
  final_score?: number;
  source_weight?: {
    content: number;
    cf: number;
  };
}

export interface JobRecommendationResponse {
  ok: boolean;
  results: {
    content_based: JobRecommendation[];
    collaborative: JobRecommendation[];
    hybrid_top: JobRecommendation[];
  };
}

/**
 * Get job recommendations based on candidate profile
 * POST /api/v1/jobs/job-postings/
 */
export const getJobRecommendations = async (
  data: JobRecommendationRequest
): Promise<JobRecommendationResponse> => {
  try {
    console.log('🔵 [JOB RECOMMENDATION] Request:', data);
    console.log('🔵 [JOB RECOMMENDATION] URL:', aiApi.defaults.baseURL + '/api/v1/jobs/job-postings/');

    const response = await aiApi.post<JobRecommendationResponse>(
      '/api/v1/jobs/job-postings/',
      data
    );

    console.log('✅ [JOB RECOMMENDATION] Response:', response.data);

    if (!response.data.ok) {
      throw new Error('Failed to get job recommendations');
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ [JOB RECOMMENDATION] Error:', error.response?.data || error.message || error);
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to get job recommendations'
    );
  }
};
