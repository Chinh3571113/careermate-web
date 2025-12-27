import api from './api';

export interface Skill {
  id: number;
  name: string;
}

export interface SkillListResponse {
  code: number;
  message: string;
  result: Skill[];
}

export interface SkillCreateResponse {
  code: number;
  message: string;
  result?: Skill;
}

// Get all skills (no pagination - returns full list)
// Uses type=all to get all skills regardless of type for admin management
export const getSkillList = async (): Promise<SkillListResponse> => {
  try {
    // Fetch all skills using type=all
    const response = await api.get('/api/jdskill?type=all');
    
    return {
      code: 200,
      message: 'success',
      result: response.data.result || []
    };
  } catch (error) {
    console.error('Error fetching skill list:', error);
    throw error;
  }
};

// Create a new skill using query parameter
export const createSkill = async (skillName: string): Promise<SkillCreateResponse> => {
  const response = await api.post(`/api/jdskill?name=${encodeURIComponent(skillName)}`);
  return response.data;
};

// Search/filter skills by name (client-side filtering)
export const searchSkills = (skills: Skill[], searchQuery: string): Skill[] => {
  if (!searchQuery.trim()) return skills;
  const query = searchQuery.toLowerCase();
  return skills.filter(skill => skill.name.toLowerCase().includes(query));
};
