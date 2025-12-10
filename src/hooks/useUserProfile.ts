import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/user-api';
import { fetchCurrentCandidateProfile } from '@/lib/candidate-profile-api';
import { useAuthStore } from '@/store/use-auth-store';

export const useUserProfile = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !user?.email) {
        setUsername(null);
        setAvatarUrl(null);
        console.log('❌ [useUserProfile] No auth or email');
        return;
      }

      // Nếu JWT đã có username, dùng luôn
      if (user?.username) {
        console.log('✅ [useUserProfile] Username from JWT:', user.username);
        setUsername(user.username);
      }

      // Fetch từ API to get username and avatar
      console.log('🔄 [useUserProfile] Fetching user data from API for:', user.email);
      setLoading(true);
      try {
        // Fetch username from /api/users/current
        if (!user?.username) {
          const userData = await getCurrentUser();
          console.log('📦 [useUserProfile] User API Response:', userData);
          if (userData?.username) {
            console.log('✅ [useUserProfile] Username from API:', userData.username);
            setUsername(userData.username);
          }
        }

        // Fetch avatar from /api/candidates/profiles/current - ONLY for candidates
        // Recruiters and other roles don't have access to this endpoint
        if (user?.role === 'CANDIDATE') {
          try {
            const candidateProfile = await fetchCurrentCandidateProfile();
            console.log('📦 [useUserProfile] Candidate Profile Response:', candidateProfile);
            if (candidateProfile?.image) {
              console.log('✅ [useUserProfile] Avatar from API:', candidateProfile.image);
              setAvatarUrl(candidateProfile.image);
            }
          } catch (profileError: any) {
            // Profile not found is expected for new users
            if (profileError?.message !== 'PROFILE_NOT_FOUND') {
              console.error('❌ [useUserProfile] Error fetching candidate profile:', profileError);
            }
          }
        }
      } catch (error) {
        console.error('❌ [useUserProfile] Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, isAuthenticated]);

  return { username, avatarUrl, loading };
};
