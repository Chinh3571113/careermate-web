import api from './api';

// Roadmap Recommendation Types
export interface RoadmapRecommendation {
  title: string;
  similarityScore: number;
}

export interface RoadmapRecommendationResponse {
  code: number;
  message: string;
  result: RoadmapRecommendation[];
}

// Resume Roadmap Types
export interface ResumeRoadmap {
  id: number;
  resumeId: number;
  roadmapName: string;
  createdAt: string;
  active: boolean;
}

export interface ResumeRoadmapPageResponse {
  content: ResumeRoadmap[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ResumeRoadmapResponse {
  code: number;
  message: string;
  result: ResumeRoadmapPageResponse;
}

// Roadmap Detail Types
export interface ResourceResponse {
  url: string;
}

export interface TopicDetailResponse {
  name: string;
  description: string;
  resourceResponses: ResourceResponse[];
}

export interface SubtopicDetailResponse {
  name: string;
  description: string;
  resourceResponses: ResourceResponse[];
}

export interface Subtopic {
  id: number;
  name: string;
  tags: string;
  status?: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
}

export interface Topic {
  id: number;
  name: string;
  tags: string;
  subtopics: Subtopic[];
}

export interface RoadmapDetail {
  name: string;
  topics: Topic[];
}

export interface RoadmapDetailResponse {
  code: number;
  message: string;
  result: RoadmapDetail;
}

/**
 * Get roadmap recommendations based on role/professional title
 * Endpoint: GET /api/roadmap/recommendation
 * @param role - The role/professional title to get recommendations for
 * @returns Promise<RoadmapRecommendationResponse>
 */
export const getRoadmapRecommendations = async (
  role: string
): Promise<RoadmapRecommendationResponse> => {
  try {
    console.log('🔵 [GET ROADMAP RECOMMENDATIONS] Fetching for role:', role);

    const response = await api.get('/api/roadmap/recommendation', {
      params: { role },
    });

    console.log('✅ [GET ROADMAP RECOMMENDATIONS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET ROADMAP RECOMMENDATIONS] Error:', error.response?.data || error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch roadmap recommendations'
    );
  }
};

/**
 * Get resume roadmaps with pagination
 * Endpoint: GET /api/roadmap/resume-roadmaps
 * @param resumeId - The resume ID
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 10)
 * @param sortBy - Sort criteria (default: "createdat_desc")
 * @returns Promise<ResumeRoadmapResponse>
 */
export const getResumeRoadmaps = async (
  resumeId: number,
  page: number = 0,
  size: number = 10,
  sortBy: string = "createdat_desc"
): Promise<ResumeRoadmapResponse> => {
  try {
    console.log('🔵 [GET RESUME ROADMAPS] Fetching for resumeId:', resumeId);

    const response = await api.get('/api/roadmap/resume-roadmaps', {
      params: {
        resumeId,
        page,
        size,
        sortBy
      },
    });

    console.log('✅ [GET RESUME ROADMAPS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET RESUME ROADMAPS] Error:', error.response?.data || error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch resume roadmaps'
    );
  }
};

/**
 * Get roadmap detail by roadmap name
 * Endpoint: GET /api/roadmap
 * @param roadmapName - The name of the roadmap (e.g., "backend developer")
 * @returns Promise<RoadmapDetailResponse>
 */
export const getRoadmapByName = async (
  roadmapName: string
): Promise<RoadmapDetailResponse> => {
  try {
    console.log('🔵 [GET ROADMAP BY NAME] Fetching roadmap:', roadmapName);

    // Encode roadmapName for URL
    const encodedName = encodeURIComponent(roadmapName);

    const response = await api.get(`/api/roadmap?roadmapName=${encodedName}`);

    console.log('✅ [GET ROADMAP BY NAME] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET ROADMAP BY NAME] Error:', error.response?.data || error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch roadmap detail'
    );
  }
};

/**
 * Get candidate roadmap with progress status
 * Endpoint: GET /api/roadmap/candidate-roadmap
 * @param resumeId - The resume ID
 * @param roadmapName - The name of the roadmap (e.g., "frontend developer")
 * @returns Promise<RoadmapDetailResponse>
 */
export const getCandidateRoadmap = async (
  resumeId: number,
  roadmapName: string
): Promise<RoadmapDetailResponse> => {
  try {
    console.log('🔵 [GET CANDIDATE ROADMAP] Fetching for resumeId:', resumeId, 'roadmapName:', roadmapName);

    const response = await api.get('/api/roadmap/candidate-roadmap', {
      params: {
        resumeId,
        roadmapName
      },
    });

    console.log('✅ [GET CANDIDATE ROADMAP] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [GET CANDIDATE ROADMAP] Error:', error.response?.data || error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch candidate roadmap'
    );
  }
};

/**
 * Get topic detail by topic ID
 * Endpoint: GET /api/roadmap/topic/{topicId}
 * @param topicId - The ID of the topic
 * @returns Promise<TopicDetailResponse>
 */
export const getTopicDetail = async (
  topicId: number
): Promise<TopicDetailResponse> => {
  try {
    console.log('🔵 [GET TOPIC DETAIL] Fetching topic:', topicId);

    const response = await api.get(`/api/roadmap/topic/${topicId}`);

    console.log('✅ [GET TOPIC DETAIL] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [GET TOPIC DETAIL] Error:', error.response?.data || error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch topic detail'
    );
  }
};

/**
 * Get subtopic detail by subtopic ID
 * Endpoint: GET /api/roadmap/subtopic/{subtopicId}
 * @param subtopicId - The ID of the subtopic
 * @returns Promise<SubtopicDetailResponse>
 */
export const getSubtopicDetail = async (
  subtopicId: number
): Promise<SubtopicDetailResponse> => {
  try {
    console.log('🔵 [GET SUBTOPIC DETAIL] Fetching subtopic:', subtopicId);

    const response = await api.get(`/api/roadmap/subtopic/${subtopicId}`);

    console.log('✅ [GET SUBTOPIC DETAIL] Response:', response.data);
    return response.data.result;
  } catch (error: any) {
    console.error('❌ [GET SUBTOPIC DETAIL] Error:', error.response?.data || error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch subtopic detail'
    );
  }
};

/**
 * Toggle subtopic status (NOT_STARTED <-> COMPLETED)
 * Endpoint: PUT /api/roadmap/resume/{resumeId}/subtopic/{subtopicId}/toggle-status
 * @param resumeId - The resume ID
 * @param subtopicId - The subtopic ID to toggle
 * @returns Promise<any>
 */
export const toggleSubtopicStatus = async (
  resumeId: number,
  subtopicId: number
): Promise<any> => {
  try {
    console.log('🔵 [TOGGLE SUBTOPIC STATUS] Toggling:', { resumeId, subtopicId });

    const response = await api.put(
      `/api/roadmap/resume/${resumeId}/subtopic/${subtopicId}/toggle-status`
    );

    console.log('✅ [TOGGLE SUBTOPIC STATUS] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [TOGGLE SUBTOPIC STATUS] Error:', error.response?.data || error);
    throw new Error(
      error.response?.data?.message || 'Failed to toggle subtopic status'
    );
  }
};

