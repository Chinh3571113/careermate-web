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
// Fetches both core and soft skills by default for admin management
export const getSkillList = async (): Promise<SkillListResponse> => {
  try {
    // Fetch both core and soft skills in parallel
    const [coreResponse, softResponse] = await Promise.all([
      api.get('/api/jdskill?type=core'),
      api.get('/api/jdskill?type=soft')
    ]);
    
    // Combine both results
    const combinedSkills = [
      ...coreResponse.data.result,
      ...softResponse.data.result
    ];
    
    // Remove duplicates by ID
    const uniqueSkills = Array.from(
      new Map(combinedSkills.map(skill => [skill.id, skill])).values()
    );
    
    return {
      code: 200,
      message: 'success',
      result: uniqueSkills
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
