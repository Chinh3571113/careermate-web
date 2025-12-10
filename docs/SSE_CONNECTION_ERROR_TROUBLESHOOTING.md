# 🔴 SSE Connection Error - Troubleshooting Guide for Frontend

## Error You're Seeing

```
❌ [SSE] Connection error: {}
eventSource.onerror
```

---

## 🎯 Root Cause

**The SSE connection to the backend is failing because `EventSource` cannot send authentication headers.**

### The Technical Problem:

1. **Backend requires JWT authentication** for `/api/notifications/stream`
2. **Native browser `EventSource` API CANNOT send custom headers** like `Authorization: Bearer token`
3. Your JWT token is stored in `localStorage` (not cookies)
4. **Connection fails** because no authentication is sent to the backend

---

## ✅ Solution 1: Use Cookies for JWT (Recommended)

### Why This Works:
- `EventSource` **automatically sends cookies** with requests
- No code changes needed in SSE connection logic
- Most secure approach

### Implementation:

#### A. Update Your Login Function
```typescript
// src/services/AuthService.ts or wherever you handle login

async function login(email: string, password: string) {
  const response = await axios.post('/api/auth/token', { email, password });
  const { token, refreshToken } = response.data.result;
  
  // ❌ OLD: Don't store in localStorage
  // localStorage.setItem('token', token);
  
  // ✅ NEW: Store in cookie instead
  document.cookie = `access_token=${token}; path=/; secure; samesite=strict; max-age=3600`;
  document.cookie = `refresh_token=${refreshToken}; path=/; secure; samesite=strict; max-age=604800`;
  
  return response.data;
}
```

#### B. Update Your Axios Interceptor
```typescript
// src/lib/axios.ts or api client setup

import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // ✅ Send cookies with all requests
});

// Get token from cookie helper function
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Add token to headers (for non-SSE requests)
apiClient.interceptors.request.use((config) => {
  const token = getCookie('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

#### C. Keep Your SSE Connection As-Is
```typescript
// src/services/NotificationSSEService.ts
// No changes needed! EventSource will automatically send cookies

const eventSource = new EventSource(
  `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/stream`,
  {
    withCredentials: true // ✅ This sends cookies
  }
);
```

#### D. Update Logout Function
```typescript
async function logout() {
  // Clear cookies
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  
  // Disconnect SSE
  sseService.disconnect();
  
  // Call backend logout
  await axios.post('/api/auth/logout', {}, { withCredentials: true });
}
```

---

## ✅ Solution 2: Use EventSource Polyfill

### Why This Works:
- Polyfill supports custom headers
- Can keep JWT in `localStorage`
- Good for existing codebases

### Implementation:

#### A. Install Polyfill
```bash
npm install eventsource
```

#### B. Update SSE Service
```typescript
// src/services/NotificationSSEService.ts
import EventSource from 'eventsource'; // ✅ Import polyfill

export class NotificationSSEService {
  private eventSource: EventSource | null = null;

  connect(handlers: SSEEventHandlers, authToken: string): void { // ✅ Accept token parameter
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    // ✅ Now you can pass Authorization header!
    this.eventSource = new EventSource(
      `${API_URL}/api/notifications/stream`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}` // ✅ Works with polyfill!
        }
      }
    );

    // ... rest of event listeners (same as before)
    this.eventSource.addEventListener('connected', (event) => {
      console.log('✅ SSE Connected');
      handlers.onConnected?.();
    });

    this.eventSource.addEventListener('notification', (event) => {
      const notification = JSON.parse(event.data);
      handlers.onNotification?.(notification);
    });

    // ... other listeners
  }
}
```

#### C. Update Hook to Pass Token
```typescript
// src/hooks/useSSE.ts
import { useEffect, useRef } from 'react';
import { getSSEService } from '@/services/NotificationSSEService';
import { useAuth } from '@/hooks/useAuth'; // Your auth hook

export function useSSE() {
  const sseService = useRef(getSSEService());
  const { token } = useAuth(); // ✅ Get token from context/hook
  
  useEffect(() => {
    if (!token) {
      console.warn('⚠️ No auth token, cannot connect to SSE');
      return;
    }

    console.log('🔌 Connecting to SSE with token...');
    
    sseService.current.connect(
      {
        onNotification: handleNotification,
        onUnreadCount: handleUnreadCount,
        onConnected: handleConnected,
        onError: handleError,
      },
      token // ✅ Pass token to connect method
    );

    return () => {
      sseService.current.disconnect();
    };
  }, [token]); // ✅ Reconnect if token changes

  // ... rest of hook
}
```

---

## 🔍 How to Verify It's Working

### Step 1: Check Browser DevTools

**Open DevTools → Network Tab → Filter: "stream"**

You should see:
```
Request URL: http://localhost:8080/api/notifications/stream
Status: 200 OK
Type: eventsource
```

**Check Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (if using cookies)
```

### Step 2: Check Browser Console

You should see:
```
🔌 Connecting to SSE: http://localhost:8080/api/notifications/stream
✅ SSE Connected: {"message":"Connected to notification stream","userId":"user@example.com"}
💓 SSE keepalive
```

### Step 3: Check Backend Logs

Backend should log:
```
📡 SSE connection established | userId: user@example.com | totalConnections: 1
```

---

## ❌ Common Errors and Fixes

### Error: `401 Unauthorized`
**Problem:** JWT token is missing or invalid

**Check:**
```typescript
// If using cookies:
console.log('Cookies:', document.cookie);
// Should show: access_token=...

// If using localStorage:
console.log('Token:', localStorage.getItem('token'));
// Should show: eyJhbGciOiJIUzI...
```

**Fix:** Make sure token is stored correctly and sent with request

---

### Error: `403 Forbidden`
**Problem:** User doesn't have permission

**Check:** User role and backend endpoint permissions

**Fix:** Verify user has required role (ADMIN, RECRUITER, or CANDIDATE)

---

### Error: CORS Error
**Problem:** Backend not allowing credentials

**Fix:** Backend team needs to verify `SecurityConfig.java`:
```java
corsConfiguration.setAllowCredentials(true);
corsConfiguration.setAllowedOriginPatterns(Collections.singletonList("*"));
```

---

### Error: Connection Closes Immediately
**Problem:** Network issues or backend not running

**Check:**
```bash
# Test backend is running
curl http://localhost:8080/actuator/health

# Test SSE endpoint manually
curl -N -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/notifications/stream
```

---

## 📋 Quick Checklist

- [ ] Backend is running at `http://localhost:8080`
- [ ] JWT token is stored (cookies OR localStorage)
- [ ] Token is valid (not expired)
- [ ] User is authenticated
- [ ] CORS allows credentials
- [ ] `withCredentials: true` in EventSource options
- [ ] Network tab shows status 200 for `/stream` request
- [ ] Console shows "✅ SSE Connected"

---

## 🎯 Recommendation

**Use Solution 1 (Cookies)** because:
- ✅ More secure (httpOnly cookies possible)
- ✅ No polyfill dependency
- ✅ Works with native EventSource
- ✅ Automatic cookie handling
- ✅ Better for production

**Use Solution 2 (Polyfill)** only if:
- ⚠️ Cannot change authentication system
- ⚠️ Must keep JWT in localStorage
- ⚠️ Already heavily invested in localStorage approach

---

## 🆘 Still Not Working?

### Test SSE Manually with curl:

```bash
# Get your JWT token from browser (DevTools → Application → Local Storage or Cookies)
TOKEN="your_jwt_token_here"

# Test SSE connection
curl -N -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/notifications/stream

# You should see:
# event: connected
# data: {"message":"Connected to notification stream","userId":"user@example.com"}
#
# event: keepalive
# data: ping
```

### Check Backend Logs:

```bash
# Backend should show:
📡 SSE connection established | userId: user@example.com | totalConnections: 1
```

### Contact Backend Team If:

- curl command above fails with 401/403
- Backend logs show authentication errors
- CORS errors in browser console
- Backend not running

---

## 📞 Need More Help?

**Backend API Base URL:** `http://localhost:8080`
**SSE Endpoint:** `GET /api/notifications/stream`
**Authentication:** JWT Bearer token required (or cookies)
**CORS:** Must allow credentials

**Test Endpoint:**
```bash
curl http://localhost:8080/actuator/health
```

---

## 🎉 Success Indicators

When everything works, you'll see:

**Console:**
```
🔌 Connecting to SSE: http://localhost:8080/api/notifications/stream
✅ SSE Connected: {"message":"Connected to notification stream","userId":"user@example.com"}
💓 SSE keepalive
📬 New notification: {...}
🔔 Unread count: 5
```

**Network Tab:**
```
Status: 200 OK
Type: eventsource
EventStream data flowing...
```

**UI:**
- Bell icon shows unread count
- Toast notifications appear for new events
- No console errors
- Real-time updates working

---

**Last Updated:** November 22, 2025
**Backend Version:** Spring Boot 3.5.6
**Compatible With:** Next.js 14+, React 18+
