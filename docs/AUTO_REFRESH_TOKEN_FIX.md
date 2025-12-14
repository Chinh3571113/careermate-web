# Fix: Auto Refresh Token When Access Token Deleted

## Vấn đề

Sau khi login, nếu user xóa `access_token` từ localStorage (hoặc expire), hệ thống bị logout ngay lập tức và không thể login lại mặc dù **refresh token cookie vẫn còn hợp lệ**.

## Nguyên nhân

1. **Request Interceptor** chỉ check và refresh token khi `accessToken` tồn tại và gần hết hạn
2. **initializeAuth** chỉ attempt restore từ localStorage, không thử refresh từ cookie
3. **AuthProvider** không detect trường hợp access token bị mất nhưng refresh token cookie còn

## Giải pháp

### 1. **Request Interceptor** - Auto Refresh Khi Không Có Access Token

#### File: `src/lib/api.ts`

```typescript
api.interceptors.request.use(async (config) => {
  // ... existing checks ...
  
  const { accessToken, refresh, tokenExpiresAt } = useAuthStore.getState();

  // ✅ FIX: If no access token but we're authenticated (refresh token cookie exists)
  // Try to refresh the token before making the request
  if (!accessToken && typeof window !== 'undefined') {
    console.debug("No access token found, attempting to refresh from cookie");
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await safeRefreshToken();
        if (newToken) {
          console.debug("Successfully refreshed token from cookie");
          config.headers.Authorization = `Bearer ${newToken}`;
          isRefreshing = false;
          return config;
        } else {
          console.debug("Failed to refresh token from cookie, request will proceed without token");
        }
      } catch (error: any) {
        console.debug("Error refreshing token from cookie:", error?.message || "Unknown error");
      } finally {
        isRefreshing = false;
      }
    }
  }
  
  // ... rest of interceptor ...
});
```

**Lợi ích:**
- Tự động refresh token trước khi send request nếu không có access token
- Không cần user phải refresh page hoặc login lại
- Sử dụng refresh token cookie để lấy access token mới

### 2. **initializeAuth** - Attempt Refresh Nếu Không Có Access Token

#### File: `src/lib/api.ts`

```typescript
export const initializeAuth = async () => {
  // ... existing checks ...
  
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresAtStr = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
  
  console.debug("Initializing auth from localStorage");
  
  // ✅ FIX: If no access token, try to refresh from cookie first
  if (!accessToken || !expiresAtStr) {
    console.debug("No access token in localStorage, attempting to refresh from cookie");
    try {
      const newToken = await safeRefreshToken();
      if (newToken) {
        console.debug("Successfully refreshed token from cookie during initialization");
        lastInitResult = true;
        isInitializing = false;
        return true;
      } else {
        console.debug("No refresh token cookie available");
        lastInitResult = false;
        isInitializing = false;
        return false;
      }
    } catch (error: any) {
      console.debug("Failed to refresh from cookie during initialization:", error?.message || "Unknown error");
      lastInitResult = false;
      isInitializing = false;
      return false;
    }
  }
  
  // ... rest of initialization ...
};
```

**Lợi ích:**
- Khi component mount, tự động attempt restore session từ refresh token cookie
- User không bị logout ngay cả khi clear localStorage
- Seamless authentication experience

### 3. **AuthProvider** - Detect và Restore Missing Access Token

#### File: `src/store/auth-provider.tsx`

```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, introspect, refresh, logout, getTokenExpiration } =
    useAuthStore();
  const lastCheckRef = useRef<number>(0);
  const isRefreshingRef = useRef(false);
  const hasAttemptedRefreshRef = useRef(false); // ✅ NEW

  // ✅ FIX: Check if access token is missing but might have refresh token cookie
  useEffect(() => {
    const checkForMissingToken = async () => {
      // If no access token in state but we haven't tried refreshing yet
      if (!accessToken && !hasAttemptedRefreshRef.current) {
        hasAttemptedRefreshRef.current = true;
        console.debug("No access token in state, attempting refresh from cookie...");
        
        try {
          const newToken = await refresh();
          if (newToken) {
            console.debug("✅ Successfully restored session from refresh token cookie");
          } else {
            console.debug("No valid refresh token cookie found");
          }
        } catch (error) {
          console.debug("Failed to refresh from cookie:", error);
        }
      }
    };

    checkForMissingToken();
  }, [accessToken, refresh]);
  
  // ... rest of provider ...
}
```

**Lợi ích:**
- Monitor accessToken state và auto-restore khi missing
- Chỉ attempt refresh một lần để tránh infinite loop
- Silent recovery - user không cần làm gì

## Luồng hoạt động

### Scenario 1: User xóa access_token từ localStorage

```
1. Page load → initializeAuth()
2. Không tìm thấy access_token trong localStorage
3. ✅ Attempt refresh từ cookie: POST /api/auth/token-refresh
4. Backend validate refresh token cookie → return new access token
5. Save new access token vào localStorage + auth store
6. User vẫn đăng nhập, không bị logout
```

### Scenario 2: User make API request khi access token missing

```
1. User click button → API call
2. Request interceptor check: no accessToken
3. ✅ Attempt refresh từ cookie trước khi send request
4. Get new access token
5. Add Authorization header với token mới
6. Request được gửi thành công
```

### Scenario 3: AuthProvider detect missing token

```
1. Component mount → AuthProvider render
2. useEffect check: accessToken is null
3. ✅ hasAttemptedRefreshRef.current = false → attempt refresh
4. Call refresh() từ auth store
5. Restore session nếu refresh token cookie còn valid
```

## Token Refresh Flow

```
┌─────────────────────────────────────────────────────────┐
│  Access Token Missing or Expired                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Check Refresh Token Cookie                             │
│  (httpOnly cookie set by backend)                       │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
   Cookie Valid            Cookie Invalid/Missing
         │                         │
         ▼                         ▼
   POST /api/auth/token-refresh   Logout User
         │
         ▼
   ┌─────────────────────────────┐
   │  Backend validates cookie   │
   │  Returns new access token   │
   └──────────────┬──────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │  Save to localStorage + auth store   │
   │  - access_token                      │
   │  - token_expires_at                  │
   │  Update state: isAuthenticated=true  │
   └──────────────────────────────────────┘
```

## Testing Scenarios

### ✅ Test 1: Manual Delete Access Token
```
1. Login thành công
2. Open DevTools → Application → Local Storage
3. Delete key "access_token"
4. Click any button hoặc refresh page
5. ✅ Expected: Tự động refresh token, không bị logout
```

### ✅ Test 2: Access Token Expired
```
1. Login thành công
2. Đợi access token expire (hoặc modify expiry time)
3. Make API call
4. ✅ Expected: Auto refresh trước khi send request
```

### ✅ Test 3: Both Tokens Missing
```
1. Login thành công
2. Clear all localStorage
3. Clear all cookies (including refresh token)
4. Refresh page
5. ✅ Expected: Logout và redirect về login page
```

### ✅ Test 4: Refresh Token Expired
```
1. Login thành công
2. Xóa access token từ localStorage
3. Refresh token cookie đã expire
4. Attempt refresh
5. ✅ Expected: Logout vì không thể refresh
```

## Security Considerations

### ✅ Ưu điểm

1. **Better UX**: User không bị logout khi delete localStorage accidentally
2. **Seamless Session**: Auto-restore session from httpOnly cookie
3. **Multiple Fallbacks**: 3 layers of token refresh (init, interceptor, provider)

### ⚠️ Lưu ý

1. **Refresh Token Cookie** phải được set là `httpOnly`, `secure`, `sameSite`
2. Backend phải validate refresh token đúng cách
3. Nếu refresh token bị đánh cắp, attacker có thể duy trì session
   - Mitigation: Token rotation (refresh token thay đổi sau mỗi refresh)
   - Mitigation: Short refresh token lifetime
   - Mitigation: Device/IP binding

## Files Modified

1. ✅ `src/lib/api.ts`
   - Updated `initializeAuth()` - attempt refresh nếu không có access token
   - Updated `api.interceptors.request` - refresh before request nếu no token

2. ✅ `src/store/auth-provider.tsx`
   - Added `hasAttemptedRefreshRef` to prevent infinite loops
   - Added `checkForMissingToken` useEffect to detect và restore missing token

## Configuration

Không cần config gì thêm. Tất cả logic tự động:

```typescript
// Token refresh threshold (auto refresh khi còn < 3s)
const TOKEN_REFRESH_THRESHOLD = 3000; // ms

// AuthProvider intervals
const REFRESH_INTERVAL = 60 * 1000; // Check mỗi 60s
const REFRESH_THRESHOLD = 30 * 1000; // Refresh nếu còn < 30s
```

## Debugging

Enable debug logs:

```typescript
// In browser console
localStorage.debug = 'auth:*'

// Logs to watch:
// - "No access token found, attempting to refresh from cookie"
// - "Successfully refreshed token from cookie"
// - "✅ Successfully restored session from refresh token cookie"
```

## Rollback Plan

Nếu có vấn đề, comment out các đoạn code đã thêm:

```typescript
// In api.ts - request interceptor
// Comment out lines: "if (!accessToken && typeof window !== 'undefined') { ... }"

// In api.ts - initializeAuth
// Comment out lines: "if (!accessToken || !expiresAtStr) { ... }"

// In auth-provider.tsx
// Comment out entire "checkForMissingToken" useEffect
```

