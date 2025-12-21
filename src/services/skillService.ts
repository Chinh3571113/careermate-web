/**
 * Skill Service
 * Handles all skill-related API calls
 */

export interface SkillSuggestion {
  id?: string;
  name: string;
}

/**
 * Fetch skill suggestions from the API
 * @param keyword - Search keyword for skills
 * @param type - Type of skill: 'core' or 'soft'
 * @returns Array of skill suggestions
 */
export async function fetchSkillSuggestions(
  keyword: string,
  type: 'core' | 'soft'
): Promise<SkillSuggestion[]> {
  console.log('🔍 [fetchSkillSuggestions] Calling API with:', { keyword, type });

  try {
    const url = `/api/jdskill?keyword=${encodeURIComponent(keyword)}&type=${type}`;
    console.log('🔍 [fetchSkillSuggestions] URL:', url);

    const response = await fetch(url);

    console.log('🔍 [fetchSkillSuggestions] Response status:', response.status);

    if (!response.ok) {
      console.error('❌ [fetchSkillSuggestions] Failed to fetch skills:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('✅ [fetchSkillSuggestions] Response data:', data);

    // Extract the result array from the response
    const resultArray = data.result || data;
    console.log('✅ [fetchSkillSuggestions] Result array:', resultArray);

    // Transform the response data to ensure consistent format
    const suggestions = Array.isArray(resultArray)
      ? resultArray.map((item: string | SkillSuggestion) =>
        typeof item === 'string' ? { name: item } : item
      )
      : [];

    console.log('✅ [fetchSkillSuggestions] Processed suggestions:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('Error fetching skill suggestions:', error);
    return [];
  }
}
