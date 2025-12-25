import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { getCurrentUser } from '@/lib/user-api';
import { fetchCurrentCandidateProfile } from '@/lib/candidate-profile-api';
import { useAuthStore } from '@/store/use-auth-store';
import api from "@/lib/api";

// ===== Shared state for avatar across all hook instances =====
let sharedAvatarUrl: string | null = null;
let sharedUsername: string | null = null;
let sharedHasFetched = false; // Track if data has been fetched globally
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getAvatarSnapshot() {
  return sharedAvatarUrl;
}

function getUsernameSnapshot() {
  return sharedUsername;
}

function getServerSnapshot() {
  return null;
}

function setSharedAvatar(url: string | null) {
  console.log('🔄 [setSharedAvatar] Setting avatar:', url);
  sharedAvatarUrl = url;
  listeners.forEach(listener => listener());
}

function setSharedUsername(name: string | null) {
  sharedUsername = name;
  listeners.forEach(listener => listener());
}

function resetSharedState() {
  sharedAvatarUrl = null;
  sharedUsername = null;
  sharedHasFetched = false;
  listeners.forEach(listener => listener());
}

// ===== The hook =====
export const useUserProfile = () => {
  // Use useSyncExternalStore for shared state
  const avatarUrl = useSyncExternalStore(subscribe, getAvatarSnapshot, getServerSnapshot);
  const username = useSyncExternalStore(subscribe, getUsernameSnapshot, getServerSnapshot);
  
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, accessToken } = useAuthStore();

  const fetchUserData = useCallback(async (force = false) => {
    // Wait for auth to be ready
    if (!accessToken || !isAuthenticated) {
      console.log('❌ [useUserProfile] No accessToken or not authenticated');
      return;
    }

    // Don't fetch if we already have data (unless forced)
    if (!force && sharedHasFetched && sharedAvatarUrl) {
      console.log('ℹ️ [useUserProfile] Already fetched, skipping');
      return;
    }

    console.log('🔄 [useUserProfile] Fetching user data...', { 
      email: user?.email, 
      role: user?.role,
      force
    });
    
    setLoading(true);
    try {
      // Fetch username from /api/users/current if not in JWT
      if (!user?.username) {
        try {
          const userData = await getCurrentUser();
          if (userData?.username) {
            console.log('✅ [useUserProfile] Username from API:', userData.username);
            setSharedUsername(userData.username);
          }
        } catch (err) {
          console.error('❌ [useUserProfile] Error fetching user:', err);
        }
      } else {
        setSharedUsername(user.username);
      }

      // Check role to determine avatar source
      const isCandidate = user?.role === 'CANDIDATE' || 
                         user?.role === 'ROLE_CANDIDATE' || 
                         user?.role?.includes('CANDIDATE');
      
      const isRecruiter = user?.role === 'RECRUITER' || 
                         user?.role === 'ROLE_RECRUITER' || 
                         user?.role?.includes('RECRUITER');

      if (isCandidate) {
        try {
          console.log('🔄 [useUserProfile] Fetching candidate profile for avatar...');
          const candidateProfile = await fetchCurrentCandidateProfile();
          if (candidateProfile?.image) {
            console.log('✅ [useUserProfile] Avatar from candidate API:', candidateProfile.image);
            setSharedAvatar(candidateProfile.image);
          }
        } catch (profileError: any) {
          if (profileError?.message !== 'PROFILE_NOT_FOUND') {
            console.error('❌ [useUserProfile] Error fetching candidate profile:', profileError);
          }
        }
      } else if (isRecruiter) {
        try {
          console.log('🔄 [useUserProfile] Fetching recruiter profile for avatar...');
          const response = await api.get<{ code: number; result: { avatarUrl?: string; username?: string } }>('/api/recruiters/profile');
          console.log('📦 [useUserProfile] Recruiter Profile Response:', response.data);
          if (response.data?.result?.avatarUrl) {
            console.log('✅ [useUserProfile] Avatar from recruiter API:', response.data.result.avatarUrl);
            setSharedAvatar(response.data.result.avatarUrl);
          }
          if (response.data?.result?.username && !user?.username) {
            setSharedUsername(response.data.result.username);
          }
        } catch (profileError: any) {
          console.error('❌ [useUserProfile] Error fetching recruiter profile:', profileError);
        }
      } else {
        console.log('ℹ️ [useUserProfile] User role not recognized. Role:', user?.role);
      }
      
      sharedHasFetched = true;
    } catch (error) {
      console.error('❌ [useUserProfile] Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated, user]);

  useEffect(() => {
    // Reset state when user logs out
    if (!accessToken || !isAuthenticated) {
      resetSharedState();
      return;
    }

    fetchUserData();
  }, [accessToken, isAuthenticated, fetchUserData]);

  // Expose refetch function for manual refresh (e.g., after avatar upload)
  const refetchProfile = useCallback(() => {
    sharedHasFetched = false;
    fetchUserData(true);
  }, [fetchUserData]);

  return { username, avatarUrl, loading, refetchProfile };
};

// Export for direct update without refetch (optimistic update)
export const updateSharedAvatar = setSharedAvatar;
