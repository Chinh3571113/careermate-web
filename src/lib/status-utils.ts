/**
 * Status Utility Functions
 * Helper functions for job application status handling
 */

import {
  JobApplicationStatus,
  StatusCategory,
  StatusConfig,
  STATUS_CONFIGS,
  STATUS_TRANSITIONS,
  STATUS_ACTIONS,
  StatusAction,
  StatusActions,
} from '@/types/status';

/**
 * Normalize status from API (keep ACCEPTED as distinct status)
 * Only normalizes formatting, no longer converts ACCEPTED to WORKING
 */
export const normalizeStatus = (status: string): JobApplicationStatus => {
  return status.toUpperCase() as JobApplicationStatus;
};

/**
 * Get status configuration
 */
export const getStatusConfig = (status: JobApplicationStatus): StatusConfig => {
  return STATUS_CONFIGS[status];
};

/**
 * Get status badge color classes
 */
export const getStatusColor = (status: JobApplicationStatus): string => {
  const config = getStatusConfig(status);
  return `${config.bgColor} ${config.color} ${config.borderColor}`;
};

/**
 * Get status display text
 */
export const getStatusText = (status: JobApplicationStatus): string => {
  const config = getStatusConfig(status);
  return config.text;
};

/**
 * Get status icon (emoji)
 */
export const getStatusIcon = (status: JobApplicationStatus): string => {
  const config = getStatusConfig(status);
  return config.icon;
};

/**
 * Get status Lucide icon name
 */
export const getStatusLucideIcon = (status: JobApplicationStatus): string => {
  const config = getStatusConfig(status);
  return config.lucideIcon;
};

/**
 * Get status category
 */
export const getStatusCategory = (status: JobApplicationStatus): StatusCategory => {
  const config = getStatusConfig(status);
  return config.category;
};

/**
 * Check if status is terminal (cannot transition)
 */
export const isTerminalStatus = (status: JobApplicationStatus): boolean => {
  const config = getStatusConfig(status);
  return config.isTerminal;
};

/**
 * Check if transition is allowed
 */
export const canTransitionTo = (
  from: JobApplicationStatus,
  to: JobApplicationStatus,
  actor: 'candidate' | 'recruiter' | 'system'
): boolean => {
  const transitions = STATUS_TRANSITIONS.filter(
    (t) => t.from === from && (t.actor === actor || t.actor === 'system')
  );
  
  return transitions.some((t) => t.to.includes(to));
};

/**
 * Get allowed transitions for a status
 */
export const getAllowedTransitions = (
  status: JobApplicationStatus,
  actor: 'candidate' | 'recruiter' | 'system'
): JobApplicationStatus[] => {
  const transitions = STATUS_TRANSITIONS.filter(
    (t) => t.from === status && (t.actor === actor || t.actor === 'system')
  );
  
  const allowed: JobApplicationStatus[] = [];
  transitions.forEach((t) => {
    allowed.push(...t.to);
  });
  
  return [...new Set(allowed)]; // Remove duplicates
};

/**
 * Get actions for a status by role
 */
export const getStatusActions = (
  status: JobApplicationStatus,
  role: 'candidate' | 'recruiter'
): StatusAction[] => {
  return STATUS_ACTIONS[status][role];
};

/**
 * Get all candidate actions
 */
export const getCandidateActions = (status: JobApplicationStatus): StatusAction[] => {
  return getStatusActions(status, 'candidate');
};

/**
 * Get all recruiter actions
 */
export const getRecruiterActions = (status: JobApplicationStatus): StatusAction[] => {
  return getStatusActions(status, 'recruiter');
};

/**
 * Filter statuses by category
 */
export const getStatusesByCategory = (category: StatusCategory): JobApplicationStatus[] => {
  return Object.values(STATUS_CONFIGS)
    .filter((config) => config.category === category)
    .map((config) => config.status);
};

/**
 * Get all terminal statuses
 */
export const getTerminalStatuses = (): JobApplicationStatus[] => {
  return Object.values(STATUS_CONFIGS)
    .filter((config) => config.isTerminal)
    .map((config) => config.status);
};

/**
 * Get all active (non-terminal) statuses
 */
export const getActiveStatuses = (): JobApplicationStatus[] => {
  return Object.values(STATUS_CONFIGS)
    .filter((config) => !config.isTerminal)
    .map((config) => config.status);
};

/**
 * Get display status with user-friendly text
 */
export const getDisplayStatus = (status: string): string => {
  const normalized = normalizeStatus(status);
  return getStatusText(normalized);
};

/**
 * Check if status requires action from candidate
 */
export const requiresCandidateAction = (status: JobApplicationStatus): boolean => {
  const actions = getCandidateActions(status);
  // v3.1: Added confirm_offer and decline_offer as critical actions
  const criticalActions = ['confirm_interview', 'confirm_offer', 'decline_offer'];
  return actions.some((action) => criticalActions.includes(action.action));
};

/**
 * Check if status requires action from recruiter
 */
export const requiresRecruiterAction = (status: JobApplicationStatus): boolean => {
  const actions = getRecruiterActions(status);
  const criticalActions = ['review', 'schedule_interview', 'approve', 'reject', 'extend_offer'];
  return actions.some((action) => criticalActions.includes(action.action));
};

/**
 * Get status sort order for UI display
 */
export const getStatusSortOrder = (status: JobApplicationStatus): number => {
  const order: Record<JobApplicationStatus, number> = {
    SUBMITTED: 1,
    REVIEWING: 2,
    NO_RESPONSE: 3,
    INTERVIEW_SCHEDULED: 4,
    INTERVIEWED: 5,
    APPROVED: 6,
    OFFER_EXTENDED: 7,  // v3.1: New status between APPROVED and employment
    ACCEPTED: 8,
    WORKING: 9,
    TERMINATED: 10,
    REJECTED: 12,
    WITHDRAWN: 13,
    BANNED: 14,
  };
  
  return order[status] || 999;
};

/**
 * Sort statuses by logical order
 */
export const sortStatuses = (statuses: JobApplicationStatus[]): JobApplicationStatus[] => {
  return [...statuses].sort((a, b) => getStatusSortOrder(a) - getStatusSortOrder(b));
};

/**
 * Get status badge variant for UI library
 */
export const getStatusBadgeVariant = (
  status: JobApplicationStatus
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const category = getStatusCategory(status);
  
  switch (category) {
    case 'application':
      return 'secondary';
    case 'interview':
      return 'default';
    case 'decision':
      return status === 'REJECTED' ? 'destructive' : 'default';
    case 'employment':
      return status === 'TERMINATED' ? 'destructive' : 'default';
    case 'special':
      return status === 'BANNED' ? 'destructive' : 'outline';
    default:
      return 'default';
  }
};

/**
 * Format status for API requests (uppercase)
 */
export const formatStatusForAPI = (status: JobApplicationStatus): string => {
  return status.toUpperCase();
};

/**
 * Parse status from API response
 */
export const parseStatusFromAPI = (status: string): JobApplicationStatus => {
  return normalizeStatus(status.toUpperCase());
};

/**
 * Get status help text for tooltips
 */
export const getStatusHelpText = (status: JobApplicationStatus): string => {
  const helpTexts: Record<JobApplicationStatus, string> = {
    SUBMITTED: 'Your application has been submitted and is awaiting review by the recruiter.',
    REVIEWING: 'The recruiter is currently reviewing your application.',
    NO_RESPONSE: 'No response has been received from the company after 7 days.',
    INTERVIEW_SCHEDULED: 'An interview has been scheduled. Please confirm your attendance.',
    INTERVIEWED: 'The interview has been completed. Waiting for the recruiter\'s decision.',
    APPROVED: 'Your application has been approved by the recruiter.',
    REJECTED: 'Unfortunately, your application was not successful at this time.',
    ACCEPTED: 'You have accepted. The company will contact you for onboarding.',
    WORKING: 'You are currently employed at this company.',
    TERMINATED: 'Your employment at this company has ended.',
    WITHDRAWN: 'You have withdrawn your application.',
    BANNED: 'You have been banned from applying to this company.',
  };
  
  return helpTexts[status];
};

/**
 * Check if status allows review submission
 */
export const canSubmitReview = (status: JobApplicationStatus): boolean => {
  return ['WORKING', 'TERMINATED'].includes(status);
};

/**
 * Check if status indicates active employment
 */
export const isActivelyEmployed = (status: JobApplicationStatus): boolean => {
  return status === 'WORKING' || status === 'ACCEPTED';
};

/**
 * Check if status is interview-related
 */
export const isInterviewStatus = (status: JobApplicationStatus): boolean => {
  return getStatusCategory(status) === 'interview';
};

/**
 * Get next likely status (for UI hints)
 */
export const getNextLikelyStatus = (
  currentStatus: JobApplicationStatus,
  role: 'candidate' | 'recruiter'
): JobApplicationStatus | null => {
  const transitions = getAllowedTransitions(currentStatus, role);
  
  // Return most common next status based on positive flow
  const positiveFlow: Partial<Record<JobApplicationStatus, JobApplicationStatus>> = {
    SUBMITTED: 'REVIEWING',
    REVIEWING: 'INTERVIEW_SCHEDULED',
    INTERVIEW_SCHEDULED: 'INTERVIEWED',
    INTERVIEWED: 'APPROVED',
    APPROVED: 'WORKING',
  };
  
  const next = positiveFlow[currentStatus];
  if (next && transitions.includes(next)) {
    return next;
  }
  
  return transitions.length > 0 ? transitions[0] : null;
};
