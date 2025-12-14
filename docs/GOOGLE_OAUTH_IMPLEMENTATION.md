# 🔐 Google OAuth Integration - Implementation Guide

## ✅ Đã Hoàn Thành

### 📁 Files Created/Modified:

1. **GoogleOAuthButton.tsx** - Component button đăng nhập Google
2. **OAuth Callback Route** - `/auth/oauth/callback/route.ts`
3. **OAuth Success Page** - `/auth/oauth/success/page.tsx`
4. **Complete Recruiter Page** - `/auth/oauth/complete-recruiter/page.tsx`
5. **Pending Approval Page** - `/auth/oauth/pending-approval/page.tsx`
6. **OAuth Error Page** - `/auth/oauth/error/page.tsx`
7. **Sign Up Forms** - Added Google OAuth buttons to both Candidate and Recruiter forms

---

## 🚀 Cách Sử Dụng

### 1. **Candidate Sign Up với Google**

**URL**: `http://localhost:3000/sign-up-candidate`

**Flow**:
```
User clicks "Sign up with Google"
    ↓
Redirects to: http://localhost:8080/api/oauth2/google/login?account_type=candidate
    ↓
Google OAuth authentication
    ↓
Backend creates CANDIDATE account with ACTIVE status
    ↓
Redirects to: /auth/oauth/success?token=...&email=...
    ↓
Frontend stores token and redirects to homepage
```

**Kết quả**:
- ✅ Account created với role CANDIDATE
- ✅ Status = ACTIVE (có thể login ngay)
- ✅ Tự động redirect về trang chủ

---

### 2. **Recruiter Sign Up với Google**

**URL**: `http://localhost:3000/sign-up-recruiter`

**Flow**:
```
User clicks "Sign up with Google (Recruiter)"
    ↓
Redirects to: http://localhost:8080/api/oauth2/google/login?account_type=recruiter
    ↓
Google OAuth authentication
    ↓
Backend creates RECRUITER account with PENDING status
    ↓
Redirects to: /auth/oauth/complete-recruiter?email=...
    ↓
User fills organization form (Company info)
    ↓
POST: /api/oauth2/recruiter/complete-registration
    ↓
Redirects to: /auth/oauth/pending-approval
    ↓
Wait for admin approval
```

**Kết quả**:
- ✅ Account created với role RECRUITER
- ✅ Status = PENDING (cần admin approve)
- ✅ Company info được lưu vào database
- ✅ User nhận email thông báo khi được approve

---

## 🔧 Technical Details

### Environment Variables

Thêm vào `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Backend Endpoints Used

1. **Initiate OAuth**:
   ```
   GET /api/oauth2/google/login?account_type={candidate|recruiter}
   ```

2. **Get OAuth Result**:
   ```
   GET /api/oauth2/google/success
   ```

3. **Complete Recruiter Registration**:
   ```
   POST /api/oauth2/recruiter/complete-registration
   ```

### Session Management

- **Session Cookie**: `JSESSIONID`
- **Duration**: 30 minutes
- **Used for**: Complete recruiter registration
- **Auto-sent**: với `credentials: 'include'`

---

## 📊 Data Flow Diagram

### Candidate Registration:
```
┌─────────────────┐
│  Click Google   │
│  OAuth Button   │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│  Backend OAuth Handler  │
│  - Creates Account      │
│  - Role: CANDIDATE      │
│  - Status: ACTIVE       │
└────────┬────────────────┘
         │
         ↓
┌─────────────────┐
│  Get Token      │
│  /oauth/success │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Store Token    │
│  Redirect Home  │
└─────────────────┘
```

### Recruiter Registration:
```
┌─────────────────┐
│  Click Google   │
│  OAuth Button   │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│  Backend OAuth Handler  │
│  - Creates Account      │
│  - Role: RECRUITER      │
│  - Status: PENDING      │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────┐
│  Complete Org Form  │
│  /oauth/complete-   │
│   recruiter         │
└────────┬────────────┘
         │
         ↓
┌─────────────────────┐
│  POST Org Info      │
│  with Session       │
└────────┬────────────┘
         │
         ↓
┌─────────────────────┐
│  Pending Approval   │
│  Wait for Admin     │
└─────────────────────┘
```

---

## 🧪 Testing

### Test Candidate Registration:

1. Go to: `http://localhost:3000/sign-up-candidate`
2. Click "Sign up with Google"
3. Authenticate with Google
4. Should redirect to homepage with token
5. Check database:
   ```sql
   SELECT * FROM account WHERE email = 'your-email@gmail.com';
   -- Expected: status='ACTIVE', password='GOOGLE_LOGIN'
   ```

### Test Recruiter Registration:

1. Go to: `http://localhost:3000/sign-up-recruiter`
2. Click "Sign up with Google (Recruiter)"
3. Authenticate with Google
4. Should redirect to organization form
5. Fill company information
6. Click "Complete Registration"
7. Should show pending approval page
8. Check database:
   ```sql
   SELECT * FROM account WHERE email = 'your-email@gmail.com';
   -- Expected: status='PENDING'
   
   SELECT * FROM recruiters WHERE account_id = (
     SELECT id FROM account WHERE email = 'your-email@gmail.com'
   );
   -- Expected: company info populated
   ```

---

## 🛡️ Security Features

1. **HttpOnly Cookie**: Session cookie không thể truy cập từ JavaScript
2. **CORS**: Backend chỉ chấp nhận requests từ localhost:3000
3. **Session Timeout**: 30 minutes để complete registration
4. **No Token Storage**: Không lưu refresh token trong localStorage
5. **JWT Validation**: Token được decode và validate trước khi sử dụng

---

## ⚠️ Important Notes

### Session Expiry:
- User có **30 phút** để complete organization form
- Nếu hết hạn: phải login lại với Google

### Admin Approval:
- Recruiter accounts cần admin approve
- Status: PENDING → ACTIVE
- User nhận email notification khi approved

### Error Handling:
- Network errors → redirect to error page
- Session expired → redirect to login với message
- Invalid data → show validation errors

---

## 🐛 Troubleshooting

### Problem: "Session expired"
**Solution**: 
- Complete form trong 30 phút
- Hoặc login lại với Google

### Problem: OAuth redirect không hoạt động
**Solution**:
- Check backend đang chạy: `http://localhost:8080`
- Check CORS settings trong backend
- Check `NEXT_PUBLIC_API_URL` trong `.env.local`

### Problem: Token không được lưu
**Solution**:
- Check browser console cho errors
- Verify JWT token format
- Check `setAuthFromTokens` được gọi

---

## 📝 Next Steps

1. **Production Setup**:
   - Update `NEXT_PUBLIC_API_URL` to production URL
   - Configure Google OAuth redirect URIs
   - Enable HTTPS

2. **Email Notifications**:
   - Setup email service cho pending approval
   - Send welcome emails

3. **Admin Dashboard**:
   - Create page để approve pending recruiters
   - View và manage recruiter applications

---

## 📞 Support

Nếu có vấn đề:
1. Check browser console logs (🔵 for info, ❌ for errors)
2. Check network tab để xem API requests
3. Verify backend đang chạy và accessible

---

**Last Updated**: October 30, 2025
**Frontend**: Next.js 14+
**Backend**: Spring Boot 3.5.6
