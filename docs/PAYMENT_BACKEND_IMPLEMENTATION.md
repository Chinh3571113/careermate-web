# 🔧 Backend Implementation Required for Payment System

## ⚠️ Vấn đề hiện tại

Sau khi thanh toán thành công, user vẫn ở gói FREE vì:
1. Backend chưa lưu thông tin gói đã mua
2. Backend chưa cập nhật trạng thái user sau thanh toán
3. API kiểm tra status chưa được implement

## ✅ Backend cần implement các API sau:

### 1. Activate Package After Payment

**Endpoint**: `POST /api/candidate-payment/activate`

**Mục đích**: Kích hoạt gói sau khi thanh toán thành công

**Request Body**:
```json
{
  "packageName": "Premium",
  "transactionRef": "92682253",
  "amount": 99000,
  "paymentStatus": "SUCCESS"
}
```

**Response**:
```json
{
  "code": 200,
  "message": "Package activated successfully",
  "result": {
    "packageName": "Premium",
    "activatedAt": "2025-11-23T16:14:13",
    "expiryDate": "2025-12-23T16:14:13"
  }
}
```

**Implementation**:
```java
@PostMapping("/api/candidate-payment/activate")
public ResponseEntity<ActivateResponse> activatePackage(
    @RequestBody ActivateRequest request,
    @AuthenticationPrincipal UserDetails userDetails
) {
    // 1. Get current user
    User user = userService.findByEmail(userDetails.getUsername());
    
    // 2. Verify transaction (optional but recommended)
    if (!request.getPaymentStatus().equals("SUCCESS")) {
        throw new BadRequestException("Payment not successful");
    }
    
    // 3. Calculate expiry date based on package
    LocalDateTime expiryDate;
    if (request.getPackageName().equalsIgnoreCase("Plus")) {
        expiryDate = LocalDateTime.now().plusMonths(1);
    } else if (request.getPackageName().equalsIgnoreCase("Premium")) {
        expiryDate = LocalDateTime.now().plusMonths(1);
    } else {
        expiryDate = null; // FREE package never expires
    }
    
    // 4. Create or update user package record
    UserPackage userPackage = new UserPackage();
    userPackage.setUser(user);
    userPackage.setPackageName(request.getPackageName());
    userPackage.setActivatedAt(LocalDateTime.now());
    userPackage.setExpiryDate(expiryDate);
    userPackage.setTransactionRef(request.getTransactionRef());
    userPackage.setAmount(request.getAmount());
    userPackage.setStatus("ACTIVE");
    
    userPackageRepository.save(userPackage);
    
    // 5. Create payment history record
    PaymentHistory history = new PaymentHistory();
    history.setUser(user);
    history.setPackageName(request.getPackageName());
    history.setAmount(request.getAmount());
    history.setTransactionRef(request.getTransactionRef());
    history.setPaymentDate(LocalDateTime.now());
    history.setStatus("SUCCESS");
    
    paymentHistoryRepository.save(history);
    
    // 6. Return response
    return ResponseEntity.ok(new ActivateResponse(
        200,
        "Package activated successfully",
        new ActivateResult(
            request.getPackageName(),
            LocalDateTime.now(),
            expiryDate
        )
    ));
}
```

### 2. Check Package Status

**Endpoint**: `GET /api/candidate-payment/status`

**Mục đích**: Kiểm tra gói hiện tại của user

**Response**:
```json
{
  "code": 200,
  "message": "success",
  "result": {
    "hasActivePackage": true,
    "currentPackage": "Premium",
    "expiryDate": "2025-12-23T16:14:13",
    "canPurchase": false
  }
}
```

**Implementation**:
```java
@GetMapping("/api/candidate-payment/status")
public ResponseEntity<PackageStatusResponse> checkPackageStatus(
    @AuthenticationPrincipal UserDetails userDetails
) {
    // 1. Get current user
    User user = userService.findByEmail(userDetails.getUsername());
    
    // 2. Find active package
    UserPackage activePackage = userPackageRepository
        .findByUserAndStatus(user, "ACTIVE")
        .filter(pkg -> pkg.getExpiryDate() == null || 
                       pkg.getExpiryDate().isAfter(LocalDateTime.now()))
        .orElse(null);
    
    // 3. Build response
    if (activePackage != null) {
        return ResponseEntity.ok(new PackageStatusResponse(
            200,
            "success",
            new UserPackageStatus(
                true,
                activePackage.getPackageName(),
                activePackage.getExpiryDate(),
                false // Cannot purchase new package while one is active
            )
        ));
    } else {
        return ResponseEntity.ok(new PackageStatusResponse(
            200,
            "success",
            new UserPackageStatus(
                false,
                null,
                null,
                true // Can purchase package
            )
        ));
    }
}
```

### 3. Database Schema

**Table: `user_packages`**
```sql
CREATE TABLE user_packages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    package_name VARCHAR(50) NOT NULL,
    activated_at TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP,
    transaction_ref VARCHAR(100),
    amount DECIMAL(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_expiry (expiry_date)
);
```

**Table: `payment_history`**
```sql
CREATE TABLE payment_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    package_name VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    vnpay_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_transaction (transaction_ref)
);
```

## 🔄 Complete Flow After Implementation

```
1. User completes payment on VNPay
   ↓
2. VNPay redirects to: /api/candidate-payment/return?vnp_ResponseCode=00&...
   ↓
3. Frontend API route calls: POST /api/candidate-payment/activate
   ↓
4. Backend:
   - Saves user_packages record
   - Saves payment_history record
   - Returns success
   ↓
5. User redirected to success page
   ↓
6. When user visits /candidate/pricing again:
   - Frontend calls: GET /api/candidate-payment/status
   - Backend returns active package info
   - UI shows "Active Package" banner
   - Purchase button is disabled
```

## 🧪 Testing

### Test Package Activation
```bash
# After successful payment
POST http://localhost:8080/api/candidate-payment/activate
Authorization: Bearer {token}
Content-Type: application/json

{
  "packageName": "Premium",
  "transactionRef": "92682253",
  "amount": 199000,
  "paymentStatus": "SUCCESS"
}
```

### Test Status Check
```bash
GET http://localhost:8080/api/candidate-payment/status
Authorization: Bearer {token}
```

### Test Package Expiry
```sql
-- Check expired packages
SELECT * FROM user_packages 
WHERE expiry_date < NOW() AND status = 'ACTIVE';

-- Auto-expire old packages (run as cron job)
UPDATE user_packages 
SET status = 'EXPIRED' 
WHERE expiry_date < NOW() AND status = 'ACTIVE';
```

## 📋 Checklist

Backend tasks:
- [ ] Create `user_packages` table
- [ ] Create `payment_history` table
- [ ] Implement `POST /api/candidate-payment/activate`
- [ ] Implement `GET /api/candidate-payment/status`
- [ ] Add authentication to both endpoints
- [ ] Test package activation after payment
- [ ] Test status check with active package
- [ ] Setup cron job to expire old packages
- [ ] Add logging for all payment operations

Frontend (already done):
- [x] Call activate API from return route
- [x] Check status on pricing page load
- [x] Display active package banner
- [x] Disable purchase when package active
- [x] Show expiry date

## 🔐 Security Notes

1. **Verify Transaction**: Before activating, verify the transaction with VNPay using their verification API
2. **Prevent Duplicate**: Check if transaction_ref already exists before creating new record
3. **Authorization**: Ensure user can only activate package for themselves
4. **Amount Validation**: Verify the amount matches the package price

## 📞 Support

If you need help implementing these APIs, please contact the backend team with this documentation.

---

**Frontend Integration**: Already implemented in `/src/app/api/candidate-payment/return/route.ts`
