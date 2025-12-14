# Unified Token Refresh Implementation

## Problem Statement

The authentication system had multiple independent refresh mechanisms competing with each other, causing "refresh storms" that led to:

1. **Multiple Simultaneous Refresh Requests**: Different parts of the app (AuthProvider, Axios interceptors, auth store, etc.) would trigger refresh calls at the same time
2. **Token Rotation Issues**: Backend issues new tokens with each refresh, invalidating old tokens
3. **401 Errors from Rotated Tokens**: Using an old token after a new one was issued causes 401
4. **Forced Logout**: 401 errors triggered `clearAuth()`, logging users out unexpectedly during normal navigation

### Previous Refresh Triggers (Before Fix)

1. **`useAuthStore.refresh()`** - Used SimpleThrottle class (300ms throttle)
2. **`safeRefreshToken()` in api.ts** - Had separate `isRefreshing` flag
3. **AuthProvider** - Called `refresh()` on mount when no token
4. **initializeAuth()** - Called `safeRefreshToken()` internally
5. **Axios request interceptor** - Called `safeRefreshToken()` before requests
6. **Axios response interceptor** - Called `safeRefreshToken()` on 401
7. **startRefreshTimer()** - Scheduled automatic refresh based on expiration

**Problem**: Each mechanism had its own locking/throttling, but they didn't coordinate globally. Multiple refresh calls could still happen simultaneously from different code paths.

## Solution Architecture

### Core Principle: Single Global Refresh Promise

Created a unified refresh manager (`src/lib/refresh-manager.ts`) that ensures only ONE token refresh operation happens at a time across the entire application.

### Key Features

1. **Global Refresh Promise**: All callers share the same promise during an active refresh
2. **Automatic Cleanup**: Promise cleared after completion (success or failure)
3. **No Duplicate Calls**: Second caller during refresh waits for first caller's result
4. **Single Backend Call**: Only one POST `/api/auth/token-refresh` per refresh event
5. **Centralized State Update**: Updates Zustand store and localStorage in one place

### Implementation

#### 1. Unified Refresh Manager (`src/lib/refresh-manager.ts`)

```typescript
// Single shared refresh promise
let refreshPromise: Promise<string | null> | null = null;

export async function unifiedRefresh(): Promise<string | null> {
  // If refresh already in progress, return existing promise
  if (refreshPromise) {
    console.debug("⏳ Refresh in progress, waiting...");
    return refreshPromise;
  }

  // Start new refresh operation
  refreshPromise = doActualRefresh().finally(() => {
    refreshPromise = null; // Clear after completion
  });

  return refreshPromise;
}

async function doActualRefresh(): Promise<string | null> {
  // 1. Call POST /api/auth/token-refresh (with httpOnly cookie)
  // 2. Decode JWT to extract user info and roles
  // 3. Update localStorage (access_token, token_expires_at)
  // 4. Update Zustand store (accessToken, tokenExpiresAt, role, user)
  // 5. Fetch user profile (non-blocking)
  // 6. Return new token or null
}
```

#### 2. Updated Store (`src/store/use-auth-store.ts`)

```typescript
// Old implementation (throttled, but separate from global promise)
_legacyRefresh: async () => SimpleThrottle.throttle("refresh", async () => {
  // Direct axios call to /api/auth/token-refresh
  // Updates store
  // Returns token
}),

// New implementation (uses unified refresh)
refresh: async () => {
  const { unifiedRefresh } = await import("@/lib/refresh-manager");
  return unifiedRefresh();
},
```

**Why**: The store's `refresh()` method is called by AuthProvider, timer callbacks, and manual refresh triggers. By delegating to `unifiedRefresh()`, we ensure all store-based refresh calls go through the global promise.

#### 3. Updated API Interceptors (`src/lib/api.ts`)

**Changes Made:**

- Added import: `import { unifiedRefresh } from "./refresh-manager"`
- Replaced all `safeRefreshToken()` calls with `unifiedRefresh()`
- Kept old `safeRefreshToken` renamed as `_legacySafeRefreshToken` for reference
- Updated `initializeAuth()` to use `unifiedRefresh()`

**Locations Updated:**

1. **initializeAuth()** - Silent refresh when no token
2. **initializeAuth()** - Refresh expired token
3. **initializeAuth()** - Proactive refresh if < 3s remaining
4. **Request Interceptor** - Silent refresh before request
5. **Request Interceptor** - Proactive refresh if expiring soon
6. **Response Interceptor** - Refresh after 401 error

**Why**: Axios interceptors are the most critical refresh triggers. By using `unifiedRefresh()`, we prevent duplicate refresh calls when multiple requests fail with 401 at the same time.

#### 4. AuthProvider (No Changes Needed)

`src/store/auth-provider.tsx` already calls `useAuthStore.getState().refresh()`, which now uses `unifiedRefresh()` internally. No changes needed.

**Refresh triggers in AuthProvider:**
- Silent refresh on mount if no token
- Periodic validation every 60 seconds
- Proactive refresh if < 30s remaining
- Refresh on token expiration

All now use the unified manager through the store.

#### 5. Token Timer (No Changes Needed)

`startRefreshTimer()` in `use-auth-store.ts` calls the `refresh()` function passed as parameter, which is the store's `refresh()` method that now uses `unifiedRefresh()`.

## Removed Mechanisms

### 1. Removed: SimpleThrottle for Refresh

**Before:**
```typescript
SimpleThrottle.throttle("refresh", async () => {
  // refresh logic
})
```

**Why Removed**: SimpleThrottle only throttled calls within the same code path (store methods). It didn't prevent competing calls from interceptors, AuthProvider, or other sources. The global promise in `unifiedRefresh()` handles this better.

### 2. Removed: isRefreshing Flag in api.ts

**Before:**
```typescript
let isRefreshing = false;

if (!isRefreshing) {
  isRefreshing = true;
  const newToken = await safeRefreshToken();
  isRefreshing = false;
}
```

**Why Removed**: The `isRefreshing` flag in api.ts only prevented duplicate calls within interceptors. It didn't coordinate with store-based refresh calls. The global promise replaces this.

## How It Works

### Scenario 1: Multiple API Calls with Expired Token

**Before (Refresh Storm):**
1. User navigates to page → 3 API calls sent simultaneously
2. All have expired token → All get 401
3. Response interceptor on each: `await safeRefreshToken()`
4. Result: 3 simultaneous refresh calls → Token rotation → Some calls fail

**After (Unified Refresh):**
1. User navigates to page → 3 API calls sent simultaneously
2. All have expired token → All get 401
3. First response interceptor: `await unifiedRefresh()` → Creates promise
4. Second response interceptor: `await unifiedRefresh()` → Waits for same promise
5. Third response interceptor: `await unifiedRefresh()` → Waits for same promise
6. Result: 1 refresh call → All three get new token → All retry successfully

### Scenario 2: Opening New Tab

**Before:**
1. User opens new tab → No localStorage token
2. `useAuthHydration` → Calls `initializeAuth()` → `await safeRefreshToken()`
3. `AuthProvider` mounts → Sees no token → `await refresh()`
4. Page components mount → Make API calls → Interceptor → `await safeRefreshToken()`
5. Result: 3+ simultaneous refresh calls

**After:**
1. User opens new tab → No localStorage token
2. `useAuthHydration` → Calls `initializeAuth()` → `await unifiedRefresh()` → Creates promise
3. `AuthProvider` mounts → Calls `refresh()` → `await unifiedRefresh()` → Waits for same promise
4. Page components mount → Make API calls → Interceptor → `await unifiedRefresh()` → Waits for same promise
5. Result: 1 refresh call → All consumers get same token

### Scenario 3: Token Expiring During Request

**Before:**
1. Token has 2s remaining
2. User makes API call
3. Request interceptor: Checks expiration → `await safeRefreshToken()` → Creates refresh
4. Meanwhile, AuthProvider periodic check: Sees < 30s → `await refresh()` → Creates another refresh
5. Meanwhile, auto-refresh timer fires → `await refresh()` → Creates third refresh
6. Result: 3 simultaneous refresh calls

**After:**
1. Token has 2s remaining
2. User makes API call
3. Request interceptor: Checks expiration → `await unifiedRefresh()` → Creates promise
4. Meanwhile, AuthProvider periodic check: Sees < 30s → `await refresh()` → `await unifiedRefresh()` → Waits for same promise
5. Meanwhile, auto-refresh timer fires → `await refresh()` → `await unifiedRefresh()` → Waits for same promise
6. Result: 1 refresh call → All get new token

## Testing Plan

### 1. New Tab Test

**Steps:**
1. Login to app
2. Open DevTools → Network tab → Filter "refresh"
3. Open new tab with app URL
4. Wait for page to load

**Expected:**
- ✅ MAX 1 POST `/api/auth/token-refresh` call
- ✅ No duplicate refresh calls
- ✅ Page loads successfully
- ✅ User remains logged in

**Before Fix:** 2-4 refresh calls
**After Fix:** 1 refresh call

### 2. Token Expiration Test

**Steps:**
1. Login to app
2. Open DevTools → Network tab → Filter "refresh"
3. Wait for token to expire (or manually delete token)
4. Navigate between pages
5. Make API requests

**Expected:**
- ✅ MAX 1 POST `/api/auth/token-refresh` call per expiration event
- ✅ No duplicate simultaneous refresh calls
- ✅ All API requests succeed after refresh
- ✅ No 401 errors from rotated tokens
- ✅ No unexpected logout

**Before Fix:** Multiple refresh calls, some 401s, possible logout
**After Fix:** 1 refresh call, all requests succeed

### 3. Multiple Simultaneous API Calls

**Steps:**
1. Login to app
2. Delete access token from localStorage (keep refresh cookie)
3. Open DevTools → Network tab → Filter "refresh"
4. Navigate to page that makes multiple API calls

**Expected:**
- ✅ MAX 1 POST `/api/auth/token-refresh` call
- ✅ All API calls wait for refresh to complete
- ✅ All API calls retry with new token
- ✅ All API calls succeed
- ✅ No 401 errors

**Before Fix:** Multiple refresh calls per batch of API calls
**After Fix:** 1 refresh call, all API calls succeed

### 4. Page Reload Test

**Steps:**
1. Login to app
2. Navigate to any page
3. Open DevTools → Network tab → Filter "refresh"
4. Hard reload page (Ctrl+Shift+R)
5. Observe network calls

**Expected:**
- ✅ MAX 1 POST `/api/auth/token-refresh` (only if token expired)
- ✅ If token valid, 0 refresh calls
- ✅ Page loads successfully
- ✅ User remains logged in
- ✅ No clearAuth() called

**Before Fix:** Sometimes cleared auth on reload
**After Fix:** Preserves session correctly

### 5. Periodic Validation Test

**Steps:**
1. Login to app
2. Open DevTools → Network tab → Filter "refresh"
3. Leave page open for 5 minutes
4. Observe network calls

**Expected:**
- ✅ Periodic refresh calls (every ~60s or based on expiration)
- ✅ No duplicate simultaneous refresh calls
- ✅ Each refresh event shows MAX 1 call
- ✅ User remains logged in throughout

### 6. Concurrent Actions Test

**Steps:**
1. Login to app
2. Open DevTools → Network tab → Filter "refresh"
3. Perform multiple actions rapidly:
   - Navigate between pages
   - Submit forms
   - Open modals
   - Make API calls
4. Observe network calls

**Expected:**
- ✅ No refresh storms (multiple simultaneous calls)
- ✅ All actions complete successfully
- ✅ No 401 errors
- ✅ No unexpected logout

## Debug Logging

The unified refresh manager includes comprehensive debug logging:

```typescript
console.debug("🔄 [RefreshManager] Starting token refresh...");
console.debug("✅ [RefreshManager] Token refreshed successfully (expires in ${expiresIn}s)");
console.debug("❌ [RefreshManager] Refresh failed:", error?.message);
console.debug("⏳ [RefreshManager] Refresh already in progress, waiting...");
console.debug("🌐 [RefreshManager] Network error - not clearing auth");
console.debug("🔐 [RefreshManager] Refresh token invalid - clearing auth");
```

### How to Monitor

Open browser DevTools → Console → Filter by "RefreshManager"

**Healthy pattern:**
```
🔄 [RefreshManager] Starting token refresh...
✅ [RefreshManager] Token refreshed successfully (expires in 8s)
```

**Problem pattern (should NOT see):**
```
🔄 [RefreshManager] Starting token refresh...
⏳ [RefreshManager] Refresh already in progress, waiting...  ← Multiple calls
⏳ [RefreshManager] Refresh already in progress, waiting...
```

**Note**: It's OK to see "already in progress" messages - they indicate the system is working correctly (subsequent calls are waiting for the first one). The key is that only ONE "Starting token refresh" should appear per event.

## Migration Checklist

- ✅ Created `src/lib/refresh-manager.ts` with `unifiedRefresh()`
- ✅ Updated `useAuthStore.refresh()` to use `unifiedRefresh()`
- ✅ Updated `api.ts` to import `unifiedRefresh`
- ✅ Replaced all `safeRefreshToken()` calls in `initializeAuth()`
- ✅ Replaced all `safeRefreshToken()` calls in request interceptor
- ✅ Replaced all `safeRefreshToken()` calls in response interceptor
- ✅ Deprecated old `safeRefreshToken` (renamed to `_legacySafeRefreshToken`)
- ✅ Verified AuthProvider uses store's `refresh()` (which now uses unified)
- ✅ Verified `startRefreshTimer()` uses store's `refresh()` (which now uses unified)
- ✅ No more direct backend calls outside of `unifiedRefresh()`
- ✅ All refresh paths now go through global promise

## Benefits

### 1. No More Refresh Storms
- Only one `/api/auth/token-refresh` call per event
- No competing refresh mechanisms

### 2. No More Token Rotation Issues
- Single token issued per refresh event
- No stale tokens causing 401s

### 3. No More Unexpected Logouts
- Refresh failures don't cascade
- Network errors don't trigger logout
- Only invalid refresh token logs out

### 4. Better Performance
- Fewer backend calls
- Reduced network traffic
- Faster user experience

### 5. Cleaner Code
- Single source of truth
- Easier to debug
- Centralized state updates

## Related Files

### Core Implementation
- `src/lib/refresh-manager.ts` - Unified refresh manager
- `src/store/use-auth-store.ts` - Auth store (refresh method)
- `src/lib/api.ts` - Axios interceptors

### Consumers (No Changes Needed)
- `src/store/auth-provider.tsx` - Uses store's refresh
- `src/hooks/useAuthHydration.ts` - Uses initializeAuth
- `src/components/auth/auth-guard.tsx` - Uses initializeAuth
- `src/components/auth/AdminAuthGuard.tsx` - Uses initializeAuth

## Future Improvements

1. **Metrics**: Add telemetry to track refresh patterns
2. **Analytics**: Monitor refresh success/failure rates
3. **Alerting**: Alert if refresh storms detected (shouldn't happen)
4. **Token Lifespan**: Coordinate with backend to increase token lifespan (reduce refresh frequency)
5. **Refresh Token Rotation**: Support refresh token rotation if backend implements it

## Troubleshooting

### Issue: Still seeing multiple refresh calls

**Check:**
1. Ensure all code paths use `unifiedRefresh()` or store's `refresh()`
2. Verify no direct axios calls to `/api/auth/token-refresh`
3. Check for custom implementations in feature modules
4. Look for race conditions in component mount/unmount

**Solution:**
- Search codebase: `grep -r "token-refresh" src/`
- Search for: `grep -r "safeRefreshToken" src/`
- All should be either `unifiedRefresh()` or `_legacy` commented out

### Issue: Token not refreshing automatically

**Check:**
1. Ensure `startRefreshTimer()` is called after `setAuthFromTokens()`
2. Verify AuthProvider is mounted at app root
3. Check token expiration time is set correctly

**Debug:**
```typescript
console.log("Token expires at:", new Date(tokenExpiresAt));
console.log("Time remaining:", tokenExpiresAt - Date.now());
```

### Issue: Refresh fails with network error

**Causes:**
- Backend server down
- CORS issues
- Network connectivity problems
- Cookie not being sent (withCredentials)

**Solution:**
- Check `withCredentials: true` in axios config
- Verify backend CORS allows credentials
- Check httpOnly refresh token cookie exists
- Verify backend `/api/auth/token-refresh` endpoint works

## Summary

The unified refresh implementation eliminates refresh storms by ensuring all token refresh operations go through a single global promise. This prevents token rotation issues, reduces backend load, and provides a more reliable authentication experience.

**Key Takeaway**: Never call the backend refresh endpoint directly. Always use `unifiedRefresh()` or the store's `refresh()` method.
