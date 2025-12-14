# Application Status & Interview Flow Testing Guide

This guide provides step-by-step instructions for testing the complete job application lifecycle, from submission to employment verification.

## Quick Navigation

- [Flow Overview](#flow-overview)
- [Test 1: Job Application Submission](#test-1-job-application-submission)
- [Test 2: Recruiter Review Process](#test-2-recruiter-review-process)
- [Test 3: Interview Scheduling](#test-3-interview-scheduling)
- [Test 4: Candidate Interview Actions](#test-4-candidate-interview-actions)
- [Test 5: Interview Completion](#test-5-interview-completion)
- [Test 6: Offer Acceptance Flow](#test-6-offer-acceptance-flow)
- [Test 7: Employment Tracking](#test-7-employment-tracking)
- [Test 8: Edge Cases](#test-8-edge-cases)

---

## Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LIFECYCLE FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CANDIDATE                           RECRUITER                               │
│  ─────────                           ─────────                               │
│                                                                              │
│  1. Submit Application ──────────────→ SUBMITTED                             │
│                                           │                                  │
│                                           ▼                                  │
│                                      REVIEWING ←─── 2. Click "Review"        │
│                                           │                                  │
│                                     ┌─────┴─────┐                            │
│                                     ▼           ▼                            │
│                              Schedule      Approve/Reject                    │
│                              Interview                                       │
│                                     │           │                            │
│                                     ▼           ▼                            │
│  3. Confirm Interview ──→ INTERVIEW_SCHEDULED  APPROVED                      │
│     Request Reschedule              │           │                            │
│                                     │           │                            │
│                                     ▼           │                            │
│                               INTERVIEWED       │                            │
│                                     │           │                            │
│                              ┌──────┴──────┐    │                            │
│                              ▼             ▼    ▼                            │
│                           APPROVED    REJECTED  │                            │
│                              │                  │                            │
│  4. Accept/Decline ─────────→│                  │                            │
│                              │                  │                            │
│                              ▼                  │                            │
│                           ACCEPTED ←────────────┘                            │
│                              │                                               │
│                              │←─── 5. "Start Employment"                     │
│                              ▼                                               │
│                           WORKING                                            │
│                              │                                               │
│  6. Verify 30/90 days ──────→│                                               │
│                              │                                               │
│                              ▼                                               │
│                     TERMINATED/PROBATION_FAILED                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Status Reference Table

| Status | Description | Candidate Actions | Recruiter Actions |
|--------|-------------|-------------------|-------------------|
| `SUBMITTED` | Initial application | Withdraw | Review, Reject, Ban |
| `REVIEWING` | Under review | Withdraw | Schedule Interview, Approve, Reject |
| `NO_RESPONSE` | No response after 7 days | Contact, Withdraw | Review, Reject |
| `INTERVIEW_SCHEDULED` | Interview scheduled | Confirm, Reschedule, Withdraw | View, Reschedule, Cancel |
| `INTERVIEWED` | Interview completed | View Details | Approve, Reject, Schedule 2nd |
| `APPROVED` | Approved for hiring | Accept, Decline | Create Employment, Reject |
| `ACCEPTED` | Offer accepted | View Employment | Start Employment |
| `WORKING` | Currently employed | Submit Review | Terminate, Mark Probation Failed |
| `REJECTED` | Application rejected | - | - |
| `WITHDRAWN` | Candidate withdrew | - | - |
| `BANNED` | Banned from company | Appeal | Unban |
| `TERMINATED` | Employment ended | Submit Review | View History |
| `PROBATION_FAILED` | Failed probation | Submit Review | View History |

---

## Test 1: Job Application Submission

### Prerequisites
- Logged in as **Candidate**
- Have a valid CV file ready

### Steps

1. **Navigate to Job Listing**
   ```
   URL: /jobs-list
   ```

2. **Select a Job**
   - Click on any job card
   - Verify job details load correctly

3. **Click "Apply Now"**
   ```
   URL: /jobs-detail?id={jobId}
   ```

4. **Fill Application Form**
   - **Full Name**: Your name
   - **Phone Number**: Valid phone
   - **Preferred Location**: Select location
   - **Cover Letter**: (Optional) Add text
   - **CV**: Upload or select existing CV

5. **Submit Application**
   - Click "Submit Application"
   - Expect: Success toast message

6. **Verify Application**
   ```
   URL: /candidate/my-jobs
   ```
   - Check "Applied Jobs" tab
   - Verify new application appears with status "SUBMITTED"
   - Status badge should show "Awaiting review"

### Expected Results
- ✅ Application appears in My Jobs list
- ✅ Status shows "SUBMITTED"
- ✅ Application details expandable
- ✅ Can see cover letter and CV link

---

## Test 2: Recruiter Review Process

### Prerequisites
- Logged in as **Recruiter**
- Have at least one pending application

### Steps

1. **Navigate to Applications**
   ```
   URL: /recruiter/recruiter-feature/candidates/applications
   ```

2. **Find SUBMITTED Application**
   - Use status filter or scroll to find application with "SUBMITTED" status

3. **Test "Review" Action**
   - Click application row to expand actions
   - Click "Review" button
   - Expect: Status changes to "REVIEWING"

4. **Test "Approve" Action**
   - Find application with "REVIEWING" status
   - Click "Approve" button
   - Confirm in dialog
   - Expect: Status changes to "APPROVED"

5. **Test "Reject" Action** (on different application)
   - Find application with "REVIEWING" status  
   - Click "Reject" button
   - Enter rejection reason
   - Confirm
   - Expect: Status changes to "REJECTED"

### Expected Results
- ✅ Status transitions correctly
- ✅ Candidate receives notification (if SSE working)
- ✅ Application list updates in real-time

---

## Test 3: Interview Scheduling

### Prerequisites
- Logged in as **Recruiter**
- Application in "REVIEWING" status

### Steps

1. **Navigate to Applications Page**
   ```
   URL: /recruiter/recruiter-feature/candidates/applications
   ```

2. **Click "Schedule Interview"**
   - Find application with "REVIEWING" status
   - Click "Schedule Interview" button
   - Should redirect to schedule page

3. **Fill Interview Details**
   ```
   URL: /recruiter/interviews/schedule?applicationId={id}
   ```
   - **Date**: Select future date
   - **Time**: Select available time slot
   - **Duration**: 30, 45, or 60 minutes
   - **Interview Type**: Select from:
     - In Person
     - Video Call
     - Phone
     - Online Assessment
   - **Location/Meeting Link**: Based on type
   - **Interviewer Info**: (Optional)
   - **Preparation Notes**: (Optional)

4. **Submit Schedule**
   - Click "Schedule Interview"
   - Expect: Success message
   - Expect: Redirects back to applications

5. **Verify Status Change**
   - Application status should be "INTERVIEW_SCHEDULED"

### Expected Results
- ✅ Interview scheduled successfully
- ✅ Application status updated
- ✅ Interview appears in Recruiter Calendar
- ✅ Candidate receives notification

---

## Test 4: Candidate Interview Actions

### Prerequisites
- Logged in as **Candidate**
- Have application with "INTERVIEW_SCHEDULED" status

### Steps

#### Test 4a: View Interview Details

1. **Navigate to My Jobs**
   ```
   URL: /candidate/my-jobs
   ```

2. **Find Interview Scheduled Application**
   - Status should show "Interview scheduled"
   - "Action Required" badge should appear

3. **Click "Confirm Interview"**
   - Redirects to interviews page with dialog
   ```
   URL: /candidate/interviews?action=confirm&id={applicationId}
   ```

4. **Or Navigate Directly**
   ```
   URL: /candidate/interviews
   ```

#### Test 4b: Confirm Interview

1. **On Interviews Page**
   - Find interview with "Awaiting Confirmation" status
   - Click "Confirm Attendance"

2. **Confirm in Dialog**
   - Review date/time
   - Click "Confirm Attendance"
   - Expect: Status changes to "CONFIRMED"

#### Test 4c: Request Reschedule

1. **Click "Request Reschedule"**
2. **Fill Form**
   - Select new date/time
   - Enter reason (required)
3. **Submit Request**
   - Expect: Success message
   - Expect: Request appears under interview

#### Test 4d: View Interview Details

1. **Navigate to Interview Detail**
   ```
   URL: /candidate/interviews/{interviewId}
   ```
2. **Verify Information**
   - Date & Time
   - Duration
   - Interview Type
   - Location/Meeting Link
   - Interviewer info (if provided)
   - Preparation notes (if provided)

### Expected Results
- ✅ Interview confirmation works
- ✅ Reschedule request submitted
- ✅ Interview details page shows all info
- ✅ Meeting link clickable (if video call)

---

## Test 5: Interview Completion

### Prerequisites
- Logged in as **Recruiter**
- Interview completed (past date/time)

### Steps

1. **Navigate to Interviews**
   ```
   URL: /recruiter/interviews
   ```

2. **Find Confirmed Interview**
   - Look for interview that's ready to complete

3. **Click "Mark Complete"**
   - Opens completion dialog

4. **Fill Completion Form**
   - **Result**: Select one:
     - Pass
     - Fail
     - Pending Review
     - Needs Second Round
   - **Feedback**: Enter interviewer feedback

5. **Submit**
   - Expect: Status changes to "COMPLETED"
   - Expect: Application status changes to "INTERVIEWED"

6. **Make Decision on Application**
   - Navigate to Applications
   - Find application with "INTERVIEWED" status
   - Click "Approve" or "Reject"

### Expected Results
- ✅ Interview marked complete
- ✅ Feedback saved
- ✅ Result recorded
- ✅ Application status updated

---

## Test 6: Offer Acceptance Flow

### Prerequisites
- Application in "APPROVED" status

### Steps (Candidate Side)

1. **Login as Candidate**
2. **Navigate to My Jobs**
   ```
   URL: /candidate/my-jobs
   ```

3. **Find Approved Application**
   - Status shows "APPROVED"
   - Actions: "Accept Offer", "Decline Offer"

4. **Click "Accept Offer"**
   - Confirm dialog appears
   - Click confirm
   - Expect: Status changes to "ACCEPTED"
   - Expect: Toast "Job offer accepted! The company will contact you for next steps."

### Steps (Recruiter Side)

5. **Login as Recruiter**
6. **Navigate to Applications**
   ```
   URL: /recruiter/recruiter-feature/candidates/applications
   ```

7. **Find ACCEPTED Application**
   - Status shows "ACCEPTED"
   - Action: "Start Employment"

8. **Click "Start Employment"**
   - Confirm dialog appears
   - Click confirm
   - Expect: Status changes to "WORKING"
   - Expect: Toast "Employment started successfully!"

### Expected Results
- ✅ Candidate can accept/decline offer
- ✅ ACCEPTED is distinct status (not auto-WORKING)
- ✅ Recruiter can start employment
- ✅ Status transitions to WORKING

---

## Test 7: Employment Tracking

### Prerequisites (Candidate)
- Application in "WORKING" status
- Time has passed (30+ days simulated)

### Steps (Candidate Side)

1. **Navigate to Employments**
   ```
   URL: /candidate/employments
   ```

2. **View Employment Card**
   - Company name
   - Position
   - Start date
   - Duration (days employed)
   - Verification checkpoints

3. **30-Day Verification** (when applicable)
   - Banner appears: "30-Day Verification Required"
   - Click "Verify Now"
   - Select "Yes, I'm still employed" or "No, I have left"
   - Submit

4. **90-Day Verification** (when applicable)
   - Similar to 30-day process

5. **Submit Review** (when eligible)
   - After 90+ days
   - Click "Write Review"
   - Submit company review

### Steps (Recruiter Side)

6. **Navigate to Employments**
   ```
   URL: /recruiter/employments
   ```

7. **View Active Employees**
   - See all WORKING applications
   - Status badges (Active, Probation)

8. **Terminate Employment** (if needed)
   - Click "Terminate Employment"
   - Select termination type
   - Enter date and reason
   - Confirm

### Expected Results
- ✅ Employment details visible
- ✅ Verification checkpoints work
- ✅ Review eligibility shown
- ✅ Recruiter can terminate

---

## Test 8: Edge Cases

### 8a: Withdraw Application

1. **As Candidate**, find active application (SUBMITTED/REVIEWING/INTERVIEW_SCHEDULED)
2. Click "Withdraw Application"
3. Confirm
4. Verify status changes to "WITHDRAWN"

### 8b: Reschedule Response (Recruiter)

1. **As Recruiter**, navigate to Interviews
2. Find interview with pending reschedule request
3. Click "Respond to Reschedule"
4. Approve or reject with message

### 8c: Cancel Interview (Recruiter)

1. Navigate to Interviews
2. Find scheduled interview
3. Click "Cancel"
4. Verify application status updates appropriately

### 8d: Ban/Unban Candidate

1. **As Recruiter**, find application
2. Click "Ban" → Enter reason → Confirm
3. Status changes to "BANNED"
4. Click "Unban" → Confirm
5. Status changes to "REJECTED"

### 8e: Notification Flow

1. **As Candidate**, open notification bell
2. Verify unread count shows on load
3. Perform action that triggers notification
4. Verify count updates via SSE
5. Click notification to navigate to relevant page

---

## Page-to-Page Navigation Reference

### Candidate Navigation

| From Page | Action | To Page |
|-----------|--------|---------|
| `/candidate/my-jobs` | Click "Confirm Interview" | `/candidate/interviews?action=confirm&id={id}` |
| `/candidate/my-jobs` | Click "Request Reschedule" | `/candidate/interviews?action=reschedule&id={id}` |
| `/candidate/my-jobs` | Click "View Interview" | `/candidate/interviews` |
| `/candidate/my-jobs` | Click "View Employment" | `/candidate/employments` |
| `/candidate/my-jobs` | Click "Submit Review" | `/candidate/reviews/submit?jobApplyId={id}` |
| `/candidate/interviews` | Click interview card | `/candidate/interviews/{interviewId}` |

### Recruiter Navigation

| From Page | Action | To Page |
|-----------|--------|---------|
| `/recruiter/recruiter-feature/candidates/applications` | Click "Schedule Interview" | `/recruiter/interviews/schedule?applicationId={id}` |
| `/recruiter/recruiter-feature/candidates/applications` | Click "Reschedule" | `/recruiter/interviews/schedule?applicationId={id}&action=reschedule` |
| `/recruiter/recruiter-feature/candidates/applications` | Click "View Interview" | `/recruiter/interviews` |
| `/recruiter/recruiter-feature/candidates/applications` | Click "View Employment" | `/recruiter/employments` |
| `/recruiter/interviews` | Click "Complete Interview" | Dialog on same page |
| `/recruiter/calendar` | Click day | Daily view with interviews |

---

## Troubleshooting

### Application Not Appearing
- Check candidate ID is correct
- Verify API response in Network tab
- Check for console errors

### Interview Not Scheduling
- Verify date is in the future
- Check recruiter ID in JWT
- Ensure application is in correct status

### Status Not Updating
- Check API response for errors
- Verify token is valid
- Clear cache and retry

### Notifications Not Working
- Check SSE connection in Network tab
- Verify `/api/notifications/stream` is connected
- Check unread count API response

---

## API Endpoints Reference

### Job Applications
- `POST /api/job-apply` - Submit application
- `PUT /api/job-apply/{id}?status={status}` - Update status
- `GET /api/job-apply/my-applications` - Get candidate's applications
- `GET /api/recruiters/applications` - Get recruiter's applications

### Interviews
- `POST /api/job-applies/{id}/schedule-interview` - Schedule interview
- `PUT /api/interviews/{id}` - Update interview
- `POST /api/interviews/{id}/confirm` - Candidate confirm
- `POST /api/interviews/{id}/complete` - Mark complete
- `POST /api/interviews/{id}/reschedule-request` - Request reschedule
- `PUT /api/interviews/reschedule-requests/{id}/respond` - Respond to reschedule

### Employment
- `GET /api/employment/recruiter/active` - Get active employments
- `PUT /api/employment/{id}/terminate` - Terminate employment
- `PUT /api/employment/{id}/verify-30-days` - 30-day verification
- `PUT /api/employment/{id}/verify-90-days` - 90-day verification

---

## Success Criteria Checklist

- [ ] Application submission works end-to-end
- [ ] All 13 status transitions work correctly
- [ ] Interview scheduling and confirmation flow complete
- [ ] Reschedule request and response working
- [ ] Offer acceptance flow (APPROVED → ACCEPTED → WORKING)
- [ ] Employment verification checkpoints function
- [ ] Notifications appear and navigate correctly
- [ ] All pages load without errors
- [ ] Status badges display correctly
- [ ] Actions are role-appropriate (candidate vs recruiter)
