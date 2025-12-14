# Frontend Integration Guide - Comment Auto-Flagging Moderation

## 📋 Overview

This guide provides everything the frontend team needs to integrate the new auto-flagging comment moderation system with the existing blog comment functionality.

---

## 🎯 What Changed?

### For Regular Users
- ✅ **No changes required** - Comment creation/editing UI remains the same
- ✅ Auto-flagging happens transparently on the backend
- ✅ Users won't see any difference in their experience

### For Admin Users
- 🆕 **New moderation dashboard** - Priority queue for flagged comments
- 🆕 **Approve/Reject workflow** - Quick actions for moderation
- 🆕 **Moderation statistics** - Track automation effectiveness
- ✅ **Existing admin panel still works** - General comment management unchanged

---

## 🔌 API Changes Summary

### ✅ Existing APIs (No Changes)

#### User APIs - **NO CHANGES NEEDED**
```typescript
// These APIs work exactly as before
POST   /api/blogs/{blogId}/comments          // Create comment
PUT    /api/blogs/{blogId}/comments/{id}     // Update comment
DELETE /api/blogs/{blogId}/comments/{id}     // Delete comment
GET    /api/blogs/{blogId}/comments          // Get comments
```

#### Admin APIs - **NO CHANGES NEEDED**
```typescript
// Existing admin panel continues to work
GET    /api/admin/comments                    // Browse all comments
GET    /api/admin/comments/{id}               // View comment details
POST   /api/admin/comments/{id}/hide          // Hide comment
POST   /api/admin/comments/{id}/show          // Show comment
DELETE /api/admin/comments/{id}               // Delete comment
GET    /api/admin/comments/statistics         // General stats
```

### 🆕 New Moderation APIs (Add These)

```typescript
// New moderation endpoints
GET    /api/admin/comment-moderation/flagged          // Flagged queue
GET    /api/admin/comment-moderation/flagged/all     // All flagged
POST   /api/admin/comment-moderation/{id}/approve    // Approve comment
POST   /api/admin/comment-moderation/{id}/reject     // Reject comment
POST   /api/admin/comment-moderation/{id}/unflag     // Unflag (false positive)
GET    /api/admin/comment-moderation/moderation-statistics  // Moderation stats
```

---

## 📊 Response Format Changes

### BlogCommentResponse (Enhanced)

The comment response now includes **4 new optional fields** for moderation:

```typescript
interface BlogCommentResponse {
  // Existing fields (unchanged)
  id: number;
  content: string;
  userId: number;
  userFullName: string;
  userAvatar?: string;
  blogId: number;
  createdAt: string;
  updatedAt: string;
  isHidden: boolean;
  
  // NEW: Auto-flagging fields (only visible to admins)
  isFlagged?: boolean;           // ⚠️ Was auto-flagged by system
  flagReason?: string;           // 📝 Why it was flagged
  flaggedAt?: string;            // 🕐 When it was flagged (ISO 8601)
  reviewedByAdmin?: boolean;     // ✅ Has admin reviewed it?
}
```

### Example Response (Normal Comment)
```json
{
  "code": 1000,
  "message": "Comment created successfully",
  "result": {
    "id": 123,
    "content": "Great article! Very helpful.",
    "userId": 456,
    "userFullName": "John Doe",
    "userAvatar": "https://example.com/avatar.jpg",
    "blogId": 789,
    "createdAt": "2025-11-23T10:30:00Z",
    "updatedAt": "2025-11-23T10:30:00Z",
    "isHidden": false,
    "isFlagged": false,
    "reviewedByAdmin": false
  }
}
```

### Example Response (Flagged Comment)
```json
{
  "code": 1000,
  "message": "Comment created successfully",
  "result": {
    "id": 124,
    "content": "This is terrible sh*t!",
    "userId": 457,
    "userFullName": "Jane Smith",
    "blogId": 789,
    "createdAt": "2025-11-23T10:35:00Z",
    "updatedAt": "2025-11-23T10:35:00Z",
    "isHidden": false,
    "isFlagged": true,
    "flagReason": "Profanity detected: shit (severity: HIGH)",
    "flaggedAt": "2025-11-23T10:35:00Z",
    "reviewedByAdmin": false
  }
}
```

---

## 🎨 UI Implementation Guide

### 1. User Comment Interface (No Changes Required)

The existing comment form works as-is. Auto-flagging happens transparently.

```typescript
// Existing code - NO CHANGES NEEDED
async function submitComment(blogId: number, content: string) {
  const response = await fetch(`/api/blogs/${blogId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });
  
  const data = await response.json();
  
  // Comment is created normally
  // If flagged, it's still visible to user but queued for admin review
  return data.result;
}
```

**Important**: 
- ❌ **Don't show flagged status to regular users**
- ✅ Flagged comments remain visible until admin hides them
- ✅ Only admins see `isFlagged` status

---

### 2. Admin General Comment Panel (Optional Enhancement)

Your existing admin comment list can optionally show flag indicators:

```typescript
// components/admin/CommentList.tsx
interface CommentListItemProps {
  comment: BlogCommentResponse;
}

function CommentListItem({ comment }: CommentListItemProps) {
  return (
    <div className="comment-item">
      {/* Existing UI */}
      <div className="comment-content">{comment.content}</div>
      <div className="comment-meta">
        {comment.userFullName} • {formatDate(comment.createdAt)}
      </div>
      
      {/* NEW: Optional flag indicator */}
      {comment.isFlagged && (
        <span className="flag-indicator">
          ⚠️ Flagged for review
        </span>
      )}
      
      {/* Existing actions */}
      <div className="actions">
        <button onClick={() => hideComment(comment.id)}>Hide</button>
        <button onClick={() => deleteComment(comment.id)}>Delete</button>
      </div>
    </div>
  );
}
```

---

### 3. New Moderation Dashboard (Recommended Implementation)

Create a **new admin page** for reviewing flagged comments:

#### Page Structure

```typescript
// pages/admin/ModerationDashboard.tsx
import { useState, useEffect } from 'react';

interface ModerationStats {
  totalFlaggedComments: number;
  pendingReviewComments: number;
  reviewedComments: number;
  automationRules: {
    totalProfanityWords: number;
    totalControversialKeywords: number;
    totalSuspiciousPatterns: number;
  };
}

interface FlaggedComment extends BlogCommentResponse {
  isFlagged: true;
  flagReason: string;
  flaggedAt: string;
  reviewedByAdmin: boolean;
}

export default function ModerationDashboard() {
  const [flaggedComments, setFlaggedComments] = useState<FlaggedComment[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  
  // Load flagged comments
  useEffect(() => {
    loadFlaggedComments();
    loadStats();
  }, [page]);
  
  async function loadFlaggedComments() {
    setLoading(true);
    const response = await fetch(
      `/api/admin/comment-moderation/flagged?page=${page}&size=20`,
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );
    const data = await response.json();
    setFlaggedComments(data.result.content);
    setLoading(false);
  }
  
  async function loadStats() {
    const response = await fetch(
      '/api/admin/comment-moderation/moderation-statistics',
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );
    const data = await response.json();
    setStats(data.result);
  }
  
  async function approveComment(commentId: number) {
    await fetch(`/api/admin/comment-moderation/${commentId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    // Refresh list
    loadFlaggedComments();
    loadStats();
  }
  
  async function rejectComment(commentId: number) {
    await fetch(`/api/admin/comment-moderation/${commentId}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    // Refresh list
    loadFlaggedComments();
    loadStats();
  }
  
  async function unflagComment(commentId: number) {
    await fetch(`/api/admin/comment-moderation/${commentId}/unflag`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    // Refresh list
    loadFlaggedComments();
    loadStats();
  }
  
  return (
    <div className="moderation-dashboard">
      <h1>Content Moderation</h1>
      
      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <StatsCard
            title="Pending Review"
            value={stats.pendingReviewComments}
            icon="⏳"
            variant="warning"
          />
          <StatsCard
            title="Total Flagged"
            value={stats.totalFlaggedComments}
            icon="⚠️"
            variant="info"
          />
          <StatsCard
            title="Reviewed"
            value={stats.reviewedComments}
            icon="✅"
            variant="success"
          />
        </div>
      )}
      
      {/* Flagged Comments Queue */}
      <div className="flagged-queue">
        <h2>Flagged Comments Queue</h2>
        {loading ? (
          <LoadingSpinner />
        ) : flaggedComments.length === 0 ? (
          <EmptyState message="No flagged comments pending review! 🎉" />
        ) : (
          <div className="comment-list">
            {flaggedComments.map(comment => (
              <FlaggedCommentCard
                key={comment.id}
                comment={comment}
                onApprove={approveComment}
                onReject={rejectComment}
                onUnflag={unflagComment}
              />
            ))}
          </div>
        )}
        
        {/* Pagination */}
        <Pagination
          currentPage={page}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
```

#### Flagged Comment Card Component

```typescript
// components/admin/FlaggedCommentCard.tsx
interface FlaggedCommentCardProps {
  comment: FlaggedComment;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onUnflag: (id: number) => Promise<void>;
}

function FlaggedCommentCard({
  comment,
  onApprove,
  onReject,
  onUnflag
}: FlaggedCommentCardProps) {
  const [loading, setLoading] = useState(false);
  
  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Parse severity from flag reason
  const severity = comment.flagReason.includes('HIGH') ? 'high' :
                   comment.flagReason.includes('MEDIUM') ? 'medium' : 'low';
  
  return (
    <div className={`flagged-comment-card severity-${severity}`}>
      {/* Severity Badge */}
      <div className="severity-badge">
        {severity === 'high' && '🔴 HIGH'}
        {severity === 'medium' && '🟡 MEDIUM'}
        {severity === 'low' && '🟢 LOW'}
      </div>
      
      {/* Comment Content */}
      <div className="comment-content">
        <div className="content-text">{comment.content}</div>
        <div className="comment-meta">
          <span className="author">{comment.userFullName}</span>
          <span className="date">{formatDate(comment.createdAt)}</span>
        </div>
      </div>
      
      {/* Flag Information */}
      <div className="flag-info">
        <span className="flag-icon">⚠️</span>
        <div className="flag-details">
          <strong>Flag Reason:</strong>
          <p>{comment.flagReason}</p>
          <small>Flagged: {formatDate(comment.flaggedAt)}</small>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="btn-approve"
          onClick={() => handleAction(() => onApprove(comment.id))}
          disabled={loading}
        >
          ✅ Approve
          <span className="help-text">Unflag & show comment</span>
        </button>
        
        <button
          className="btn-reject"
          onClick={() => handleAction(() => onReject(comment.id))}
          disabled={loading}
        >
          ❌ Reject
          <span className="help-text">Hide comment</span>
        </button>
        
        <button
          className="btn-unflag"
          onClick={() => handleAction(() => onUnflag(comment.id))}
          disabled={loading}
        >
          🔓 Unflag
          <span className="help-text">False positive</span>
        </button>
      </div>
      
      {/* Link to blog */}
      <a
        href={`/admin/blogs/${comment.blogId}`}
        className="view-blog-link"
        target="_blank"
      >
        View in blog context →
      </a>
    </div>
  );
}
```

---

## 🎨 Styling Recommendations

### CSS for Moderation Dashboard

```css
/* moderation-dashboard.css */

.moderation-dashboard {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.flagged-comment-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-left: 4px solid #ccc;
}

.flagged-comment-card.severity-high {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.flagged-comment-card.severity-medium {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.flagged-comment-card.severity-low {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.severity-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
}

.comment-content {
  margin: 16px 0;
}

.content-text {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.flag-info {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(0,0,0,0.05);
  border-radius: 6px;
  margin: 16px 0;
}

.flag-icon {
  font-size: 24px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.action-buttons button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-approve:hover {
  background: #059669;
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.btn-reject:hover {
  background: #dc2626;
}

.btn-unflag {
  background: #6b7280;
  color: white;
}

.btn-unflag:hover {
  background: #4b5563;
}

.help-text {
  display: block;
  font-size: 11px;
  font-weight: 400;
  opacity: 0.8;
  margin-top: 4px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## 🔧 API Service Implementation

### TypeScript Service Layer

```typescript
// services/moderationService.ts
import axios from 'axios';

const API_BASE = '/api/admin/comment-moderation';

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export class ModerationService {
  private token: string;
  
  constructor(token: string) {
    this.token = token;
  }
  
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Get flagged comments pending review (priority queue)
   */
  async getFlaggedCommentsPendingReview(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'flaggedAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Promise<PaginatedResponse<FlaggedComment>> {
    const response = await axios.get(`${API_BASE}/flagged`, {
      params: { page, size, sortBy, sortDirection },
      headers: this.getHeaders()
    });
    return response.data.result;
  }
  
  /**
   * Get all flagged comments (including reviewed)
   */
  async getAllFlaggedComments(
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<FlaggedComment>> {
    const response = await axios.get(`${API_BASE}/flagged/all`, {
      params: { page, size },
      headers: this.getHeaders()
    });
    return response.data.result;
  }
  
  /**
   * Approve flagged comment (unflag + show)
   */
  async approveComment(commentId: number): Promise<BlogCommentResponse> {
    const response = await axios.post(
      `${API_BASE}/${commentId}/approve`,
      {},
      { headers: this.getHeaders() }
    );
    return response.data.result;
  }
  
  /**
   * Reject flagged comment (hide)
   */
  async rejectComment(commentId: number): Promise<BlogCommentResponse> {
    const response = await axios.post(
      `${API_BASE}/${commentId}/reject`,
      {},
      { headers: this.getHeaders() }
    );
    return response.data.result;
  }
  
  /**
   * Unflag comment (false positive)
   */
  async unflagComment(commentId: number): Promise<BlogCommentResponse> {
    const response = await axios.post(
      `${API_BASE}/${commentId}/unflag`,
      {},
      { headers: this.getHeaders() }
    );
    return response.data.result;
  }
  
  /**
   * Get moderation statistics
   */
  async getModerationStatistics(): Promise<ModerationStats> {
    const response = await axios.get(`${API_BASE}/moderation-statistics`, {
      headers: this.getHeaders()
    });
    return response.data.result;
  }
}

// Export singleton instance
export const moderationService = new ModerationService(getAdminToken());
```

---

## 📱 React Hooks (Optional)

### Custom Hook for Moderation

```typescript
// hooks/useModerationQueue.ts
import { useState, useEffect, useCallback } from 'react';
import { moderationService } from '../services/moderationService';

export function useModerationQueue(pageSize: number = 20) {
  const [comments, setComments] = useState<FlaggedComment[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await moderationService.getFlaggedCommentsPendingReview(
        page,
        pageSize
      );
      setComments(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('Failed to load flagged comments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);
  
  const loadStats = useCallback(async () => {
    try {
      const data = await moderationService.getModerationStatistics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);
  
  useEffect(() => {
    loadComments();
    loadStats();
  }, [loadComments, loadStats]);
  
  const approve = useCallback(async (commentId: number) => {
    await moderationService.approveComment(commentId);
    await Promise.all([loadComments(), loadStats()]);
  }, [loadComments, loadStats]);
  
  const reject = useCallback(async (commentId: number) => {
    await moderationService.rejectComment(commentId);
    await Promise.all([loadComments(), loadStats()]);
  }, [loadComments, loadStats]);
  
  const unflag = useCallback(async (commentId: number) => {
    await moderationService.unflagComment(commentId);
    await Promise.all([loadComments(), loadStats()]);
  }, [loadComments, loadStats]);
  
  return {
    comments,
    stats,
    page,
    setPage,
    totalPages,
    loading,
    error,
    approve,
    reject,
    unflag,
    refresh: loadComments
  };
}
```

---

## 🚦 Navigation Updates

### Add Moderation to Admin Menu

```typescript
// components/admin/AdminSidebar.tsx
function AdminSidebar() {
  return (
    <nav className="admin-sidebar">
      <MenuItem icon="📊" label="Dashboard" href="/admin" />
      <MenuItem icon="📝" label="Blogs" href="/admin/blogs" />
      <MenuItem icon="💬" label="Comments" href="/admin/comments" />
      
      {/* NEW: Add moderation link */}
      <MenuItem 
        icon="⚠️" 
        label="Moderation Queue" 
        href="/admin/moderation"
        badge={pendingCount}  // Show count of pending reviews
      />
      
      <MenuItem icon="⭐" label="Ratings" href="/admin/ratings" />
      <MenuItem icon="👥" label="Users" href="/admin/users" />
    </nav>
  );
}
```

---

## 🔔 Notifications (Optional Enhancement)

### Real-time Moderation Alerts

```typescript
// hooks/useModerationNotifications.ts
import { useEffect, useState } from 'react';

export function useModerationNotifications() {
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    // Poll for updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const stats = await moderationService.getModerationStatistics();
        setPendingCount(stats.pendingReviewComments);
        
        // Show browser notification if new items
        if (stats.pendingReviewComments > pendingCount) {
          showBrowserNotification(
            'New Flagged Comments',
            `${stats.pendingReviewComments} comments need review`
          );
        }
      } catch (error) {
        console.error('Failed to check moderation queue:', error);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [pendingCount]);
  
  return { pendingCount };
}

function showBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Basic Integration (Required)
- [ ] Update `BlogCommentResponse` interface to include new fields
- [ ] Test existing user comment functionality (should work unchanged)
- [ ] Verify admin can still hide/show/delete comments

### Phase 2: Moderation Dashboard (Recommended)
- [ ] Create `/admin/moderation` route
- [ ] Implement `ModerationDashboard` component
- [ ] Implement `FlaggedCommentCard` component
- [ ] Add moderation service layer
- [ ] Create `useModerationQueue` hook
- [ ] Add navigation link to admin sidebar

### Phase 3: UI Polish (Optional)
- [ ] Add severity color coding
- [ ] Implement pagination
- [ ] Add loading states
- [ ] Add empty states
- [ ] Add error handling
- [ ] Add confirmation dialogs for actions

### Phase 4: Enhancements (Optional)
- [ ] Real-time notifications
- [ ] Badge counts on navigation
- [ ] Keyboard shortcuts (approve: A, reject: R)
- [ ] Bulk actions
- [ ] Export flagged comments report
- [ ] Moderation history timeline

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### User Flow
1. [ ] Create normal comment → Should work as before
2. [ ] Create comment with profanity → Should be created but flagged
3. [ ] Edit comment to add profanity → Should be re-flagged
4. [ ] Comment should remain visible to user even when flagged

#### Admin Flow
1. [ ] Browse all comments → Should show flag indicator on flagged comments
2. [ ] Open moderation dashboard → Should show flagged queue
3. [ ] Approve flagged comment → Should unflag and remain visible
4. [ ] Reject flagged comment → Should hide comment
5. [ ] Unflag false positive → Should unflag but not automatically show
6. [ ] View statistics → Should show accurate counts

#### Edge Cases
1. [ ] Approve hidden comment → Should become visible
2. [ ] Hide flagged comment → Should still appear in moderation queue
3. [ ] User updates approved comment with profanity → Should re-flag

---

## 🔍 API Response Examples

### Get Flagged Comments Queue

**Request:**
```http
GET /api/admin/comment-moderation/flagged?page=0&size=20
Authorization: Bearer {admin_jwt}
```

**Response:**
```json
{
  "code": 1000,
  "message": "Retrieved flagged comments pending review",
  "result": {
    "content": [
      {
        "id": 124,
        "content": "This is terrible sh*t!",
        "userId": 457,
        "userFullName": "Jane Smith",
        "userAvatar": null,
        "blogId": 789,
        "createdAt": "2025-11-23T10:35:00Z",
        "updatedAt": "2025-11-23T10:35:00Z",
        "isHidden": false,
        "isFlagged": true,
        "flagReason": "Profanity detected: shit (severity: HIGH)",
        "flaggedAt": "2025-11-23T10:35:00Z",
        "reviewedByAdmin": false
      }
    ],
    "totalElements": 15,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

### Approve Comment

**Request:**
```http
POST /api/admin/comment-moderation/124/approve
Authorization: Bearer {admin_jwt}
```

**Response:**
```json
{
  "code": 1000,
  "message": "Comment approved and unflagged successfully",
  "result": {
    "id": 124,
    "content": "This is terrible sh*t!",
    "userId": 457,
    "userFullName": "Jane Smith",
    "blogId": 789,
    "createdAt": "2025-11-23T10:35:00Z",
    "updatedAt": "2025-11-23T10:35:00Z",
    "isHidden": false,
    "isFlagged": false,
    "flagReason": null,
    "flaggedAt": null,
    "reviewedByAdmin": true
  }
}
```

---

## 🎯 Quick Start Summary

### Minimal Implementation (30 minutes)

1. **Update TypeScript types** (5 min)
   - Add 4 new optional fields to `BlogCommentResponse`

2. **Create moderation service** (10 min)
   - Copy `ModerationService` class from above

3. **Create moderation page** (15 min)
   - Basic list of flagged comments
   - Approve/Reject buttons
   - Link in admin sidebar

### Full Implementation (2-3 hours)

1. Everything from minimal +
2. Statistics dashboard
3. Severity indicators
4. Pagination
5. Loading states
6. Styling

---

## 💡 Best Practices

### Do's ✅
- ✅ Hide `isFlagged` status from regular users
- ✅ Show clear severity indicators (HIGH/MEDIUM/LOW)
- ✅ Provide context (link to blog post)
- ✅ Add confirmation dialogs for destructive actions
- ✅ Show success/error messages after actions
- ✅ Refresh queue automatically after actions
- ✅ Use optimistic updates for better UX

### Don'ts ❌
- ❌ Don't show auto-flagging details to regular users
- ❌ Don't automatically hide flagged comments
- ❌ Don't allow multiple simultaneous actions on same comment
- ❌ Don't forget error handling
- ❌ Don't hardcode API URLs

---

## 🐛 Troubleshooting

### Issue: New fields not showing
**Solution**: Make sure TypeScript interface includes all 4 new fields as optional

### Issue: 403 Forbidden on moderation endpoints
**Solution**: Check admin JWT token is valid and role is `ROLE_ADMIN`

### Issue: Comments disappear after flagging
**Solution**: Flagged comments should remain visible until explicitly hidden by admin

### Issue: Can't approve/reject comments
**Solution**: Ensure using correct endpoint `/api/admin/comment-moderation/{id}/approve`

---

## 📞 Support

For questions or issues:
1. Check API documentation: `COMMENT_API_STRUCTURE.md`
2. Check integration guide: `BLOG_COMMENT_INTEGRATION_ANALYSIS.md`
3. Review backend implementation: `AUTO_FLAGGING_MODERATION_GUIDE.md`

---

**Document Version**: 1.0  
**Last Updated**: November 23, 2025  
**Target Audience**: Frontend Developers  
**Estimated Implementation Time**: 2-3 hours (full implementation)
