/**
 * Admin Dashboard API Service - Simplified Single Endpoint
 * Following the new backend architecture with ONE endpoint for everything
 */

import api from './api';

// ==================== INTERFACES ====================

/**
 * Complete dashboard statistics from single endpoint
 * GET /api/admin/dashboard/stats
 */
export interface DashboardStats {
  // User Statistics
  totalUsers: number;
  totalCandidates: number;
  totalRecruiters: number;
  totalAdmins: number;
  
  // Account Status
  activeAccounts: number;
  pendingAccounts: number;
  bannedAccounts: number;
  rejectedAccounts: number;
  
  // Content Statistics
  totalBlogs: number;
  totalJobPostings: number;
  totalApplications: number;
  
  // Moderation Queue
  pendingRecruiterApprovals: number;
  flaggedComments: number;
  flaggedRatings: number;
  
  // Revenue & Payment Statistics
  totalRevenue: number;
  recruiterRevenue: number;
  candidateRevenue: number;
  activeSubscriptions: number;
  totalTransactions: number;
  
  // System Health (Simplified!)
  databaseStatus: 'UP' | 'DOWN' | 'UNKNOWN';
  kafkaStatus: 'UP' | 'DOWN' | 'UNKNOWN';
  weaviateStatus: 'UP' | 'DOWN' | 'UNKNOWN';
  emailStatus: 'UP' | 'DOWN' | 'UNKNOWN';
  firebaseStatus: 'UP' | 'DOWN' | 'UNKNOWN';
  systemStatus: 'UP' | 'DOWN';
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

// ==================== API FUNCTIONS ====================

/**
 * Get all dashboard statistics in ONE API call
 * This replaces multiple old endpoints with a single efficient call
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    console.log("🌐 API Call: GET /api/admin/dashboard/stats");
    const response = await api.get<ApiResponse<DashboardStats>>(
      '/api/admin/dashboard/stats'
    );
    console.log("📦 Raw API response:", response);
    console.log("📦 Response status:", response.status);
    console.log("📦 Response data:", response.data);
    console.log("📦 Response data.result:", response.data?.result);
    
    if (!response.data?.result) {
      console.error("⚠️ WARNING: response.data.result is undefined or null");
      console.error("Full response structure:", JSON.stringify(response.data, null, 2));
    }
    
    return response.data.result;
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    if (error && typeof error === 'object') {
      console.error('Error details:', {
        message: (error as any).message,
        response: (error as any).response?.data,
        status: (error as any).response?.status,
      });
    }
    throw error;
  }
};
