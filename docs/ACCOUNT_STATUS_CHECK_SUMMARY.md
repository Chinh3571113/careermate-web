# Account Status Check Implementation Summary

## Overview
Đã triển khai chức năng kiểm tra trạng thái tài khoản recruiter ngay khi đăng nhập (cả đăng nhập thông thường và đăng nhập bằng Google OAuth). Hệ thống sẽ hiển thị thông báo phù hợp dựa trên trạng thái tài khoản và cho phép recruiter gửi lại thông tin doanh nghiệp nếu bị từ chối.

## Features

### 1. **Kiểm Tra Trạng Thái Khi Đăng Nhập Thông Thường**
   - Hook: `use-sign-in-hooks.ts`
   - Sau khi đăng nhập thành công, nếu user là RECRUITER, hệ thống sẽ gọi API `GET /api/recruiter/my-profile` để lấy thông tin
   - Xử lý 3 trường hợp:

#### a) **REJECTED** (Bị từ chối)
   - Hiển thị toast error với lý do từ chối
   - Redirect đến `/auth/account-rejected?reason={rejectionReason}`
   - Trang account-rejected hiển thị:
     - Lý do từ chối cụ thể
     - Nút "Cập nhật thông tin doanh nghiệp" để gửi lại
     - Form cập nhật organization với API `PUT /api/recruiter/update-organization`

#### b) **PENDING** (Đang chờ duyệt)
   - Hiển thị toast thông báo: "Tài khoản đang chờ phê duyệt. Vui lòng chờ chúng tôi xác nhận và sẽ thông báo lại sau."
   - Redirect đến `/auth/account-pending`
   - Trang hiển thị thông tin:
     - Thời gian xét duyệt: 1-3 ngày làm việc
     - Sẽ nhận email thông báo
     - Nút về trang chủ hoặc đăng nhập lại

#### c) **APPROVED / ACTIVE** (Đã duyệt)
   - Tiếp tục flow đăng nhập bình thường
   - Redirect đến trang recruiter dashboard

### 2. **Kiểm Tra Trạng Thái Khi Đăng Nhập Bằng Google OAuth**
   - File: `oauth-callback/page.tsx`
   - Backend đã trả về các query parameters:
     - `account_status`: PENDING, APPROVED, ACTIVE, REJECTED
     - `rejection_reason` / `reject_reason`: Lý do từ chối (nếu có)
   - Xử lý tương tự như đăng nhập thông thường

### 3. **Trang Account Rejected với Form Gửi Lại**
   - Location: `/auth/account-rejected`
   - Features:
     - Hiển thị lý do từ chối từ query param `?reason=...`
     - Sử dụng component `OrganizationUpdateForm` để nhập lại thông tin
     - Gọi API `PUT /api/recruiter/update-organization` với request body:
       ```typescript
       {
         companyName: string;
         website?: string;
         logoUrl?: string;
         businessLicense: string;
         contactPerson: string;
         phoneNumber: string;
         companyAddress: string;
         about?: string;
       }
       ```
   - Sau khi gửi thành công, redirect đến `/pending-approval-confirmation`

### 4. **Trang Account Pending**
   - Location: `/auth/account-pending`
   - Features:
     - Hiển thị thông báo chờ duyệt
     - Thông tin về thời gian xét duyệt
     - Auto-redirect về `/sign-in` sau 12 giây

## API Integration

### 1. **GET /api/recruiter/my-profile**
**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": {
    "recruiterId": 37,
    "accountId": 84,
    "email": "htqnhat7@gmail.com",
    "username": "Nhat7",
    "companyName": "FPT",
    "website": "https://fptsoftware.com",
    "logoUrl": "...",
    "about": "Tech",
    "rating": 0,
    "businessLicense": "BL-2025-123456",
    "contactPerson": "Nhật Huỳnh",
    "phoneNumber": "0929076985",
    "companyAddress": "FTown 1",
    "accountStatus": "REJECTED",
    "accountRole": "RECRUITER",
    "verificationStatus": "REJECTED",
    "rejectionReason": "Không thích hợp"
  }
}
```

### 2. **PUT /api/recruiter/update-organization**
**Request Body:**
```typescript
{
  companyName: string;
  website?: string;
  logoUrl?: string;
  businessLicense: string;
  contactPerson: string;
  phoneNumber: string;
  companyAddress: string;
  about?: string;
}
```

## Files Modified/Created

### Modified Files:
1. **`src/lib/recruiter-api.ts`**
   - Thêm interface `RecruiterProfile` và `RecruiterProfileResponse`
   - Thêm function `getMyRecruiterProfile()` để gọi API lấy profile

2. **`src/modules/client/auth/hooks/use-sign-in-hooks.ts`**
   - Import `getMyRecruiterProfile` từ recruiter-api
   - Thêm logic kiểm tra account status sau khi đăng nhập thành công
   - Xử lý 3 trường hợp: REJECTED, PENDING, APPROVED/ACTIVE

3. **`src/app/oauth-callback/page.tsx`**
   - Cập nhật thông báo toast sang tiếng Việt
   - Thêm log cho `rejectReason` để debug
   - Cải thiện thông báo lỗi

4. **`src/app/auth/account-pending/page.tsx`**
   - Cải thiện UI với icon và styling
   - Thêm thông tin chi tiết về thời gian xét duyệt
   - Cải thiện UX với các nút action rõ ràng

### Existing Files (Already Created):
1. **`src/app/auth/account-rejected/page.tsx`**
   - Sử dụng `OrganizationUpdateForm` component
   - Hiển thị lý do từ chối
   - Cho phép gửi lại thông tin

2. **`src/components/auth/OrganizationUpdateForm.tsx`**
   - Form component tái sử dụng
   - Validation với Zod schema
   - Integration với API update-organization

## User Flow

### Flow 1: Đăng Nhập Thông Thường (Email/Password)
```
1. User nhập email/password
2. Submit form → call login API
3. Login thành công → lưu token
4. Nếu role = RECRUITER:
   a. Gọi getMyRecruiterProfile()
   b. Kiểm tra accountStatus:
      - REJECTED → redirect /auth/account-rejected (có thể gửi lại)
      - PENDING → redirect /auth/account-pending (chờ duyệt)
      - APPROVED/ACTIVE → redirect /recruiter/... (dashboard)
5. Nếu role khác → redirect theo role
```

### Flow 2: Đăng Nhập Bằng Google
```
1. User click "Sign in with Google"
2. OAuth flow → redirect về /oauth-callback với params
3. Parse query params: account_status, rejection_reason, etc.
4. Nếu accountType = "recruiter":
   a. PENDING → redirect /auth/account-pending
   b. REJECTED → redirect /auth/account-rejected?reason=...
   c. ACTIVE/APPROVED → redirect /auth/oauth/success (set tokens)
5. Nếu không phải recruiter → redirect /auth/oauth/success
```

### Flow 3: Gửi Lại Thông Tin (Resubmission)
```
1. User ở trang /auth/account-rejected
2. Click "Cập nhật thông tin doanh nghiệp"
3. Điền form với thông tin mới
4. Submit → call PUT /api/recruiter/update-organization
5. Thành công → redirect /pending-approval-confirmation
6. User chờ admin xét duyệt lại
```

## Testing Scenarios

### Test Case 1: Login với Account REJECTED
**Steps:**
1. Đăng nhập với tài khoản recruiter bị từ chối
2. Verify toast hiển thị lý do từ chối
3. Verify redirect đến `/auth/account-rejected`
4. Verify lý do từ chối hiển thị đúng
5. Click "Cập nhật thông tin doanh nghiệp"
6. Điền form và submit
7. Verify API call thành công
8. Verify redirect đến pending confirmation

### Test Case 2: Login với Account PENDING
**Steps:**
1. Đăng nhập với tài khoản recruiter đang chờ duyệt
2. Verify toast hiển thị thông báo chờ duyệt
3. Verify redirect đến `/auth/account-pending`
4. Verify thông tin hiển thị đầy đủ
5. Verify auto-redirect sau 12 giây

### Test Case 3: Login với Account ACTIVE
**Steps:**
1. Đăng nhập với tài khoản recruiter đã được duyệt
2. Verify không có toast error
3. Verify redirect đến recruiter dashboard
4. Verify user có thể truy cập các chức năng recruiter

### Test Case 4: OAuth Login với Account REJECTED
**Steps:**
1. Click "Sign in with Google"
2. Hoàn thành OAuth flow với account rejected
3. Verify redirect về `/oauth-callback`
4. Verify parse rejection_reason từ query params
5. Verify redirect đến `/auth/account-rejected` với reason
6. Verify lý do hiển thị đúng

## Error Handling

1. **Lỗi khi gọi getMyRecruiterProfile():**
   - Log error nhưng không block login
   - User vẫn được redirect theo role bình thường
   - Admin có thể check logs để debug

2. **Lỗi khi submit update-organization:**
   - Hiển thị toast error với message từ API
   - Form không bị clear, user có thể sửa và submit lại
   - Validation errors hiển thị dưới từng field

3. **Missing query params trong OAuth callback:**
   - Default values để tránh crash
   - Log warning để debug
   - Redirect đến error page với message rõ ràng

## Security Considerations

1. **Token Management:**
   - Access token được store trong localStorage
   - Refresh token được store trong HTTP-only cookie
   - Token được decode để lấy role, không lưu role riêng

2. **API Authorization:**
   - API `/api/recruiter/my-profile` chỉ trả về thông tin của user hiện tại
   - API `/api/recruiter/update-organization` cũng chỉ update cho user hiện tại
   - Backend verify JWT token cho mọi request

3. **XSS Prevention:**
   - Rejection reason được sanitized trước khi hiển thị
   - Form inputs có validation để tránh malicious content

## UI/UX Improvements

1. **Toast Messages:**
   - Sử dụng tiếng Việt cho tất cả thông báo
   - Error toast màu đỏ, Success toast màu xanh, Info toast màu vàng
   - Auto-dismiss sau 3-5 giây

2. **Page Layouts:**
   - Consistent styling với màu sắc và icon phù hợp
   - Responsive design cho mobile và desktop
   - Clear call-to-action buttons

3. **Loading States:**
   - Spinner khi đang process OAuth callback
   - Form submit button disabled khi đang gửi
   - Skeleton screens nếu cần

## Future Enhancements

1. **Email Notifications:**
   - Gửi email khi account được approve/reject
   - Template email chuyên nghiệp
   - Link trực tiếp đến trang resubmission nếu rejected

2. **Admin Dashboard:**
   - Notification khi có recruiter resubmit
   - History của các lần submit
   - Comments/notes từ admin về lý do từ chối

3. **Real-time Updates:**
   - WebSocket để notify user khi status thay đổi
   - Không cần đăng nhập lại để biết status mới

## Conclusion

Chức năng kiểm tra account status đã được triển khai đầy đủ cho cả đăng nhập thông thường và OAuth. User experience được cải thiện với thông báo rõ ràng và flow resubmission thuận tiện. Hệ thống đảm bảo security và error handling tốt.
