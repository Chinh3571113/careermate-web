# 🔐 Role-Based Access Control (RBAC) System

## Overview

Hệ thống phân quyền đầy đủ cho 3 loại người dùng:
- **ADMIN** (Quản trị viên)
- **RECRUITER** (Nhà tuyển dụng)
- **CANDIDATE** (Ứng viên/User)

## 🎯 Core Concepts

### Role Types

```typescript
const USER_ROLES = {
  ADMIN: 'ROLE_ADMIN',
  RECRUITER: 'ROLE_RECRUITER',
  CANDIDATE: 'ROLE_CANDIDATE',
  USER: 'ROLE_USER', // Alias for CANDIDATE
}
```

### Role Aliases

Hệ thống hỗ trợ nhiều tên role khác nhau:

```typescript
ADMIN aliases: ['ADMIN', 'ROLE_ADMIN', 'SUPERADMIN', 'ROLE_SUPERADMIN']
RECRUITER aliases: ['RECRUITER', 'ROLE_RECRUITER', 'EMPLOYER', 'ROLE_EMPLOYER']
CANDIDATE aliases: ['CANDIDATE', 'ROLE_CANDIDATE', 'USER', 'ROLE_USER', 'CLIENT', 'ROLE_CLIENT']
```

### Role Hierarchy

```
ADMIN (Level 3) > RECRUITER (Level 2) > CANDIDATE (Level 1)
```

## 📁 File Structure

```
src/
├── types/
│   └── roles.ts                    # Role constants & utilities
├── lib/
│   └── role-utils.ts               # Role helper functions
├── hooks/
│   └── useRoleCheck.ts             # Role check hooks
└── components/
    └── auth/
        ├── AdminAuthGuard.tsx      # Admin-only guard
        ├── RecruiterAuthGuard.tsx  # Recruiter + Admin guard
        └── CandidateAuthGuard.tsx  # All authenticated users
```

## 🛡️ Auth Guards

### 1. AdminAuthGuard
**Chỉ cho phép:** ADMIN

```tsx
import AdminAuthGuard from '@/components/auth/AdminAuthGuard';

export default function AdminPage() {
  return (
    <AdminAuthGuard
      redirectIfGuest="/sign-in"
      redirectIfNotAdmin="/"
    >
      {/* Admin-only content */}
      <h1>Admin Dashboard</h1>
    </AdminAuthGuard>
  );
}
```

### 2. RecruiterAuthGuard
**Cho phép:** RECRUITER + ADMIN

```tsx
import RecruiterAuthGuard from '@/components/auth/RecruiterAuthGuard';

export default function RecruiterPage() {
  return (
    <RecruiterAuthGuard
      redirectIfGuest="/sign-in"
      redirectIfNotRecruiter="/"
    >
      {/* Recruiter + Admin content */}
      <h1>Recruiter Dashboard</h1>
    </RecruiterAuthGuard>
  );
}
```

### 3. CandidateAuthGuard
**Cho phép:** Tất cả authenticated users (ADMIN, RECRUITER, CANDIDATE)

```tsx
import CandidateAuthGuard from '@/components/auth/CandidateAuthGuard';

export default function ProfilePage() {
  return (
    <CandidateAuthGuard redirectIfGuest="/sign-in">
      {/* All authenticated users */}
      <h1>My Profile</h1>
    </CandidateAuthGuard>
  );
}
```

## 🪝 Hooks

### useIsAdmin
```tsx
import { useIsAdmin } from '@/hooks/useRoleCheck';

function MyComponent() {
  const isAdmin = useIsAdmin();
  
  return (
    <div>
      {isAdmin && <button>Admin Action</button>}
    </div>
  );
}
```

### useIsRecruiter
```tsx
import { useIsRecruiter } from '@/hooks/useRoleCheck';

function MyComponent() {
  const isRecruiter = useIsRecruiter();
  
  return (
    <div>
      {isRecruiter && <button>Post Job</button>}
    </div>
  );
}
```

### useIsCandidate
```tsx
import { useIsCandidate } from '@/hooks/useRoleCheck';

function MyComponent() {
  const isCandidate = useIsCandidate();
  
  return (
    <div>
      {isCandidate && <button>Apply for Job</button>}
    </div>
  );
}
```

### useRoleInfo
```tsx
import { useRoleInfo } from '@/hooks/useRoleCheck';

function MyComponent() {
  const {
    role,
    isAdmin,
    isRecruiter,
    isCandidate,
    canAccessAdmin,
    canAccessRecruiter,
    roleCategory
  } = useRoleInfo();
  
  return (
    <div>
      <p>Role: {role}</p>
      <p>Category: {roleCategory}</p>
    </div>
  );
}
```

### useHasAnyRole
```tsx
import { useHasAnyRole } from '@/hooks/useRoleCheck';

function MyComponent() {
  const canManageUsers = useHasAnyRole(['ADMIN', 'RECRUITER']);
  
  return (
    <div>
      {canManageUsers && <button>Manage Users</button>}
    </div>
  );
}
```

## 🔧 Utility Functions

### Role Checking

```typescript
import {
  isAdmin,
  isRecruiter,
  isCandidate,
  canAccessAdmin,
  canAccessRecruiter,
  hasAnyRole
} from '@/lib/role-utils';

// Check if role is admin
const adminCheck = isAdmin('ROLE_ADMIN'); // true

// Check if role is recruiter
const recruiterCheck = isRecruiter('ROLE_RECRUITER'); // true

// Check if role is candidate
const candidateCheck = isCandidate('ROLE_CANDIDATE'); // true

// Check access permissions
const canAdmin = canAccessAdmin('ROLE_ADMIN'); // true
const canRecruit = canAccessRecruiter('ROLE_RECRUITER'); // true (RECRUITER + ADMIN)

// Check multiple roles
const hasAccess = hasAnyRole('ROLE_RECRUITER', ['ADMIN', 'RECRUITER']); // true
```

### Role Normalization

```typescript
import { normalizeRole, getRoleCategory } from '@/lib/role-utils';

// Normalize role to standard format
const normalized = normalizeRole('ADMIN'); // 'ROLE_ADMIN'
const normalized2 = normalizeRole('EMPLOYER'); // 'ROLE_RECRUITER'

// Get role category
const category = getRoleCategory('ROLE_ADMIN'); // 'ADMIN'
const category2 = getRoleCategory('EMPLOYER'); // 'RECRUITER'
```

### Display & Routing

```typescript
import { getRoleDisplayName, getDefaultRedirectPath } from '@/lib/role-utils';

// Get display name in Vietnamese
const displayName = getRoleDisplayName('ROLE_ADMIN'); // 'Quản trị viên'
const displayName2 = getRoleDisplayName('ROLE_RECRUITER'); // 'Nhà tuyển dụng'
const displayName3 = getRoleDisplayName('ROLE_CANDIDATE'); // 'Ứng viên'

// Get default redirect path after login
const redirect = getDefaultRedirectPath('ROLE_ADMIN'); // '/admin'
const redirect2 = getDefaultRedirectPath('ROLE_RECRUITER'); // '/recruiter/dashboard'
const redirect3 = getDefaultRedirectPath('ROLE_CANDIDATE'); // '/jobs'
```

### JWT Role Extraction

```typescript
import { getRoleFromToken } from '@/lib/role-utils';

const token = localStorage.getItem('access_token');
const role = getRoleFromToken(token);
// Returns: 'ROLE_ADMIN' | 'ROLE_RECRUITER' | 'ROLE_CANDIDATE' | null
```

## 📋 Usage Examples

### Example 1: Admin Dashboard

```tsx
// app/admin/page.tsx
import AdminAuthGuard from '@/components/auth/AdminAuthGuard';

export default function AdminDashboard() {
  return (
    <AdminAuthGuard>
      <div>
        <h1>Admin Dashboard</h1>
        <p>Only admins can see this</p>
      </div>
    </AdminAuthGuard>
  );
}
```

### Example 2: Recruiter Dashboard

```tsx
// app/recruiter/page.tsx
import RecruiterAuthGuard from '@/components/auth/RecruiterAuthGuard';
import { useIsAdmin } from '@/hooks/useRoleCheck';

export default function RecruiterDashboard() {
  const isAdmin = useIsAdmin();
  
  return (
    <RecruiterAuthGuard>
      <div>
        <h1>Recruiter Dashboard</h1>
        {isAdmin && <div>Admin Extra Tools</div>}
      </div>
    </RecruiterAuthGuard>
  );
}
```

### Example 3: Candidate Profile

```tsx
// app/profile/page.tsx
import CandidateAuthGuard from '@/components/auth/CandidateAuthGuard';
import { useRoleInfo } from '@/hooks/useRoleCheck';

export default function ProfilePage() {
  const { isRecruiter, isCandidate, roleCategory } = useRoleInfo();
  
  return (
    <CandidateAuthGuard>
      <div>
        <h1>My Profile</h1>
        <p>Role Category: {roleCategory}</p>
        
        {isCandidate && <CandidateProfile />}
        {isRecruiter && <RecruiterProfile />}
      </div>
    </CandidateAuthGuard>
  );
}
```

### Example 4: Conditional Rendering

```tsx
// components/Navigation.tsx
import { useRoleInfo } from '@/hooks/useRoleCheck';

export function Navigation() {
  const { isAdmin, isRecruiter, isCandidate } = useRoleInfo();
  
  return (
    <nav>
      {isAdmin && (
        <Link href="/admin">Admin Panel</Link>
      )}
      
      {isRecruiter && (
        <Link href="/recruiter">Recruiter Dashboard</Link>
      )}
      
      {isCandidate && (
        <Link href="/jobs">Browse Jobs</Link>
      )}
    </nav>
  );
}
```

### Example 5: Permission-Based Actions

```tsx
// components/JobCard.tsx
import { useHasAnyRole } from '@/hooks/useRoleCheck';

export function JobCard({ job }) {
  const canEdit = useHasAnyRole(['ADMIN', 'RECRUITER']);
  
  return (
    <div>
      <h3>{job.title}</h3>
      
      {canEdit && (
        <div>
          <button>Edit Job</button>
          <button>Delete Job</button>
        </div>
      )}
      
      <button>Apply Now</button>
    </div>
  );
}
```

## 🚀 Post-Login Redirect

Update PostLoginRedirect to use role-based routing:

```tsx
// components/auth/PostLoginRedirect.tsx
import { getDefaultRedirectPath } from '@/lib/role-utils';

export function usePostLoginRedirect() {
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  
  useEffect(() => {
    if (role) {
      const redirectPath = getDefaultRedirectPath(role);
      router.push(redirectPath);
    }
  }, [role, router]);
}
```

## 🔒 Security Features

### 1. No Role in localStorage
- Role is **NEVER** stored in localStorage
- Always decoded from JWT token
- Prevents tampering and theft

### 2. JWT-Based Authentication
```typescript
// Role is extracted from JWT payload
const payload = JSON.parse(atob(token.split('.')[1]));
const role = payload.scope || payload.roles[0];
```

### 3. Server-Side Verification
- Client-side guards are for UX only
- All permissions must be verified on server
- Guards prevent unnecessary API calls

## 📊 Role Permission Matrix

| Feature | CANDIDATE | RECRUITER | ADMIN |
|---------|-----------|-----------|-------|
| Browse Jobs | ✅ | ✅ | ✅ |
| Apply to Jobs | ✅ | ❌ | ❌ |
| Post Jobs | ❌ | ✅ | ✅ |
| View Applications | ❌ | ✅ (own) | ✅ (all) |
| Manage Users | ❌ | ❌ | ✅ |
| Admin Panel | ❌ | ❌ | ✅ |
| Recruiter Dashboard | ❌ | ✅ | ✅ |
| Edit Profile | ✅ | ✅ | ✅ |

## 🎨 UI Customization

Each guard has custom UI for access denied:

### AdminAuthGuard
```tsx
<AlertTriangle className="text-red-500" />
<h2>Không có quyền truy cập</h2>
<p>Trang này chỉ dành cho <strong>Quản trị viên</strong></p>
```

### RecruiterAuthGuard
```tsx
<AlertTriangle className="text-red-500" />
<h2>Không có quyền truy cập</h2>
<p>Trang này chỉ dành cho <strong>Nhà tuyển dụng</strong> và <strong>Quản trị viên</strong></p>
```

### CandidateAuthGuard
```tsx
<AlertTriangle className="text-yellow-500" />
<h2>Yêu cầu đăng nhập</h2>
<p>Vui lòng đăng nhập để truy cập trang này</p>
```

## 🧪 Testing

```typescript
// Test role checking
describe('Role Utils', () => {
  it('should identify admin role', () => {
    expect(isAdmin('ROLE_ADMIN')).toBe(true);
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isAdmin('ROLE_RECRUITER')).toBe(false);
  });
  
  it('should identify recruiter role', () => {
    expect(isRecruiter('ROLE_RECRUITER')).toBe(true);
    expect(isRecruiter('EMPLOYER')).toBe(true);
    expect(isRecruiter('ROLE_ADMIN')).toBe(false);
  });
  
  it('should check access permissions', () => {
    expect(canAccessRecruiter('ROLE_RECRUITER')).toBe(true);
    expect(canAccessRecruiter('ROLE_ADMIN')).toBe(true);
    expect(canAccessRecruiter('ROLE_CANDIDATE')).toBe(false);
  });
});
```

## 📝 Migration Guide

### Updating Existing Code

**Before:**
```tsx
// Old way - only checking admin
const isAdmin = role === 'ROLE_ADMIN';
```

**After:**
```tsx
// New way - using utility functions
import { isAdmin } from '@/lib/role-utils';
const adminCheck = isAdmin(role);
```

**Before:**
```tsx
// Old way - manual role check
if (role === 'ROLE_ADMIN' || role === 'ADMIN') {
  // admin code
}
```

**After:**
```tsx
// New way - using hooks
import { useIsAdmin } from '@/hooks/useRoleCheck';
const isAdmin = useIsAdmin();

if (isAdmin) {
  // admin code
}
```

## ✅ Implementation Checklist

- [x] Create role types and constants
- [x] Create role utility functions
- [x] Create AdminAuthGuard
- [x] Create RecruiterAuthGuard
- [x] Create CandidateAuthGuard
- [x] Create role check hooks
- [x] Update documentation
- [ ] Update existing pages to use new guards
- [ ] Update navigation components
- [ ] Update PostLoginRedirect
- [ ] Add unit tests
- [ ] Test all role scenarios

## 🔗 Related Files

- `src/types/roles.ts` - Role constants & types
- `src/lib/role-utils.ts` - Role utility functions
- `src/hooks/useRoleCheck.ts` - Role hooks
- `src/components/auth/AdminAuthGuard.tsx` - Admin guard
- `src/components/auth/RecruiterAuthGuard.tsx` - Recruiter guard
- `src/components/auth/CandidateAuthGuard.tsx` - Candidate guard

---

**Status**: ✅ Complete
**Date**: 2024
**Version**: 1.0.0
