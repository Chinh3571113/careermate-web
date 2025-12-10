/**
 * Job Application Status System (Backend v3.0)
 * 13-status system for complete application lifecycle tracking
 */

export type JobApplicationStatus =
  // Application Phase
  | 'SUBMITTED'              // Initial application submitted
  | 'REVIEWING'              // Recruiter reviewing application
  | 'NO_RESPONSE'           // No response after 7 days (auto)
  
  // Interview Phase
  | 'INTERVIEW_SCHEDULED'   // Interview scheduled, awaiting confirmation
  | 'INTERVIEWED'           // Interview completed, awaiting decision
  
  // Decision Phase
  | 'APPROVED'              // Approved for next stage
  | 'OFFER_EXTENDED'        // Job offer extended, awaiting candidate confirmation (v3.1)
  | 'REJECTED'              // Application/interview rejected
  
  // Employment Phase
  | 'ACCEPTED'              // Legacy: Offer accepted (use WORKING in v3.0)
  | 'WORKING'               // Currently employed (v3.0 standard)
  | 'TERMINATED'            // Employment ended
  
  // Special Statuses
  | 'WITHDRAWN'             // Candidate withdrew application
  | 'BANNED';               // Candidate banned from company

/**
 * Status categories for filtering and grouping
 */
export type StatusCategory = 
  | 'application'
  | 'interview'
  | 'decision'
  | 'employment'
  | 'special';

/**
 * Status transition rules
 */
export interface StatusTransition {
  from: JobApplicationStatus;
  to: JobApplicationStatus[];
  actor: 'candidate' | 'recruiter' | 'system';
}

/**
 * Status display configuration
 */
export interface StatusConfig {
  status: JobApplicationStatus;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  lucideIcon: string;
  text: string;
  category: StatusCategory;
  isTerminal: boolean;
}

/**
 * Action button configuration for each status
 */
export interface StatusAction {
  label: string;
  action: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  icon?: string;
}

export interface StatusActions {
  candidate: StatusAction[];
  recruiter: StatusAction[];
}

/**
 * Complete status configuration map
 */
export const STATUS_CONFIGS: Record<JobApplicationStatus, StatusConfig> = {
  SUBMITTED: {
    status: 'SUBMITTED',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: '📝',
    lucideIcon: 'FileText',
    text: 'Awaiting review',
    category: 'application',
    isTerminal: false,
  },
  REVIEWING: {
    status: 'REVIEWING',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: '👀',
    lucideIcon: 'Eye',
    text: 'Under review',
    category: 'application',
    isTerminal: false,
  },
  NO_RESPONSE: {
    status: 'NO_RESPONSE',
    color: 'text-amber-800',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    icon: '⏰',
    lucideIcon: 'Clock',
    text: 'No response received',
    category: 'special',
    isTerminal: false,
  },
  INTERVIEW_SCHEDULED: {
    status: 'INTERVIEW_SCHEDULED',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    icon: '📅',
    lucideIcon: 'Calendar',
    text: 'Interview scheduled',
    category: 'interview',
    isTerminal: false,
  },
  INTERVIEWED: {
    status: 'INTERVIEWED',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    icon: '✅',
    lucideIcon: 'CheckCircle',
    text: 'Interview completed',
    category: 'interview',
    isTerminal: false,
  },
  APPROVED: {
    status: 'APPROVED',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: '👍',
    lucideIcon: 'ThumbsUp',
    text: 'Approved for next stage',
    category: 'decision',
    isTerminal: false,
  },
  OFFER_EXTENDED: {
    status: 'OFFER_EXTENDED',
    color: 'text-amber-800',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    icon: '📨',
    lucideIcon: 'Mail',
    text: 'Job offer received - Action required!',
    category: 'decision',
    isTerminal: false,
  },
  REJECTED: {
    status: 'REJECTED',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: '❌',
    lucideIcon: 'XCircle',
    text: 'Application rejected',
    category: 'decision',
    isTerminal: true,
  },
  ACCEPTED: {
    status: 'ACCEPTED',
    color: 'text-teal-800',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-300',
    icon: '✅',
    lucideIcon: 'CheckCircle',
    text: 'Accepted - Pending onboarding',
    category: 'employment',
    isTerminal: false,
  },
  WORKING: {
    status: 'WORKING',
    color: 'text-emerald-800',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    icon: '💼',
    lucideIcon: 'Briefcase',
    text: 'Currently employed',
    category: 'employment',
    isTerminal: false,
  },
  TERMINATED: {
    status: 'TERMINATED',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: '🏁',
    lucideIcon: 'Flag',
    text: 'Employment ended',
    category: 'employment',
    isTerminal: true,
  },
  WITHDRAWN: {
    status: 'WITHDRAWN',
    color: 'text-slate-800',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    icon: '↩️',
    lucideIcon: 'Undo2',
    text: 'Application withdrawn',
    category: 'special',
    isTerminal: true,
  },
  BANNED: {
    status: 'BANNED',
    color: 'text-red-100',
    bgColor: 'bg-red-900',
    borderColor: 'border-red-800',
    icon: '🚫',
    lucideIcon: 'Ban',
    text: 'Banned from company',
    category: 'special',
    isTerminal: true,
  },
};

/**
 * Status transition rules (Aligned with Backend v3.1)
 * 
 * NEW IN v3.1: Offer confirmation flow
 * APPROVED → Recruiter extends offer → OFFER_EXTENDED → Candidate confirms → WORKING
 * 
 * Auto-withdrawal: When a candidate is hired (ACCEPTED/WORKING), all their other 
 * pending applications are automatically withdrawn by the system.
 * 
 * Interview reminders: System sends 24-hour and 2-hour reminders before interviews.
 */
export const STATUS_TRANSITIONS: StatusTransition[] = [
  // From SUBMITTED - recruiter can schedule interview directly or review first
  { from: 'SUBMITTED', to: ['REVIEWING', 'INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED', 'NO_RESPONSE', 'WITHDRAWN', 'BANNED'], actor: 'recruiter' },
  { from: 'SUBMITTED', to: ['WITHDRAWN'], actor: 'candidate' },
  
  // From REVIEWING - can schedule interview, approve directly (for referrals), or reject
  { from: 'REVIEWING', to: ['INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'BANNED'], actor: 'recruiter' },
  { from: 'REVIEWING', to: ['WITHDRAWN'], actor: 'candidate' },
  { from: 'REVIEWING', to: ['NO_RESPONSE'], actor: 'system' },
  
  // From NO_RESPONSE
  { from: 'NO_RESPONSE', to: ['REVIEWING', 'REJECTED'], actor: 'recruiter' },
  
  // From INTERVIEW_SCHEDULED
  { from: 'INTERVIEW_SCHEDULED', to: ['INTERVIEWED', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'BANNED'], actor: 'recruiter' },
  { from: 'INTERVIEW_SCHEDULED', to: ['WITHDRAWN'], actor: 'candidate' },
  
  // From INTERVIEWED - can approve, reject, or schedule another interview round
  { from: 'INTERVIEWED', to: ['APPROVED', 'REJECTED', 'INTERVIEW_SCHEDULED'], actor: 'recruiter' },
  
  // From APPROVED - recruiter extends job offer (v3.1), candidate can withdraw
  { from: 'APPROVED', to: ['OFFER_EXTENDED', 'REJECTED'], actor: 'recruiter' },
  { from: 'APPROVED', to: ['WITHDRAWN'], actor: 'candidate' },
  
  // From OFFER_EXTENDED - candidate confirms or declines the offer (v3.1)
  { from: 'OFFER_EXTENDED', to: ['WORKING'], actor: 'candidate' },  // Confirm offer
  { from: 'OFFER_EXTENDED', to: ['WITHDRAWN'], actor: 'candidate' }, // Decline offer
  { from: 'OFFER_EXTENDED', to: ['REJECTED'], actor: 'recruiter' },  // Recruiter can rescind offer
  
  // From ACCEPTED (legacy - kept for backward compatibility)
  { from: 'ACCEPTED', to: ['WORKING'], actor: 'recruiter' },
  { from: 'ACCEPTED', to: ['WITHDRAWN'], actor: 'candidate' },
  
  // From WORKING - can end employment
  { from: 'WORKING', to: ['TERMINATED', 'BANNED'], actor: 'recruiter' },
  { from: 'WORKING', to: ['TERMINATED'], actor: 'candidate' },
  
  // System-triggered transitions (auto-withdrawal when hired elsewhere)
  { from: 'SUBMITTED', to: ['WITHDRAWN'], actor: 'system' },
  { from: 'REVIEWING', to: ['WITHDRAWN'], actor: 'system' },
  { from: 'INTERVIEW_SCHEDULED', to: ['WITHDRAWN'], actor: 'system' },
  { from: 'INTERVIEWED', to: ['WITHDRAWN'], actor: 'system' },
  { from: 'APPROVED', to: ['WITHDRAWN'], actor: 'system' },
  { from: 'OFFER_EXTENDED', to: ['WITHDRAWN'], actor: 'system' },
  
  // Terminal statuses (no transitions)
  { from: 'REJECTED', to: [], actor: 'recruiter' },
  { from: 'OFFER_EXTENDED', to: [], actor: 'recruiter' }, // Terminal for recruiter (candidate must respond)
  { from: 'TERMINATED', to: [], actor: 'recruiter' },
  { from: 'WITHDRAWN', to: [], actor: 'candidate' },
  { from: 'BANNED', to: [], actor: 'recruiter' },
];

/**
 * Status-specific actions for candidates and recruiters
 * Aligned with Backend v3.0 - includes all allowed transitions
 */
export const STATUS_ACTIONS: Record<JobApplicationStatus, StatusActions> = {
  SUBMITTED: {
    candidate: [
      { label: 'Withdraw Application', action: 'withdraw', variant: 'outline', icon: 'Undo2' },
    ],
    recruiter: [
      { label: 'Review', action: 'review', variant: 'default', icon: 'Eye' },
      { label: 'Schedule Interview', action: 'schedule_interview', variant: 'secondary', icon: 'Calendar' },
      { label: 'Approve', action: 'approve', variant: 'secondary', icon: 'ThumbsUp' },
      { label: 'Reject', action: 'reject', variant: 'destructive', icon: 'XCircle' },
      { label: 'Ban', action: 'ban', variant: 'destructive', icon: 'Ban' },
    ],
  },
  REVIEWING: {
    candidate: [
      { label: 'Withdraw Application', action: 'withdraw', variant: 'outline', icon: 'Undo2' },
    ],
    recruiter: [
      { label: 'Schedule Interview', action: 'schedule_interview', variant: 'default', icon: 'Calendar' },
      { label: 'Approve', action: 'approve', variant: 'secondary', icon: 'ThumbsUp' },
      { label: 'Reject', action: 'reject', variant: 'destructive', icon: 'XCircle' },
      { label: 'Ban', action: 'ban', variant: 'destructive', icon: 'Ban' },
    ],
  },
  NO_RESPONSE: {
    candidate: [
      { label: 'Contact Company', action: 'contact', variant: 'outline', icon: 'MessageCircle' },
      { label: 'Withdraw', action: 'withdraw', variant: 'outline', icon: 'Undo2' },
    ],
    recruiter: [
      { label: 'Review', action: 'review', variant: 'default', icon: 'Eye' },
      { label: 'Reject', action: 'reject', variant: 'destructive', icon: 'XCircle' },
    ],
  },
  INTERVIEW_SCHEDULED: {
    candidate: [
      { label: 'Confirm Interview', action: 'confirm_interview', variant: 'default', icon: 'CheckCircle' },
      { label: 'Request Reschedule', action: 'request_reschedule', variant: 'outline', icon: 'Calendar' },
      { label: 'View Details', action: 'view_interview', variant: 'outline', icon: 'Eye' },
      { label: 'Withdraw', action: 'withdraw', variant: 'outline', icon: 'Undo2' },
    ],
    recruiter: [
      { label: 'View Interview', action: 'view_interview', variant: 'default', icon: 'Eye' },
      { label: 'Complete Interview', action: 'complete_interview', variant: 'secondary', icon: 'CheckCircle' },
      { label: 'Reschedule', action: 'reschedule', variant: 'outline', icon: 'Calendar' },
      { label: 'Mark No-Show', action: 'mark_no_show', variant: 'destructive', icon: 'UserX' },
      { label: 'Cancel', action: 'cancel_interview', variant: 'destructive', icon: 'XCircle' },
    ],
  },
  INTERVIEWED: {
    candidate: [
      { label: 'View Interview Details', action: 'view_interview', variant: 'outline', icon: 'Eye' },
    ],
    recruiter: [
      { label: 'Approve', action: 'approve', variant: 'default', icon: 'ThumbsUp' },
      { label: 'Reject', action: 'reject', variant: 'destructive', icon: 'XCircle' },
      { label: 'Schedule 2nd Interview', action: 'schedule_interview', variant: 'outline', icon: 'Calendar' },
    ],
  },
  APPROVED: {
    candidate: [
      { label: 'View Details', action: 'view_details', variant: 'outline', icon: 'Eye' },
      { label: 'Withdraw', action: 'withdraw', variant: 'outline', icon: 'Undo2' },
    ],
    recruiter: [
      { label: 'Extend Job Offer', action: 'extend_offer', variant: 'default', icon: 'Mail' },
      { label: 'Reject', action: 'reject', variant: 'destructive', icon: 'XCircle' },
    ],
  },
  OFFER_EXTENDED: {
    candidate: [
      { label: '✅ Accept Offer', action: 'confirm_offer', variant: 'default', icon: 'CheckCircle' },
      { label: '❌ Decline Offer', action: 'decline_offer', variant: 'destructive', icon: 'XCircle' },
      { label: 'View Offer Details', action: 'view_details', variant: 'outline', icon: 'Eye' },
    ],
    recruiter: [
      { label: 'Waiting for Response', action: 'view_details', variant: 'outline', icon: 'Clock' },
      { label: 'Rescind Offer', action: 'reject', variant: 'destructive', icon: 'XCircle' },
    ],
  },
  REJECTED: {
    candidate: [],
    recruiter: [],
  },
  ACCEPTED: {
    candidate: [
      { label: 'View Employment Details', action: 'view_employment', variant: 'outline', icon: 'Eye' },
      { label: 'Withdraw', action: 'withdraw', variant: 'outline', icon: 'Undo2' },
    ],
    recruiter: [
      { label: 'Start Employment', action: 'start_employment', variant: 'default', icon: 'Briefcase' },
      { label: 'View Details', action: 'view_employment', variant: 'outline', icon: 'Eye' },
    ],
  },
  WORKING: {
    candidate: [
      { label: 'Submit Review', action: 'submit_review', variant: 'default', icon: 'Star' },
      { label: 'View Employment', action: 'view_employment', variant: 'outline', icon: 'Eye' },
      { label: 'End Employment', action: 'terminate_employment', variant: 'destructive', icon: 'Flag' },
    ],
    recruiter: [
      { label: 'Terminate Employment', action: 'terminate', variant: 'destructive', icon: 'Flag' },
      { label: 'View Details', action: 'view_employment', variant: 'outline', icon: 'Eye' },
    ],
  },
  TERMINATED: {
    candidate: [
      { label: 'Submit Review', action: 'submit_review', variant: 'default', icon: 'Star' },
      { label: 'View History', action: 'view_employment', variant: 'outline', icon: 'Eye' },
    ],
    recruiter: [
      { label: 'View History', action: 'view_employment', variant: 'outline', icon: 'Eye' },
    ],
  },
  WITHDRAWN: {
    candidate: [],
    recruiter: [],
  },
  BANNED: {
    candidate: [
      { label: 'Appeal Ban', action: 'appeal_ban', variant: 'default', icon: 'MessageCircle' },
      { label: 'Contact Support', action: 'contact_support', variant: 'outline', icon: 'HelpCircle' },
    ],
    recruiter: [
      { label: 'Unban', action: 'unban', variant: 'default', icon: 'CheckCircle' },
      { label: 'Edit Ban Reason', action: 'edit_ban', variant: 'outline', icon: 'Edit' },
    ],
  },
};
