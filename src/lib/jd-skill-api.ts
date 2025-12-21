import api from './api';

export interface JDSkill {
  id: number;
  name: string;
}

export interface JDSkillResponse {
  code: number;
  message: string;
  result: JDSkill[];
}

/**
 * Search skills by keyword
 * GET /api/jdskill?keyword={skill_name}
 */
export const searchSkills = async (keyword: string): Promise<JDSkill[]> => {
  try {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const response = await api.get<JDSkillResponse>('/api/jdskill', {
      params: { keyword: keyword.trim() }
    });

    if (response.data.code === 200 || response.data.code === 1073741824) {
      return response.data.result || [];
    }

    return [];
  } catch (error: any) {
    console.error('Error searching skills:', error);
    return [];
  }
};
