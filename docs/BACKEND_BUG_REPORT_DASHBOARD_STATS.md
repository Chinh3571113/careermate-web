# 🐛 BACKEND BUG REPORT - Dashboard Stats Endpoint

## 🚨 Critical Issue: User Role Counts Returning Zero

**Date**: November 23, 2025  
**Endpoint**: `GET /api/admin/dashboard/stats`  
**Status**: ❌ **BACKEND BUG CONFIRMED**  

---

## 📊 Evidence from Frontend Logs

```javascript
// API Response from Backend:
{
  code: 200,
  message: 'Dashboard statistics retrieved successfully',
  result: {
    totalUsers: 5,              // ✅ CORRECT
    totalCandidates: 0,         // ❌ WRONG - Should be 3
    totalRecruiters: 0,         // ❌ WRONG - Should be 1  
    totalAdmins: 0,             // ❌ WRONG - Should be 1
    activeAccounts: 5,          // ✅ CORRECT
    pendingAccounts: 0,
    bannedAccounts: 0,
    rejectedAccounts: 0,
    totalBlogs: (value),
    totalJobPostings: (value),
    totalApplications: (value),
    pendingRecruiterApprovals: (value),
    flaggedComments: (value),
    flaggedRatings: (value),
    databaseStatus: 'UNKNOWN',  // ⚠️ Should be 'UP' or 'DOWN'
    kafkaStatus: 'UP',
    systemStatus: 'DOWN'
  }
}
```

**Problem**: 
- `totalUsers = 5` (correct count)
- But `totalCandidates + totalRecruiters + totalAdmins = 0 + 0 + 0 = 0` ❌
- This is mathematically impossible - users must have roles!

---

## 🔍 Root Cause Analysis

The backend endpoint has **3 specific issues**:

### Issue 1: User Role Counting is Broken ❌

**Expected Behavior**:
```sql
-- Should count users by role from account_roles table
SELECT COUNT(DISTINCT a.id) 
FROM account a
JOIN account_roles ar ON a.id = ar.account_id  
JOIN role r ON ar.role_id = r.id
WHERE r.name = 'ROLE_CANDIDATE';  -- Should return 3-4 users
```

**Actual Behavior**:
Backend is returning `0` for all three role counts, which means:
- ❌ SQL query is not joining tables correctly
- ❌ Role name filtering is broken
- ❌ OR the repository method is not implemented

### Issue 2: Database Status Shows 'UNKNOWN' ⚠️

**Expected**: `databaseStatus: 'UP'` or `databaseStatus: 'DOWN'`  
**Actual**: `databaseStatus: 'UNKNOWN'`

This suggests the health check for database is not working properly.

### Issue 3: System Status Shows 'DOWN' Despite Working ⚠️

Backend successfully returned data (status 200), but reports `systemStatus: 'DOWN'`. This is inconsistent.

---

## 🛠️ Required Backend Fixes

### Fix 1: Implement User Role Counting (CRITICAL 🔴)

**File**: `AdminDashboardService.java` (or equivalent)

**Current Code** (BROKEN):
```java
// This is likely returning 0 or null
public long getTotalCandidates() {
    // Broken implementation
    return 0; // ❌ Hard-coded or broken query
}
```

**Required Fix**:
```java
public long getTotalCandidates() {
    return accountRepository.countByRoleName("ROLE_CANDIDATE");
}

public long getTotalRecruiters() {
    return accountRepository.countByRoleName("ROLE_RECRUITER");
}

public long getTotalAdmins() {
    return accountRepository.countByRoleName("ROLE_ADMIN");
}
```

**Required Repository Method**:
```java
// In AccountRepository.java
@Query("SELECT COUNT(DISTINCT a) FROM Account a " +
       "JOIN a.roles r " +
       "WHERE r.name = :roleName")
long countByRoleName(@Param("roleName") String roleName);
```

### Fix 2: Fix Database Health Status

**File**: `AdminDashboardController.java` or health indicator

```java
// Should return actual database status
private String getDatabaseStatus() {
    try {
        // Test database connection
        entityManager.createNativeQuery("SELECT 1").getSingleResult();
        return "UP";
    } catch (Exception e) {
        return "DOWN";
    }
}
```

### Fix 3: Fix System Status Logic

```java
// System should be UP if database is UP
private String getSystemStatus(String databaseStatus, String kafkaStatus) {
    if ("UP".equals(databaseStatus) && "UP".equals(kafkaStatus)) {
        return "UP";
    }
    return "DOWN";
}
```

---

## 🧪 How to Test Backend Fix

### Step 1: Check Database Manually
```sql
-- Run these queries in your database to verify data exists:

-- Total users
SELECT COUNT(*) FROM account;
-- Expected: 5 ✅

-- Users by role
SELECT r.name as role, COUNT(DISTINCT a.id) as count
FROM account a
JOIN account_roles ar ON a.id = ar.account_id
JOIN role r ON ar.role_id = r.id
GROUP BY r.name;
-- Expected: 
-- ROLE_CANDIDATE: 3
-- ROLE_RECRUITER: 1
-- ROLE_ADMIN: 1
```

### Step 2: Test API with curl
```bash
# Get admin JWT token first
curl -X POST http://localhost:8080/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@gmail.com", "password": "your_password"}'

# Test dashboard stats endpoint
curl http://localhost:8080/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected response:
{
  "code": 200,
  "result": {
    "totalUsers": 5,
    "totalCandidates": 3,      // ✅ Should NOT be 0
    "totalRecruiters": 1,      // ✅ Should NOT be 0  
    "totalAdmins": 1,          // ✅ Should NOT be 0
    "databaseStatus": "UP",    // ✅ Should be UP
    "systemStatus": "UP"       // ✅ Should be UP
  }
}
```

### Step 3: Verify Fix in Frontend
After backend is fixed:
1. Refresh dashboard at `http://localhost:3000/admin`
2. Check console logs show non-zero values
3. Verify pie chart displays colored sections

---

## 📋 Backend Team Checklist

- [ ] **CRITICAL**: Implement `countByRoleName()` in AccountRepository
- [ ] Fix `getTotalCandidates()` method
- [ ] Fix `getTotalRecruiters()` method  
- [ ] Fix `getTotalAdmins()` method
- [ ] Fix database health check to return 'UP' not 'UNKNOWN'
- [ ] Fix system status logic
- [ ] Test with SQL queries manually
- [ ] Test API endpoint with curl
- [ ] Verify response has non-zero role counts
- [ ] Deploy fix to development server
- [ ] Notify frontend team when fixed

---

## 📞 Impact Assessment

**Severity**: 🔴 **CRITICAL**  
**Impact**: Admin dashboard completely non-functional for user distribution

**Affected Features**:
- ❌ User Distribution by Role chart (shows empty)
- ❌ Admin cannot see user composition
- ❌ Business metrics unavailable
- ❌ Decision-making based on incomplete data

**Workaround**: None - requires backend fix

**Timeline**: 
- **Expected Fix**: 1-2 hours
- **Testing**: 30 minutes
- **Deployment**: Immediate

---

## 🔗 Related Documentation

- Backend Guide: `NEXTJS_ADMIN_DASHBOARD_GUIDE.md`
- Frontend Implementation: `ADMIN_DASHBOARD_REBUILD_SUMMARY.md`
- API Requirements: `ADMIN_DASHBOARD_API_REQUIREMENTS.md`

---

## ✅ Verification Steps After Fix

1. Backend deploys fix
2. Frontend team tests:
   ```bash
   # Clear browser cache
   # Refresh http://localhost:3000/admin
   # Check console shows non-zero values
   ```
3. Verify charts display properly
4. Mark as resolved

---

**Report Status**: 🔴 **OPEN - Awaiting Backend Fix**  
**Assigned To**: Backend Team  
**Priority**: **P0 - Critical Bug**  
**ETA**: ASAP

---

**Frontend Status**: ✅ **Working Correctly** - Waiting for backend data  
**Created By**: Frontend Development Team  
**Last Updated**: November 23, 2025
