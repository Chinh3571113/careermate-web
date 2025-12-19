# Review Management UI Implementation Summary

## Overview
Implemented complete UI for the company review management system with role-based access control for administrators and recruiters.

## Implementation Date
January 2025

## Features Implemented

### 1. Admin Review Management Page
**Location**: `/admin/reviews/page.tsx`

**Capabilities**:
- **Advanced Search & Filtering**:
  - Company name search
  - Candidate name search
  - Review type filter (Application/Interview/Work)
  - Status filter (Active/Hidden/Flagged/Removed)
  - Date range filtering (for hate bombing detection)
  - Rating range filters (min/max)
  - Text content search
  - Pagination support

- **Bulk Operations**:
  - Multi-select reviews with checkboxes
  - Bulk hide/show/remove actions
  - Reason input for audit trail
  - Select all/deselect all functionality

- **Individual Review Actions**:
  - Single review hide/show/remove
  - Status update with reason
  - View all review details including ratings

- **Statistics Dashboard**:
  - Total reviews count
  - Active reviews count
  - Flagged reviews (moderation queue)
  - Hidden reviews count
  - Last 24 hours activity
  - Last 7 days activity
  - Last 30 days activity
  - Removed reviews count
  - Trend indicators

- **Review Details Display**:
  - Company name
  - Candidate name (respects anonymity)
  - Job title
  - Review type badge
  - Status badge
  - Overall rating with stars
  - Review text
  - Category-specific ratings
  - Creation date
  - Flag count (if any)
  - Removal reason (if applicable)

### 2. Recruiter Review Viewing Page
**Location**: `/recruiter/reviews/page.tsx`

**Capabilities** (Read-Only):
- **View Active Reviews Only**:
  - Only ACTIVE status reviews visible
  - Hidden/Removed reviews not displayed
  - No moderation controls

- **Basic Filtering**:
  - Review type filter (Application/Interview/Work)
  - Minimum rating filter
  - Text content search
  - Pagination support

- **Statistics Dashboard**:
  - Total reviews count
  - Average rating for company
  - Review type breakdown (Application/Interview/Work counts)
  - Last 30 days activity

- **Review Details Display**:
  - Job title
  - Candidate name (respects anonymity)
  - Review type badge
  - Overall rating with stars
  - Review text
  - Category-specific ratings breakdown
  - Creation date

### 3. Navigation Integration

#### Admin Sidebar
**File**: `src/modules/admin/components/admin-sidebar.tsx`

**Changes**:
- Added "Review Management" menu item
- Icon: MessageSquareText
- Route: `/admin/reviews`
- Position: After Job Postings, before Skill Management

#### Recruiter Sidebar
**File**: `src/modules/recruiter/components/RecruiterSidebar.tsx`

**Changes**:
- Added "Company Reviews" menu item
- Icon: MessageSquareText
- Route: `/recruiter/reviews`
- Position: After Schedule, before Services

## Technical Details

### Dependencies
- **UI Components**: shadcn/ui (Card, Button, Input, Select, Dialog, Badge, Checkbox, Label, Textarea)
- **Icons**: lucide-react
- **Notifications**: sonner (toast)
- **API Client**: `@/lib/review-api`

### API Integration
Both pages use the API functions from `review-api.ts`:

**Admin Functions**:
- `adminSearchReviews(filters)` - Dynamic search with 12+ filter criteria
- `adminUpdateReviewStatus(reviewId, newStatus, reason)` - Single review status update
- `adminBulkUpdateReviews(request)` - Bulk status updates
- `adminGetReviewStats()` - Statistics retrieval

**Recruiter Functions**:
- `recruiterGetCompanyReviews(params)` - View ACTIVE reviews only
- `recruiterGetStats()` - Company statistics

### State Management
- **Admin Page**:
  - Reviews list state
  - Statistics state
  - Filter state (12 filter criteria)
  - Selected reviews (for bulk actions)
  - Pagination state
  - Dialog states (single/bulk action)
  - Action reason state

- **Recruiter Page**:
  - Reviews list state
  - Statistics state
  - Filter state (review type, rating, search text)
  - Pagination state

### Security Features
- **Role-based access**: Admin and Recruiter pages are separate
- **Backend validation**: All actions validated by backend @PreAuthorize
- **Audit trail**: All status changes require reason (optional but recommended)
- **Anonymity respected**: Anonymous reviews show "Anonymous" instead of candidate name

## User Experience Features

### Admin Page
1. **Efficient Moderation**:
   - Quick action buttons on each review card
   - Bulk selection for mass actions
   - Date range filtering for bombing detection
   - Statistics dashboard for quick overview

2. **Comprehensive Filtering**:
   - 12+ filter criteria
   - Compound filters (combine multiple criteria)
   - Reset filters button
   - Search on demand

3. **Clear Visual Indicators**:
   - Color-coded status badges
   - Star ratings visualization
   - Flag count alerts
   - Removal reason display

### Recruiter Page
1. **Read-Only Interface**:
   - Clear messaging about read-only access
   - No moderation controls visible
   - Clean, professional layout

2. **Insight Focus**:
   - Statistics prominently displayed
   - Category ratings breakdown
   - Average rating calculation
   - Recent activity tracking

3. **Respect for Moderation**:
   - Message explaining admin moderation
   - Only ACTIVE reviews shown
   - Focus on learning from feedback

## Routes

### Admin
- Main page: `http://localhost:3000/admin/reviews`
- Accessible via: Admin sidebar → Review Management

### Recruiter
- Main page: `http://localhost:3000/recruiter/reviews`
- Accessible via: Recruiter sidebar → Company Reviews

## Testing Checklist

### Admin Page
- [ ] Search by company name
- [ ] Search by candidate name
- [ ] Filter by review type
- [ ] Filter by status
- [ ] Filter by date range (bombing detection)
- [ ] Filter by rating range
- [ ] Search in text content
- [ ] Single review hide
- [ ] Single review show
- [ ] Single review remove
- [ ] Bulk select multiple reviews
- [ ] Bulk hide action
- [ ] Bulk show action
- [ ] Bulk remove action
- [ ] Statistics display correctly
- [ ] Pagination works
- [ ] Reset filters works

### Recruiter Page
- [ ] Only ACTIVE reviews displayed
- [ ] Filter by review type
- [ ] Filter by minimum rating
- [ ] Search in text content
- [ ] Statistics display correctly
- [ ] Pagination works
- [ ] Anonymous reviews show "Anonymous"
- [ ] Category ratings display correctly
- [ ] No moderation controls visible

### Navigation
- [ ] Admin sidebar shows "Review Management"
- [ ] Recruiter sidebar shows "Company Reviews"
- [ ] Navigation links work correctly
- [ ] Active state highlights correctly

## Future Enhancements (Optional)
1. Export reviews to CSV/Excel
2. Review flagging by recruiters (report to admin)
3. Email notifications for admin on new flags
4. Review analytics dashboard (trends, sentiment analysis)
5. Automated hate speech detection
6. Review response system (recruiter replies, admin moderated)

## Notes
- All status changes are logged in the backend
- Bulk actions are atomic (all succeed or all fail)
- Date range filtering is critical for detecting review bombing
- Anonymous reviews are respected throughout the system
- Removed reviews are not deleted, just excluded from calculations and display

## Related Files
- Backend Controllers: `AdminReviewController.java`, `RecruiterReviewController.java`
- Backend Services: `AdminReviewServiceImpl.java`, `RecruiterReviewServiceImpl.java`
- Backend Repository: `CompanyReviewRepo.java` (with JpaSpecificationExecutor)
- API Client: `review-api.ts`
- Admin UI: `src/app/admin/reviews/page.tsx`
- Recruiter UI: `src/app/recruiter/reviews/page.tsx`
- Admin Sidebar: `src/modules/admin/components/admin-sidebar.tsx`
- Recruiter Sidebar: `src/modules/recruiter/components/RecruiterSidebar.tsx`
