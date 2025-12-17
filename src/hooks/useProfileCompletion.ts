/**
 * Custom hook to calculate profile completion percentage
 * Shared between Dashboard and CM Profile for consistency
 * 
 * This ensures both pages show the SAME completion percentage
 * using the SAME data source and SAME calculation logic
 */

import { useMemo } from 'react';
import { calculateProfileCompletion } from '@/lib/profile-completion';

interface ProfileData {
  // Profile fields
  fullName?: string;
  title?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  link?: string;
  
  // Content
  aboutMe?: string;
  
  // Arrays
  awards?: any[];
  certificates?: any[];
  projects?: any[];
  languages?: any[];
  educations?: any[];
  workExperiences?: any[];
  
  // Skills (can be either skill groups or flat arrays)
  coreSkillGroups?: Array<{ items?: any[] }>;
  softSkillGroups?: Array<{ items?: any[] }>;
  coreSkills?: any[];
  softSkills?: any[];
}

/**
 * Calculate profile completion from profile data
 * Handles both skill group format (from hooks) and flat array format (from API)
 */
export function useProfileCompletion(profileData: ProfileData) {
  return useMemo(() => {
    // Count skills - handle both formats
    let coreSkillsCount = 0;
    let softSkillsCount = 0;

    if (profileData.coreSkillGroups || profileData.softSkillGroups) {
      // From hooks (skill groups)
      coreSkillsCount = (profileData.coreSkillGroups || []).reduce(
        (total, group) => total + (group.items?.length || 0),
        0
      );
      softSkillsCount = (profileData.softSkillGroups || []).reduce(
        (total, group) => total + (group.items?.length || 0),
        0
      );
    } else {
      // From API (flat arrays)
      coreSkillsCount = profileData.coreSkills?.length || 0;
      softSkillsCount = profileData.softSkills?.length || 0;
    }

    // Prepare data for calculation
    const completionData = {
      fullName: profileData.fullName,
      title: profileData.title,
      phone: profileData.phone,
      dob: profileData.dob,
      gender: profileData.gender,
      address: profileData.address,
      link: profileData.link,
      aboutMe: profileData.aboutMe,
      awards: profileData.awards || [],
      certificates: profileData.certificates || [],
      projects: profileData.projects || [],
      languages: profileData.languages || [],
      educations: profileData.educations || [],
      workExperiences: profileData.workExperiences || [],
      coreSkills: Array(coreSkillsCount).fill({}), // Mock array with correct length
      softSkills: Array(softSkillsCount).fill({}), // Mock array with correct length
    };

    const completion = calculateProfileCompletion(completionData);
    
    // Debug log
    console.log('🧮 useProfileCompletion:', {
      input: {
        fullName: !!profileData.fullName,
        educations: profileData.educations?.length || 0,
        workExperiences: profileData.workExperiences?.length || 0,
        coreSkillsCount,
        softSkillsCount,
        awards: profileData.awards?.length || 0,
      },
      output: completion + '%'
    });

    return completion;
  }, [
    profileData.fullName,
    profileData.title,
    profileData.phone,
    profileData.dob,
    profileData.gender,
    profileData.address,
    profileData.link,
    profileData.aboutMe,
    profileData.awards,
    profileData.certificates,
    profileData.projects,
    profileData.languages,
    profileData.educations,
    profileData.workExperiences,
    profileData.coreSkillGroups,
    profileData.softSkillGroups,
    profileData.coreSkills,
    profileData.softSkills,
  ]);
}
