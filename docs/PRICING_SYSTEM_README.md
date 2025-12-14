# 💳 Candidate Pricing & Payment System

## 📋 Tổng quan

Hệ thống chọn và thanh toán gói dịch vụ cho candidate với tích hợp VNPay payment gateway.

## 🗂️ Cấu trúc

```
src/
├── lib/
│   └── payment-api.ts          # API service cho payment
└── app/candidate/pricing/
    ├── page.tsx                # Trang chọn gói (FREE, PLUS, PREMIUM)
    ├── confirm/
    │   └── page.tsx            # Trang xác nhận mua gói
    ├── return/
    │   └── page.tsx            # Callback từ VNPay
    ├── success/
    │   └── page.tsx            # Trang thanh toán thành công
    └── failure/
        └── page.tsx            # Trang thanh toán thất bại
```

## 🎯 Flow

```
1. /candidate/pricing
   ↓ (Chọn gói: FREE/PLUS/PREMIUM)
   
2. /candidate/pricing/confirm?package=PREMIUM
   ↓ (Xem lại và xác nhận)
   
3. [VNPay Payment Gateway]
   ↓ (Thanh toán)
   
4. /candidate/pricing/return
   ↓ (Xử lý kết quả từ VNPay)
   
5a. /candidate/pricing/success?package=PREMIUM  (Thành công)
   hoặc
5b. /candidate/pricing/failure?package=PREMIUM  (Thất bại)
```

## 📦 Các gói dịch vụ

### FREE
- **Giá**: Miễn phí
- **Thời gian**: Vĩnh viễn
- **Tính năng**:
  - Basic profile
  - Apply to 5 jobs/month
  - Standard CV templates
  - Email support

### PLUS
- **Giá**: 99,000₫
- **Thời gian**: 1 tháng
- **Tính năng**:
  - Everything in FREE
  - Apply to 20 jobs/month
  - Premium CV templates
  - Priority support
  - AI Resume checker

### PREMIUM (Recommended)
- **Giá**: 199,000₫
- **Thời gian**: 1 tháng
- **Tính năng**:
  - Everything in PLUS
  - Unlimited job applications
  - All CV templates
  - 24/7 Premium support
  - Career coaching session
  - Profile boost

## 🔌 API Endpoints

### Create Payment URL
```typescript
POST /api/candidate-payment?packageName={packageName}

Response:
{
  "code": 200,
  "message": "success",
  "result": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
  }
}
```

## 🎨 Features

### Trang chọn gói (`/candidate/pricing`)
- ✅ Hiển thị 3 gói: FREE, PLUS, PREMIUM
- ✅ Gói FREE được chọn mặc định
- ✅ Highlight gói PREMIUM (Recommended)
- ✅ Visual feedback khi chọn gói (ring, scale, checkmark)
- ✅ Responsive design

### Trang xác nhận (`/candidate/pricing/confirm`)
- ✅ Hiển thị chi tiết gói đã chọn
- ✅ List tất cả features
- ✅ Thông tin phương thức thanh toán
- ✅ Button "Back" và "Confirm"
- ✅ Loading state khi xử lý thanh toán

### Trang xử lý callback (`/candidate/pricing/return`)
- ✅ Nhận parameters từ VNPay
- ✅ Parse response code
- ✅ Redirect đến success/failure page
- ✅ Loading spinner trong khi xử lý

### Trang thành công (`/candidate/pricing/success`)
- ✅ Confetti animation 🎉
- ✅ Success message
- ✅ Next steps guide
- ✅ Buttons: "Go to Dashboard", "View Profile"

### Trang thất bại (`/candidate/pricing/failure`)
- ✅ Error icon
- ✅ User-friendly error message
- ✅ Common reasons for failure
- ✅ Buttons: "Try Again", "Back to Plans"

## 🔐 VNPay Response Codes

| Code | Meaning |
|------|---------|
| 00 | Success |
| 07 | Transaction suspected of fraud |
| 09 | Card not registered for Internet Banking |
| 10 | Invalid card verification (3 times) |
| 11 | Payment timeout |
| 12 | Card is locked |
| 13 | Invalid OTP |
| 24 | Transaction cancelled |
| 51 | Insufficient balance |
| 65 | Daily limit exceeded |
| 75 | Bank under maintenance |
| 79 | Payment timeout |

## 🚀 Usage

### Điều hướng đến trang pricing
```typescript
router.push('/candidate/pricing');
```

### Trong component khác
```typescript
import { PACKAGES, createPaymentUrl, formatPrice } from '@/lib/payment-api';

// Lấy thông tin gói
const premiumPackage = PACKAGES.find(pkg => pkg.name === 'PREMIUM');

// Format giá
const price = formatPrice(199000); // "199.000₫"

// Tạo payment URL
const url = await createPaymentUrl('PREMIUM');
window.location.href = url;
```

## 📱 Responsive

- ✅ Mobile-first design
- ✅ Grid layout adapts từ 1 → 3 columns
- ✅ Touch-friendly buttons
- ✅ Readable text sizes

## 🎨 UI Components Used

- `@/components/ui/button` - Button component
- `react-icons/fi` - Feather icons
- `canvas-confetti` - Success animation
- `react-hot-toast` - Toast notifications

## 🔧 Configuration

### Backend URL Return
Backend cần set returnUrl trong API:
```
http://localhost:3000/candidate/pricing/return
```

hoặc production:
```
https://yourapp.com/candidate/pricing/return
```

## 📝 Notes

- Gói FREE không cần thanh toán, activate ngay lập tức
- VNPay sandbox URL: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- Response code `00` = success
- Tất cả prices đều tính bằng VND

## 🎯 Next Steps

1. Test flow hoàn chỉnh: chọn gói → xác nhận → thanh toán
2. Kiểm tra redirect từ VNPay về `/candidate/pricing/return`
3. Verify success/failure pages hiển thị đúng
4. Test responsive trên mobile
5. Test với các response codes khác nhau

## 🐛 Debugging

### Check payment URL
```typescript
console.log('Payment URL:', paymentUrl);
```

### Check VNPay callback params
```typescript
console.log('Response Code:', searchParams.get('vnp_ResponseCode'));
console.log('Order Info:', searchParams.get('vnp_OrderInfo'));
```

### Test locally
```bash
# Navigate to pricing page
http://localhost:3000/candidate/pricing

# Test success page directly
http://localhost:3000/candidate/pricing/success?package=PREMIUM

# Test failure page directly
http://localhost:3000/candidate/pricing/failure?package=PREMIUM&message=Payment%20failed
```

---

✅ **System ready!** Navigate to `/candidate/pricing` to start! 🎉
