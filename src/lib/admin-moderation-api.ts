import api from './api';
import type {
    ApiResponse,
    PagedResponse,
} from '@/types/blog';

// Admin Comment Types
export interface AdminCommentResponse {
    id: number;
    content: string;
    blogId: number;
    blogTitle: string;
    userId: number;
    userName: string;
    userEmail: string;
    parentCommentId: number | null;
    replyCount: number;
    isHidden: boolean;
    createdAt: string;
    updatedAt: string;
    // Auto-flagging moderation fields
    isFlagged?: boolean;
    flagReason?: string;
    flaggedAt?: string;
    reviewedByAdmin?: boolean;
    // Semantic toxicity analysis fields
    toxicityScore?: number;
    toxicityConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    analyzedAt?: string;
}

// Semantic Analysis Types
export interface ToxicityAnalysisResult {
    commentId: number;
    toxicityScore: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reasoning: string;
    toxicSimilarity?: number;
    positiveSimilarity?: number;
}

export interface BatchAnalysisResult {
    totalAnalyzed: number;
    results: ToxicityAnalysisResult[];
}

export interface BulkActionResult {
    action: string;
    totalComments: number;
    filtered: number;
    actioned: number;
}

export interface AdminCommentFilters {
    page?: number;
    size?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'flaggedAt';
    sortDirection?: 'ASC' | 'DESC';
    blogId?: number;
    userEmail?: string;
    content?: string;
    startDate?: string;
    endDate?: string;
}

export interface CommentStatistics {
    totalComments: number;
    hiddenComments: number;
    visibleComments: number;
    commentsToday: number;
    commentsThisWeek: number;
    commentsThisMonth: number;
    topCommentedBlogs: Array<{
        blogId: number;
        blogTitle: string;
        commentCount: number;
    }>;
    mostActiveUsers: Array<{
        userId: number;
        userName: string;
        commentCount: number;
    }>;
}

// Auto-Flagging Moderation Types
export interface ModerationStatistics {
    totalFlaggedComments: number;
    pendingReviewComments: number;
    reviewedComments: number;
    automationRules: {
        totalProfanityWords: number;
        totalControversialKeywords: number;
        totalSuspiciousPatterns: number;
    };
}

// Admin Rating Types
export interface AdminRatingResponse {
    id: number;
    rating: number;
    userId: number;
    userName: string;
    userEmail: string;
    blogId: number;
    blogTitle: string;
    createdAt: string;
    updatedAt: string;
}

export interface AdminRatingFilters {
    page?: number;
    size?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'rating';
    sortDirection?: 'ASC' | 'DESC';
    startDate?: string;
    endDate?: string;
    userEmail?: string;
    blogId?: number;
    rating?: number;
}

export interface RatingStatistics {
    totalRatings: number;
    averageRating: number;
    ratingDistribution: {
        [key: string]: number;
    };
    ratingsToday: number;
    ratingsThisWeek: number;
    ratingsThisMonth: number;
    topRatedBlogs: Array<{
        blogId: number;
        blogTitle: string;
        averageRating: number;
        ratingCount: number;
    }>;
    lowestRatedBlogs: Array<{
        blogId: number;
        blogTitle: string;
        averageRating: number;
        ratingCount: number;
    }>;
}

export interface BlogRatingSummary {
    blogId: number;
    blogTitle: string;
    totalRatings: number;
    averageRating: number;
    ratingDistribution: {
        [key: string]: number;
    };
    recentRatings: Array<{
        id: number;
        rating: number;
        userId: number;
        userName: string;
        createdAt: string;
    }>;
}

class AdminModerationApiService {
    // ===== COMMENT MANAGEMENT =====

    /**
     * Get all comments with filtering and pagination
     */
    async getAllComments(filters: AdminCommentFilters = {}): Promise<PagedResponse<AdminCommentResponse>> {
        const params = new URLSearchParams();
        
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
        if (filters.blogId) params.append('blogId', filters.blogId.toString());
        if (filters.userEmail) params.append('userEmail', filters.userEmail);
        if (filters.content) params.append('content', filters.content);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await api.get(`/api/admin/comments?${params.toString()}`);
        const responseData = response.data;

        console.log('📦 Admin Comments Response:', responseData);

        // Handle wrapped response format
        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to fetch comments');
        }

        // Return the result if wrapped, or the data directly
        return responseData.result || responseData;
    }

    /**
     * Get comment by ID
     */
    async getCommentById(commentId: number): Promise<AdminCommentResponse> {
        const response = await api.get(`/api/admin/comments/${commentId}`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to fetch comment');
        }

        return responseData.result || responseData;
    }

    /**
     * Delete comment (admin can delete any comment)
     */
    async deleteComment(commentId: number): Promise<void> {
        const response = await api.delete(`/api/admin/comments/${commentId}`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to delete comment');
        }
    }

    /**
     * Hide comment from public view
     */
    async hideComment(commentId: number): Promise<AdminCommentResponse> {
        const response = await api.post(`/api/admin/comments/${commentId}/hide`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to hide comment');
        }

        return responseData.result || responseData;
    }

    /**
     * Show previously hidden comment
     */
    async showComment(commentId: number): Promise<AdminCommentResponse> {
        const response = await api.post(`/api/admin/comments/${commentId}/show`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to show comment');
        }

        return responseData.result || responseData;
    }

    /**
     * Get comment statistics
     */
    async getCommentStatistics(): Promise<CommentStatistics> {
        const response = await api.get('/api/admin/comments/statistics');
        const responseData = response.data;

        console.log('📊 Comment Statistics Response:', responseData);

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to fetch comment statistics');
        }

        return responseData.result || responseData;
    }

    // ===== AUTO-FLAGGING MODERATION =====

    /**
     * Get flagged comments pending review (priority queue)
     */
    async getFlaggedCommentsPendingReview(filters: AdminCommentFilters = {}): Promise<PagedResponse<AdminCommentResponse>> {
        const params = new URLSearchParams();
        
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
        if (filters.userEmail) params.append('userEmail', filters.userEmail);
        if (filters.content) params.append('content', filters.content);
        if (filters.blogId) params.append('blogId', filters.blogId.toString());
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await api.get(`/api/admin/comment-moderation/flagged?${params.toString()}`);
        const responseData = response.data;

        console.log('⚠️ Flagged Comments Response:', responseData);

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            console.error('❌ Backend error:', responseData);
            throw new Error(responseData.message || 'Failed to fetch flagged comments');
        }

        return responseData.result || responseData;
    }

    /**
     * Get all flagged comments (including reviewed)
     */
    async getAllFlaggedComments(filters: AdminCommentFilters = {}): Promise<PagedResponse<AdminCommentResponse>> {
        const params = new URLSearchParams();
        
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());

        const response = await api.get(`/api/admin/comment-moderation/flagged/all?${params.toString()}`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to fetch all flagged comments');
        }

        return responseData.result || responseData;
    }

    /**
     * Approve flagged comment (unflag + show)
     */
    async approveComment(commentId: number): Promise<AdminCommentResponse> {
        const response = await api.post(`/api/admin/comment-moderation/${commentId}/approve`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to approve comment');
        }

        return responseData.result || responseData;
    }

    /**
     * Reject flagged comment (hide comment)
     */
    async rejectComment(commentId: number): Promise<AdminCommentResponse> {
        const response = await api.post(`/api/admin/comment-moderation/${commentId}/reject`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to reject comment');
        }

        return responseData.result || responseData;
    }

    /**
     * Unflag comment (mark as false positive)
     */
    async unflagComment(commentId: number): Promise<AdminCommentResponse> {
        const response = await api.post(`/api/admin/comment-moderation/${commentId}/unflag`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to unflag comment');
        }

        return responseData.result || responseData;
    }

    /**
     * Get moderation statistics
     */
    async getModerationStatistics(): Promise<ModerationStatistics> {
        try {
            const response = await api.get('/api/admin/comment-moderation/moderation-statistics');
            const responseData = response.data;

            console.log('📊 Moderation Statistics Response:', responseData);

            if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
                throw new Error(responseData.message || 'Failed to fetch moderation statistics');
            }

            return responseData.result || responseData;
        } catch (error: any) {
            console.warn('⚠️ Moderation statistics endpoint not available:', error.message);
            // Return mock data if endpoint doesn't exist
            return {
                totalFlaggedComments: 0,
                pendingReviewComments: 0,
                reviewedComments: 0,
                automationRules: {
                    totalProfanityWords: 0,
                    totalControversialKeywords: 0,
                    totalSuspiciousPatterns: 0
                }
            };
        }
    }

    // ===== RATING MANAGEMENT =====

    /**
     * Get all ratings with filtering and pagination
     */
    async getAllRatings(filters: AdminRatingFilters = {}): Promise<PagedResponse<AdminRatingResponse>> {
        const params = new URLSearchParams();
        
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.userEmail) params.append('userEmail', filters.userEmail);
        if (filters.blogId) params.append('blogId', filters.blogId.toString());
        if (filters.rating) params.append('rating', filters.rating.toString());

        const response = await api.get(`/api/admin/ratings?${params.toString()}`);
        const responseData = response.data;

        console.log('⭐ Admin Ratings Response:', responseData);

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to fetch ratings');
        }

        return responseData.result || responseData;
    }

    /**
     * Get rating by ID
     */
    async getRatingById(ratingId: number): Promise<AdminRatingResponse> {
        const response = await api.get(`/api/admin/ratings/${ratingId}`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to fetch rating');
        }

        return responseData.result || responseData;
    }

    /**
     * Delete rating (admin can delete any rating)
     */
    async deleteRating(ratingId: number): Promise<void> {
        const response = await api.delete(`/api/admin/ratings/${ratingId}`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to delete rating');
        }
    }

    /**
     * Get rating statistics
     */
    async getRatingStatistics(): Promise<RatingStatistics> {
        const response = await api.get('/api/admin/ratings/statistics');
        const responseData = response.data;

        console.log('📊 Rating Statistics Response:', responseData);

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to fetch rating statistics');
        }

        return responseData.result || responseData;
    }

    /**
     * Get blog rating summary
     */
    async getBlogRatingSummary(blogId: number): Promise<BlogRatingSummary> {
        const response = await api.get(`/api/admin/ratings/blog/${blogId}/summary`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to fetch blog rating summary');
        }

        return responseData.result || responseData;
    }

    // ============= Semantic Toxicity Analysis ============= //

    /**
     * Analyze toxicity of a single comment using semantic AI
     */
    async analyzeCommentToxicity(commentId: number): Promise<ToxicityAnalysisResult> {
        const response = await api.post(`/api/admin/comment-moderation/${commentId}/analyze-toxicity`);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to analyze comment toxicity');
        }

        return responseData.result || responseData;
    }

    /**
     * Batch analyze toxicity for multiple comments
     */
    async batchAnalyzeToxicity(commentIds: number[]): Promise<BatchAnalysisResult> {
        const response = await api.post('/api/admin/comment-moderation/batch-analyze', commentIds);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to batch analyze toxicity');
        }

        return responseData.result || responseData;
    }

    /**
     * Bulk action on comments based on toxicity score filters
     * @param action - 'hide', 'show', or 'delete'
     * @param commentIds - List of comment IDs to filter from
     * @param minToxicity - Minimum toxicity score (0.0-1.0)
     * @param confidence - Filter by confidence level: HIGH, MEDIUM, LOW
     */
    async bulkActionComments(
        action: 'hide' | 'show' | 'delete',
        commentIds: number[],
        minToxicity?: number,
        confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
    ): Promise<BulkActionResult> {
        const params = new URLSearchParams();
        params.append('action', action);
        if (minToxicity !== undefined) params.append('minToxicity', minToxicity.toString());
        if (confidence) params.append('confidence', confidence);

        const response = await api.post(`/api/admin/comment-moderation/bulk-action?${params.toString()}`, commentIds);
        const responseData = response.data;

        if (responseData.code && (responseData.code < 200 || responseData.code >= 300)) {
            throw new Error(responseData.message || 'Failed to perform bulk action');
        }

        return responseData.result || responseData;
    }
}

export const adminModerationApi = new AdminModerationApiService();
export default adminModerationApi;
