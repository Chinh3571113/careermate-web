# Interview Auto-Cancel on Application Withdrawal

## Overview

This document describes the implementation of automatic interview cancellation when job applications are withdrawn, either automatically (when a candidate is hired elsewhere) or manually by the candidate.

## Problem Statement

### Original Issue

When a candidate had multiple job applications with scheduled interviews, and one application was accepted (hired), the system would:

1. ✅ Auto-withdraw all other pending applications (correct behavior)
2. ❌ Leave scheduled interviews for withdrawn applications active (BUG)

This caused several problems:

- **Recruiter confusion**: Recruiters would see interviews scheduled for candidates who were no longer available
- **Wasted time**: Recruiters might prepare for interviews that would never happen
- **Data inconsistency**: Interviews existed for applications with `WITHDRAWN` status
- **Notification gaps**: Candidates might receive interview reminders for jobs they've withdrawn from

## Solution Architecture

### Backend Changes

#### File: `JobApplyImp.java`

##### 1. New Dependencies Added

```java
@Autowired
private InterviewScheduleRepo interviewScheduleRepo;
```

##### 2. Auto-Cancel on Hire (Auto-Withdrawal)

When `handleHireBusinessRules()` is triggered (candidate accepted an offer), the system now:

```java
private void handleHireBusinessRules(JobApply hiredApplication) {
    // ... existing logic to withdraw other applications ...
    
    for (JobApply application : applicationsToWithdraw) {
        application.setJobApplyStatus(JobApplyStatus.WITHDRAWN);
        application.setReasonStatus("Auto-withdrawn: Candidate hired for another position");
        
        // NEW: Cancel any scheduled interview
        cancelInterviewIfExists(application, hiredJobTitle, hiredCompanyName);
        
        jobApplyRepository.save(application);
    }
}
```

##### 3. Cancel on Manual Withdrawal

When a candidate manually withdraws from an application:

```java
// In changeStatusJobApply method
if (newStatus == JobApplyStatus.WITHDRAWN) {
    cancelInterviewOnManualWithdrawal(updatedJobApply);
}
```

##### 4. New Helper Methods

```java
/**
 * Cancel interview if one exists for the given application
 */
private void cancelInterviewIfExists(JobApply application, String hiredJobTitle, String hiredCompanyName) {
    Optional<InterviewSchedule> interviewOpt = interviewScheduleRepo
        .findByJobApply_JobApplyId(application.getJobApplyId());
    
    if (interviewOpt.isPresent()) {
        InterviewSchedule interview = interviewOpt.get();
        interview.setInterviewStatus(InterviewStatus.CANCELLED);
        interview.setNotes("Auto-cancelled: Candidate hired for \"" + hiredJobTitle + 
            "\" at " + hiredCompanyName);
        interviewScheduleRepo.save(interview);
        
        // Notify the recruiter about the cancellation
        sendInterviewCancelledNotification(interview, hiredJobTitle, hiredCompanyName);
    }
}

/**
 * Cancel interview when candidate manually withdraws
 */
private void cancelInterviewOnManualWithdrawal(JobApply application) {
    Optional<InterviewSchedule> interviewOpt = interviewScheduleRepo
        .findByJobApply_JobApplyId(application.getJobApplyId());
    
    if (interviewOpt.isPresent()) {
        InterviewSchedule interview = interviewOpt.get();
        interview.setInterviewStatus(InterviewStatus.CANCELLED);
        interview.setNotes("Cancelled: Candidate withdrew application");
        interviewScheduleRepo.save(interview);
        
        // Notify recruiter
        sendWithdrawalCancellationNotification(interview);
    }
}
```

##### 5. Notification Integration

```java
private void sendInterviewCancelledNotification(
    InterviewSchedule interview, 
    String hiredJobTitle, 
    String hiredCompanyName
) {
    String recruiterEmail = interview.getJobApply().getJob().getRecruiter().getAccount().getEmail();
    String candidateName = interview.getJobApply().getCv().getCandidate().getCandidateName();
    
    // Send notification to recruiter
    notificationService.sendNotification(
        recruiterEmail,
        "Interview Cancelled - Candidate Hired Elsewhere",
        String.format(
            "The interview scheduled with %s has been automatically cancelled. " +
            "The candidate has accepted a position for \"%s\" at %s.",
            candidateName, hiredJobTitle, hiredCompanyName
        )
    );
}
```

### Frontend Changes

#### File: `interview-api.ts`

##### Fixed API Method Signatures

Two API methods were sending parameters in the request body instead of query parameters:

```typescript
// BEFORE (incorrect)
cancelInterview: async (interviewId: number, reason: string) => {
  return http.put(`${baseUrl}/${interviewId}/cancel`, { reason });
}

// AFTER (correct)
cancelInterview: async (interviewId: number, reason: string) => {
  return http.put(`${baseUrl}/${interviewId}/cancel`, null, { params: { reason } });
}

// BEFORE (incorrect)
adjustInterviewDuration: async (interviewId: number, newDurationMinutes: number) => {
  return http.put(`${baseUrl}/${interviewId}/duration`, { newDurationMinutes });
}

// AFTER (correct)
adjustInterviewDuration: async (interviewId: number, newDurationMinutes: number) => {
  return http.put(`${baseUrl}/${interviewId}/duration`, null, { params: { newDurationMinutes } });
}
```

#### File: `schedule/page.tsx`

##### Time Slot Display Enhancement

Changed the time slot selection UI to show ALL time slots with availability status:

**Before**: Available slots shown, occupied slots hidden (confusing)

**After**: All slots shown with visual distinction:

```typescript
interface TimeSlotInfo {
  time: string;
  isAvailable: boolean;
  reason?: string; // e.g., "Scheduled interview (ID: 123)"
}

// Generate all time slots with availability status
function generateAllTimeSlots(
  availableSlots: string[],
  allSlots: string[],
  existingInterviews: InterviewSchedule[]
): TimeSlotInfo[] {
  return allSlots.map(slot => {
    const isAvailable = availableSlots.includes(slot);
    let reason: string | undefined;
    
    if (!isAvailable) {
      const conflictingInterview = existingInterviews.find(
        interview => /* check time overlap */
      );
      if (conflictingInterview) {
        reason = `Scheduled interview (ID: ${conflictingInterview.interviewId})`;
      }
    }
    
    return { time: slot, isAvailable, reason };
  });
}
```

**Visual Styling**:

| Status | Background | Text Color | Cursor | Border |
|--------|------------|------------|--------|--------|
| Available | `bg-white` | Default | `cursor-pointer` | Default |
| Occupied | `bg-gray-100` | `text-gray-400` | `cursor-not-allowed` | `border-gray-200` |

**Tooltip**: Occupied slots show reason on hover

## Business Rules Summary

### Interview Status Transitions

```
SCHEDULED
    ├── → COMPLETED (interview finished)
    ├── → CANCELLED (manual or auto-cancel)
    │       ├── Auto: Candidate hired elsewhere
    │       ├── Auto: Candidate withdrew application
    │       └── Manual: Recruiter cancelled
    └── → RESCHEDULED (time changed)
```

### Application-Interview Relationship

| Application Status Change | Interview Action |
|---------------------------|------------------|
| `APPROVED` → `ACCEPTED` | No change (this interview is for the hired position) |
| `APPLIED/APPROVED` → `WITHDRAWN` (auto) | Cancel with note "Auto-cancelled: Candidate hired elsewhere" |
| `APPLIED/APPROVED` → `WITHDRAWN` (manual) | Cancel with note "Cancelled: Candidate withdrew application" |
| `APPROVED` → `REJECTED` | No automatic cancellation (recruiter decision) |

### Time Conflict Prevention

The system prevents double-booking through:

1. **On Schedule**: Check `InterviewScheduleRepo.hasTimeConflict()` before creating
2. **On Display**: Show occupied slots as grayed out with reason tooltip
3. **Validation**: Backend validates no overlap before saving

## API Endpoints

### Interview Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/interviews/{id}/cancel?reason={reason}` | Cancel interview |
| `PUT` | `/api/interviews/{id}/duration?newDurationMinutes={minutes}` | Adjust duration |
| `PUT` | `/api/interviews/{id}/complete` | Mark as completed |
| `GET` | `/api/interviews/recruiter/{id}/available-slots?date={date}&duration={min}` | Get available slots |

### Job Application

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/job-applies/{id}/status` | Change status (triggers auto-cancel) |

## Testing Scenarios

### Scenario 1: Auto-Cancel on Hire

1. Candidate applies to Job A and Job B
2. Interview scheduled for Job B
3. Job A recruiter marks candidate as `ACCEPTED`
4. **Expected**:
   - Job B application → `WITHDRAWN`
   - Job B interview → `CANCELLED` with note
   - Job B recruiter receives notification

### Scenario 2: Manual Withdrawal

1. Candidate has interview scheduled for Job A
2. Candidate withdraws application from Job A
3. **Expected**:
   - Job A interview → `CANCELLED`
   - Recruiter receives notification

### Scenario 3: Time Slot Display

1. Recruiter opens schedule form for Candidate X
2. Candidate X has interview at 10:00 AM on selected date
3. **Expected**:
   - 10:00 AM slot shown as grayed out
   - Tooltip shows "Scheduled interview (ID: xxx)"
   - Slot is not clickable

## Migration Notes

### Database Consistency Check

Run this query to find orphaned interviews (scheduled interviews for withdrawn applications):

```sql
SELECT i.interview_id, i.interview_status, ja.job_apply_status, ja.reason_status
FROM interview_schedule i
JOIN job_apply ja ON i.job_apply_id = ja.job_apply_id
WHERE ja.job_apply_status = 'WITHDRAWN'
AND i.interview_status = 'SCHEDULED';
```

### Cleanup Script

To fix existing orphaned interviews:

```sql
UPDATE interview_schedule
SET interview_status = 'CANCELLED',
    notes = 'Cleanup: Cancelled due to withdrawn application'
WHERE job_apply_id IN (
    SELECT job_apply_id FROM job_apply WHERE job_apply_status = 'WITHDRAWN'
)
AND interview_status = 'SCHEDULED';
```

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2024-XX-XX | 1.0.0 | Initial implementation of auto-cancel feature |

## Related Documentation

- [Job Application Flow](JOB_APPLICATION_API.md)
- [Interview Scheduling](./INTERVIEW_API_DOCS.md)
- [Notification System](./NOTIFICATION_SYSTEM.md)

---

*Last Updated: Auto-generated*
