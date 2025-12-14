# Interview Completion Flow - Frontend Implementation Guide

## Overview

This document describes how to implement the interview completion flow in the frontend, including the correct API calls and status transitions based on the backend implementation.

---

## Interview Outcome Options

When completing an interview, recruiters must select one of these outcomes:

```typescript
enum InterviewOutcome {
  PASS = "PASS",                       // Candidate passed
  FAIL = "FAIL",                       // Candidate failed
  PENDING = "PENDING",                 // Still deciding
  NEEDS_SECOND_ROUND = "NEEDS_SECOND_ROUND"  // Need another interview
}
```

---

## Outcome → Job Application Status Mapping

| Interview Outcome | Interview Status | Job Application Status | What Happens Next |
|-------------------|------------------|----------------------|-------------------|
| `PASS` | `COMPLETED` | `APPROVED` | Recruiter can mark as `WORKING` when candidate starts |
| `FAIL` | `COMPLETED` | `REJECTED` | Application rejected, flow ends |
| `PENDING` | `COMPLETED` | `INTERVIEWED` | Interview done, still deciding |
| `NEEDS_SECOND_ROUND` | `RESCHEDULED` | `REVIEWING` | Candidate confirmation reset, recruiter schedules new interview |

### Special Handling: NEEDS_SECOND_ROUND

When selecting "Needs Second Round":
- Interview status → `RESCHEDULED` (NOT `COMPLETED`)
- Job application status → `REVIEWING` (NOT `INTERVIEW_SCHEDULED`)
- `candidateConfirmed` → `false` (reset for new confirmation)
- `candidateConfirmedAt` → `null`
- `interviewCompletedAt` → NOT set (interview not completed)

---

## API Endpoints

### 1. Complete Interview (Standard)

**Endpoint:** `POST /api/interviews/{interviewId}/complete`

**Authorization:** `ROLE_RECRUITER`

**Request Body:**
```json
{
  "outcome": "PASS",
  "interviewerNotes": "Excellent technical skills, good communication. Strong fit for the team."
}
```

**Response:** `200 OK`
```json
{
  "id": 17,
  "jobApplyId": 74,
  "status": "COMPLETED",
  "outcome": "PASS",
  "scheduledDate": "2025-11-30T10:00:00",
  "interviewCompletedAt": "2025-11-30T11:15:00",
  "interviewerNotes": "Excellent technical skills...",
  "candidateName": "Mike Analyst",
  "candidateEmail": "mike.analyst@gmail.com",
  "companyName": "TechCorp Inc"
}
```

**Backend Code (InterviewScheduleServiceImpl.java):**
```java
@Override
@Transactional
public InterviewScheduleResponse completeInterview(Integer interviewId, CompleteInterviewRequest request) {
    InterviewSchedule interview = findInterviewById(interviewId);

    // Validation: Cannot complete before expected end time
    LocalDateTime expectedEndTime = interview.getExpectedEndTime();
    if (expectedEndTime != null && LocalDateTime.now().isBefore(expectedEndTime)) {
        throw new AppException(ErrorCode.INTERVIEW_NOT_YET_COMPLETED);
    }

    // Handle NEEDS_SECOND_ROUND differently - reset for rescheduling
    if (request.getOutcome() == InterviewOutcome.NEEDS_SECOND_ROUND) {
        interview.setStatus(InterviewStatus.RESCHEDULED);
        interview.setCandidateConfirmed(false);  // Reset confirmation
        interview.setCandidateConfirmedAt(null);
        interview.setInterviewerNotes(request.getInterviewerNotes());
        interview.setOutcome(request.getOutcome());
        // Don't set interviewCompletedAt since it's not completed
        
        interview = interviewRepo.save(interview);
        
        // Set job application back to REVIEWING for new interview scheduling
        JobApply jobApply = interview.getJobApply();
        jobApply.setStatus(StatusJobApply.REVIEWING);
        jobApplyRepo.save(jobApply);
        
        return interviewMapper.toResponse(interview);
    }

    // Standard completion flow for PASS, FAIL, PENDING
    interview.setStatus(InterviewStatus.COMPLETED);
    interview.setInterviewCompletedAt(LocalDateTime.now());
    interview.setInterviewerNotes(request.getInterviewerNotes());
    interview.setOutcome(request.getOutcome());
    interview = interviewRepo.save(interview);

    // Update job application status based on outcome
    JobApply jobApply = interview.getJobApply();
    StatusJobApply newStatus = determineJobApplyStatusFromOutcome(request.getOutcome());
    jobApply.setStatus(newStatus);
    jobApplyRepo.save(jobApply);

    return interviewMapper.toResponse(interview);
}

private StatusJobApply determineJobApplyStatusFromOutcome(InterviewOutcome outcome) {
    if (outcome == null) {
        return StatusJobApply.INTERVIEWED;
    }
    
    return switch (outcome) {
        case PASS -> StatusJobApply.APPROVED;
        case FAIL -> StatusJobApply.REJECTED;
        case PENDING -> StatusJobApply.INTERVIEWED;
        case NEEDS_SECOND_ROUND -> StatusJobApply.REVIEWING; // Back to reviewing
    };
}
```

---

### 2. Complete Interview Early

Use when interview finishes before the expected end time (must be at least 50% of duration).

**Endpoint:** `POST /api/interviews/{interviewId}/complete-early`

**Request Body:** Same as complete

**Validation:** Interview must have run for at least 50% of scheduled duration.

---

### 3. Mark as No-Show

**Endpoint:** `POST /api/interviews/{interviewId}/no-show?notes=Candidate%20did%20not%20arrive`

**Authorization:** `ROLE_RECRUITER`

**Effect:** 
- Interview status → `NO_SHOW`
- Job application status → `REJECTED`

---

### 4. Get Scheduled Interviews (Including Past)

**Endpoint:** `GET /api/interviews/recruiter/scheduled`

**Authorization:** `ROLE_RECRUITER`

**Use Case:** Interview Management page - shows all interviews that need action (including past ones ready to complete)

**Response:**
```json
{
  "recruiterId": 22,
  "count": 3,
  "interviews": [
    {
      "id": 15,
      "status": "CONFIRMED",
      "scheduledDate": "2025-11-29T14:00:00",  // PAST - ready to complete
      "candidateName": "John Doe",
      "jobTitle": "Software Engineer"
    },
    {
      "id": 17,
      "status": "SCHEDULED",
      "scheduledDate": "2025-12-01T10:00:00",  // FUTURE
      "candidateName": "Jane Smith",
      "jobTitle": "Product Manager"
    }
  ]
}
```

---

## Frontend Implementation

### Interview Completion Modal Component

```tsx
import { useState } from 'react';
import { completeInterview } from '@/api/interview-api';

interface CompleteInterviewModalProps {
  interviewId: number;
  onSuccess: () => void;
  onClose: () => void;
}

type InterviewOutcome = 'PASS' | 'FAIL' | 'PENDING' | 'NEEDS_SECOND_ROUND';

const outcomeOptions = [
  { 
    value: 'PASS' as InterviewOutcome, 
    label: 'Pass - Approve Candidate',
    description: 'Candidate passed. You can mark them as Working when they start.',
    color: 'green',
    icon: '✅'
  },
  { 
    value: 'FAIL' as InterviewOutcome, 
    label: 'Fail - Reject Candidate',
    description: 'Candidate did not meet requirements. Application will be rejected.',
    color: 'red',
    icon: '❌'
  },
  { 
    value: 'PENDING' as InterviewOutcome, 
    label: 'Pending - Still Deciding',
    description: 'Need more time to evaluate. Interview marked as completed.',
    color: 'yellow',
    icon: '⏳'
  },
  { 
    value: 'NEEDS_SECOND_ROUND' as InterviewOutcome, 
    label: 'Needs Another Round',
    description: 'Interview will be marked as RESCHEDULED. Candidate confirmation reset. Schedule a new interview.',
    color: 'blue',
    icon: '🔄'
  }
];

export function CompleteInterviewModal({ 
  interviewId, 
  onSuccess, 
  onClose 
}: CompleteInterviewModalProps) {
  const [outcome, setOutcome] = useState<InterviewOutcome | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!outcome) {
      setError('Please select an outcome');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await completeInterview(interviewId, {
        outcome,
        interviewerNotes: notes
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>Complete Interview</h2>
      
      {/* Outcome Selection */}
      <div className="outcome-options">
        <label>Interview Outcome *</label>
        {outcomeOptions.map((option) => (
          <div
            key={option.value}
            className={`outcome-card ${outcome === option.value ? 'selected' : ''} border-${option.color}`}
            onClick={() => setOutcome(option.value)}
          >
            <span className="icon">{option.icon}</span>
            <div>
              <strong>{option.label}</strong>
              <p className="text-muted">{option.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="form-group">
        <label>Interviewer Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about the interview, candidate performance, key observations..."
          rows={4}
        />
      </div>

      {/* Error */}
      {error && <div className="error-message">{error}</div>}

      {/* Actions */}
      <div className="modal-actions">
        <button onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button 
          onClick={handleSubmit} 
          disabled={loading || !outcome}
          className="primary"
        >
          {loading ? 'Completing...' : 'Complete Interview'}
        </button>
      </div>
    </div>
  );
}
```

---

### Interview Card with Ready-to-Complete Indicator

```tsx
interface InterviewCardProps {
  interview: InterviewScheduleResponse;
  onComplete: (id: number) => void;
}

export function InterviewCard({ interview, onComplete }: InterviewCardProps) {
  const now = new Date();
  const scheduledDate = new Date(interview.scheduledDate);
  const isPast = scheduledDate < now;
  const isReadyToComplete = isPast && 
    (interview.status === 'SCHEDULED' || interview.status === 'CONFIRMED');

  return (
    <div className={`interview-card ${isReadyToComplete ? 'ready-to-complete' : ''}`}>
      {isReadyToComplete && (
        <div className="badge badge-warning">
          ⚠️ Ready to Complete
        </div>
      )}
      
      <div className="interview-info">
        <h3>{interview.candidateName}</h3>
        <p>{interview.jobTitle}</p>
        <p className="date">
          {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString()}
        </p>
        <span className={`status status-${interview.status.toLowerCase()}`}>
          {interview.status}
        </span>
      </div>

      <div className="actions">
        {isReadyToComplete && (
          <button 
            className="btn-primary"
            onClick={() => onComplete(interview.id)}
          >
            Complete Interview
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### API Functions

```typescript
// interview-api.ts
import api from './axios-instance';

export interface CompleteInterviewRequest {
  outcome: 'PASS' | 'FAIL' | 'PENDING' | 'NEEDS_SECOND_ROUND';
  interviewerNotes?: string;
}

export interface InterviewScheduleResponse {
  id: number;
  jobApplyId: number;
  status: string;
  outcome?: string;
  scheduledDate: string;
  durationMinutes: number;
  interviewType: string;
  location?: string;
  meetingLink?: string;
  interviewerName?: string;
  interviewerNotes?: string;
  interviewCompletedAt?: string;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateImage?: string;
  companyId: number;
  companyName: string;
  companyLogo?: string;
  jobTitle: string;
}

/**
 * Get all scheduled/confirmed interviews (including past ones ready to complete)
 */
export async function getRecruiterScheduledInterviews() {
  const response = await api.get<{
    recruiterId: number;
    count: number;
    interviews: InterviewScheduleResponse[];
  }>('/api/interviews/recruiter/scheduled');
  return response.data;
}

/**
 * Get upcoming interviews only (future dates)
 */
export async function getRecruiterUpcomingInterviews() {
  const response = await api.get<{
    recruiterId: number;
    count: number;
    interviews: InterviewScheduleResponse[];
  }>('/api/interviews/recruiter/upcoming');
  return response.data;
}

/**
 * Complete an interview with outcome
 */
export async function completeInterview(
  interviewId: number, 
  request: CompleteInterviewRequest
) {
  const response = await api.post<InterviewScheduleResponse>(
    `/api/interviews/${interviewId}/complete`,
    request
  );
  return response.data;
}

/**
 * Complete interview early (before expected end time)
 */
export async function completeInterviewEarly(
  interviewId: number, 
  request: CompleteInterviewRequest
) {
  const response = await api.post<InterviewScheduleResponse>(
    `/api/interviews/${interviewId}/complete-early`,
    request
  );
  return response.data;
}

/**
 * Mark interview as no-show
 */
export async function markNoShow(interviewId: number, notes?: string) {
  const response = await api.post<InterviewScheduleResponse>(
    `/api/interviews/${interviewId}/no-show`,
    null,
    { params: { notes } }
  );
  return response.data;
}
```

---

### Interview Management Page

```tsx
import { useState, useEffect } from 'react';
import { 
  getRecruiterScheduledInterviews,
  getRecruiterUpcomingInterviews,
  InterviewScheduleResponse 
} from '@/api/interview-api';
import { InterviewCard } from '@/components/InterviewCard';
import { CompleteInterviewModal } from '@/components/CompleteInterviewModal';

export function InterviewManagementPage() {
  const [interviews, setInterviews] = useState<InterviewScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<number | null>(null);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      // Fetch both scheduled and upcoming to get complete list
      const [scheduledRes, upcomingRes] = await Promise.all([
        getRecruiterScheduledInterviews(),
        getRecruiterUpcomingInterviews()
      ]);

      // Combine and deduplicate
      const allInterviews = [...scheduledRes.interviews];
      upcomingRes.interviews.forEach(interview => {
        if (!allInterviews.find(i => i.id === interview.id)) {
          allInterviews.push(interview);
        }
      });

      // Filter out completed/cancelled
      const activeInterviews = allInterviews.filter(
        i => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(i.status)
      );

      // Sort: past (ready to complete) first, then by date
      activeInterviews.sort((a, b) => {
        const now = new Date();
        const aDate = new Date(a.scheduledDate);
        const bDate = new Date(b.scheduledDate);
        const aIsPast = aDate < now;
        const bIsPast = bDate < now;

        // Past interviews first
        if (aIsPast && !bIsPast) return -1;
        if (!aIsPast && bIsPast) return 1;

        // Then sort by date
        return aDate.getTime() - bDate.getTime();
      });

      setInterviews(activeInterviews);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleCompleteSuccess = () => {
    setSelectedInterview(null);
    loadInterviews(); // Refresh list
  };

  if (loading) return <div>Loading interviews...</div>;

  const pastInterviews = interviews.filter(
    i => new Date(i.scheduledDate) < new Date()
  );
  const upcomingInterviews = interviews.filter(
    i => new Date(i.scheduledDate) >= new Date()
  );

  return (
    <div className="interview-management">
      <h1>Interview Management</h1>

      {/* Ready to Complete Section */}
      {pastInterviews.length > 0 && (
        <section className="ready-to-complete-section">
          <h2>⚠️ Ready to Complete ({pastInterviews.length})</h2>
          <p className="hint">
            These interviews have passed their scheduled time and need completion.
          </p>
          <div className="interview-grid">
            {pastInterviews.map(interview => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                onComplete={setSelectedInterview}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Section */}
      <section className="upcoming-section">
        <h2>Upcoming Interviews ({upcomingInterviews.length})</h2>
        <div className="interview-grid">
          {upcomingInterviews.map(interview => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onComplete={setSelectedInterview}
            />
          ))}
        </div>
      </section>

      {/* Complete Modal */}
      {selectedInterview && (
        <CompleteInterviewModal
          interviewId={selectedInterview}
          onSuccess={handleCompleteSuccess}
          onClose={() => setSelectedInterview(null)}
        />
      )}
    </div>
  );
}
```

---

## After Interview: Mark as Working

Once a candidate is `APPROVED` (passed interview), the recruiter can mark them as `WORKING` when they start:

**Endpoint:** `PATCH /api/job-applies/{jobApplyId}/status`

**Request:**
```json
{
  "status": "WORKING",
  "reason": "Candidate started on December 1, 2025"
}
```

**Backend Validation (JobApplyImp.java):**
```java
case APPROVED:
    // Recruiter marks candidate as WORKING when they start the job
    return to == StatusJobApply.WORKING
        || to == StatusJobApply.REJECTED
        || to == StatusJobApply.WITHDRAWN;
```

**Timestamps Auto-Set:**
- `WORKING` → sets `hiredAt = now()`
- `TERMINATED` / `PROBATION_FAILED` → sets `leftAt = now()`

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTERVIEW COMPLETION FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

Interview Time Passes
         │
         ▼
┌─────────────────┐
│ Complete Button │
│    Appears      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SELECT OUTCOME                                   │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│      PASS       │      FAIL       │     PENDING     │  NEEDS_SECOND │
│       ✅        │       ❌        │       ⏳        │     ROUND 🔄   │
└────────┬────────┴────────┬────────┴────────┬────────┴───────┬───────┘
         │                 │                 │                │
         ▼                 ▼                 ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Interview:      │ │ Interview:  │ │ Interview:      │ │ Interview:      │
│   COMPLETED     │ │   COMPLETED │ │   COMPLETED     │ │   RESCHEDULED   │
│                 │ │             │ │                 │ │                 │
│ JobApply:       │ │ JobApply:   │ │ JobApply:       │ │ JobApply:       │
│   APPROVED      │ │   REJECTED  │ │   INTERVIEWED   │ │   REVIEWING     │
│                 │ │             │ │                 │ │                 │
│ Ready to hire   │ │ Flow ends   │ │ Awaiting final  │ │ Confirmation    │
│                 │ │             │ │    decision     │ │ reset to FALSE  │
└────────┬────────┘ └─────────────┘ └────────┬────────┘ └───────┬─────────┘
         │                                   │                  │
         │                                   │                  │
         ▼                                   │                  ▼
┌─────────────────┐                          │        ┌─────────────────────┐
│ Mark as WORKING │◄─────────────────────────┘        │ Recruiter schedules │
│ (When starts)   │                                   │   NEW interview     │
└────────┬────────┘                                   │                     │
         │                                            │ Candidate must      │
         ▼                                            │ confirm again       │
┌─────────────────┐                                   └─────────────────────┘
│  Work Tracking  │
│  - hiredAt set  │
│  - Days counted │
└─────────────────┘
```

---

## Error Codes

| Error Code | Description |
|------------|-------------|
| `INTERVIEW_NOT_FOUND` | Interview ID does not exist |
| `INTERVIEW_NOT_YET_COMPLETED` | Cannot complete before expected end time |
| `INTERVIEW_TOO_SHORT` | Early completion requires at least 50% duration |
| `CANNOT_MARK_NO_SHOW_BEFORE_TIME` | Cannot mark no-show before scheduled time |
| `INTERVIEW_CANNOT_BE_MODIFIED` | Interview already completed/cancelled |

---

## CSS Styles

```css
/* Ready to complete indicator */
.interview-card.ready-to-complete {
  border: 2px solid #f59e0b; /* Orange border */
  background-color: #fffbeb;
}

.badge-warning {
  background-color: #f59e0b;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

/* Outcome cards */
.outcome-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.outcome-card:hover {
  border-color: #3b82f6;
}

.outcome-card.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.outcome-card.border-green.selected {
  border-color: #22c55e;
  background-color: #f0fdf4;
}

.outcome-card.border-red.selected {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.outcome-card.border-yellow.selected {
  border-color: #f59e0b;
  background-color: #fffbeb;
}

.outcome-card.border-blue.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

/* Status badges */
.status-scheduled { background-color: #3b82f6; }
.status-confirmed { background-color: #22c55e; }
.status-completed { background-color: #6b7280; }
.status-cancelled { background-color: #ef4444; }
.status-no_show { background-color: #f59e0b; }
```
