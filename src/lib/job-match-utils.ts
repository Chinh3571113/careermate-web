/**
 * Job Match Level Utilities
 * 
 * Converts numerical match scores to qualitative labels
 * for better user experience and non-negative messaging.
 */

export type MatchLevel = 
  | 'excellent'
  | 'strong'
  | 'moderate'
  | 'potential'
  | 'exploratory';

export interface MatchLevelInfo {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
}

/**
 * Get match level from score (0-1 range)
 */
export function getMatchLevel(score: number): MatchLevel {
  const percentage = score * 100;
  
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'strong';
  if (percentage >= 40) return 'moderate';
  if (percentage >= 20) return 'potential';
  return 'exploratory';
}

/**
 * Get match level display information
 */
export function getMatchLevelInfo(score: number): MatchLevelInfo {
  const level = getMatchLevel(score);
  
  const matchLevels: Record<MatchLevel, MatchLevelInfo> = {
    excellent: {
      label: 'Excellent Fit',
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      iconColor: 'text-green-500',
    },
    strong: {
      label: 'Strong Fit',
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-500',
    },
    moderate: {
      label: 'Moderate Fit',
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-500',
    },
    potential: {
      label: 'Potential Fit',
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      iconColor: 'text-orange-500',
    },
    exploratory: {
      label: 'Exploratory Fit',
      color: 'gray',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-500',
    },
  };
  
  return matchLevels[level];
}

/**
 * Get numeric percentage for internal logic (sorting, etc.)
 * Not meant for display
 */
export function getMatchPercentage(score: number): number {
  return Math.round(score * 100);
}
