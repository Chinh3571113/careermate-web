/**
 * Calculate profile completion percentage based on cm-profile logic
 * This ensures consistency between dashboard and cm-profile pages
 */

export interface ProfileCompletionData {
  // Profile header fields
  fullName?: string;
  title?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  link?: string;
  image?: string;
  
  // About me
  aboutMe?: string;
  
  // Arrays
  awards?: any[];
  certificates?: any[];
  projects?: any[];
  languages?: any[];
  educations?: any[];
  workExperiences?: any[];
  coreSkills?: any[]; // Flattened skill items
  softSkills?: any[]; // Flattened soft skill items
}

/**
 * Calculate profile completion percentage
 * Logic matches cm-profile/page.tsx profileCompletion calculation
 */
export function calculateProfileCompletion(data: ProfileCompletionData): number {
  let completion = 0;

  // 1. Awards, Certificates, Projects, Languages: +5% each if at least 1 item exists
  if (data.awards && data.awards.length > 0) completion += 5;
  if (data.certificates && data.certificates.length > 0) completion += 5;
  if (data.projects && data.projects.length > 0) completion += 5;
  if (data.languages && data.languages.length > 0) completion += 5;

  // 2. Education, About Me: +10% each if exists
  if (data.educations && data.educations.length > 0) completion += 10;
  if (data.aboutMe && data.aboutMe.trim().length > 0) completion += 10;

  // 3. Work Experience: +10% per item (max 3 = 30%)
  const workExpCount = Math.min(data.workExperiences?.length || 0, 3);
  completion += workExpCount * 10;

  // 4. Skills (Core + Soft combined): +2% per skill (max 10 = 20%)
  // This matches cm-profile calculation exactly
  const coreSkillsCount = data.coreSkills?.length || 0;
  const softSkillsCount = data.softSkills?.length || 0;
  const totalSkillsCount = coreSkillsCount + softSkillsCount;
  const skillsBonus = Math.min(totalSkillsCount, 10) * 2;
  completion += skillsBonus;

  // 5. Profile Header fields (excluding image): distribute remaining % among filled fields
  // Total possible from above: 5+5+5+5+10+10+30+20 = 90%
  // Remaining for profile fields: 10%
  const profileFields = [
    data.fullName,
    data.title,
    data.phone,
    data.dob,
    data.gender,
    data.address,
    data.link
  ];
  const filledProfileFields = profileFields.filter(field => field && field.trim().length > 0).length;
  const profileFieldBonus = (filledProfileFields / profileFields.length) * 10;
  completion += profileFieldBonus;

  return Math.round(completion);
}
