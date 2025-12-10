# Hướng Dẫn Test API Job Postings

## Đã Cập Nhật

✅ **Đã chuyển sang sử dụng `api` instance từ `@/lib/api.ts`**
- Tự động có baseURL và headers
- Có authentication token nếu user đã đăng nhập
- Timeout 10 giây (thay vì 5 giây)
- Có withCredentials cho cookies

✅ **Đã thêm error handling theo pattern backend**
- Kiểm tra `code === 1000` cho success
- Hiển thị message lỗi từ backend
- Console log để debug

## Cách Test

### 1. Kiểm Tra Backend Có Chạy Không

Mở browser và vào:
```
http://localhost:8080/api/candidate/job-postings?page=0&size=10
```

**Nếu backend đang chạy:**
- Bạn sẽ thấy JSON response
- Hoặc redirect đến login (nếu cần authentication)

**Nếu backend KHÔNG chạy:**
- "This site can't be reached" hoặc timeout
- App sẽ tự động dùng mock data

### 2. Kiểm Tra Authentication

API này có thể yêu cầu user phải đăng nhập. Nếu vậy:

1. **Login trước:**
   - Vào trang login: `http://localhost:3001/login`
   - Đăng nhập với tài khoản candidate
   - Token sẽ được lưu vào localStorage

2. **Sau đó vào jobs-detail:**
   - `http://localhost:3001/(home)/jobs-detail`
   - API sẽ tự động gửi token trong header

### 3. Xem Console Logs

Mở **DevTools Console** (F12), bạn sẽ thấy:

**Nếu API thành công:**
```
✅ Job postings API response: { code: 1000, message: "...", result: {...} }
```

**Nếu API lỗi:**
```
❌ Job postings API error: { code: 4xx, message: "..." }
```

**Nếu dùng mock data:**
```
⚠️ API unavailable. Using mock data fallback.
Mock data (API unavailable)
```

## Tắt Mock Fallback Để Debug

Nếu muốn thấy lỗi API thực:

**File `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_USE_MOCK_FALLBACK=false
```

Restart server → Bạn sẽ thấy error message rõ ràng.

## Response Format Backend

Backend trả về:
```json
{
  "code": 1000,
  "message": "Job postings retrieved successfully",
  "result": {
    "content": [
      {
        "id": 1,
        "title": "Senior Frontend Developer",
        "description": "...",
        "address": "Ho Chi Minh City",
        "skills": [
          { "id": 1, "name": "React", "mustToHave": true }
        ],
        "recruiterInfo": {
          "recruiterId": 1,
          "companyName": "TechCorp",
          "logoUrl": "...",
          "about": "..."
        },
        ...
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 50,
    "totalPages": 5
  }
}
```

## Troubleshooting

### Lỗi: "Cannot read properties of undefined"
➡️ Backend trả về format khác, check console log response structure

### Lỗi: "Network Error"
➡️ Backend chưa chạy, mock data sẽ tự động được dùng (nếu enabled)

### Lỗi: 401 Unauthorized
➡️ Cần đăng nhập trước, hoặc API endpoint không yêu cầu auth (kiểm tra lại backend)

### Lỗi: 403 Forbidden
➡️ User hiện tại không có quyền candidate

### Mock data hiển thị nhưng backend đang chạy
➡️ Kiểm tra CORS hoặc network trong DevTools → Network tab

## Kiểm Tra API Hoạt Động

### Bước 1: Test API trực tiếp
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:8080/api/candidate/job-postings?page=0&size=10" -Method GET
```

### Bước 2: Test với authentication (nếu cần)
```bash
# Lấy token từ localStorage sau khi login
# Rồi test với curl/Postman kèm header:
# Authorization: Bearer YOUR_TOKEN
```

### Bước 3: Xem response
- Status 200 → OK
- Status 401 → Cần login
- Status 403 → Không có quyền
- Status 404 → Endpoint không tồn tại
- Status 500 → Lỗi server

## Next Steps

1. ✅ Khởi động backend server
2. ✅ Test API endpoint trực tiếp
3. ✅ Đăng nhập nếu cần authentication
4. ✅ Refresh trang jobs-detail
5. ✅ Kiểm tra console logs
6. ✅ Verify data hiển thị đúng
