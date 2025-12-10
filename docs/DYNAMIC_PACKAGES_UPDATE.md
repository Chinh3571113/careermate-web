# 🔄 Dynamic Packages Integration

## Tổng quan thay đổi

Hệ thống package payment đã được cập nhật để lấy thông tin gói từ backend API thay vì dùng hardcoded data.

## ✅ Những gì đã thay đổi

### 1. **payment-api.ts** - API Integration Layer

**Trước đây:**
```typescript
// Hardcoded packages
export const PACKAGES: Package[] = [
  {
    name: 'FREE',
    price: 0,
    duration: 'Forever',
    features: ['Basic profile', 'Apply to 5 jobs/month', ...]
  },
  // ...
];
```

**Bây giờ:**
```typescript
// Fetch from backend
export const fetchPackages = async (): Promise<Package[]> => {
  const response = await api.get('/api/package/candidate');
  return response.data.result;
};
```

**Thay đổi chi tiết:**

1. **New Interfaces:**
   ```typescript
   export interface Entitlement {
     name: string;          // "Apply Job"
     code: string;          // "APPLY_JOB"
     unit: string | null;   // "times/month", "CV", null
     hasLimit: boolean;     // true/false
     enabled: boolean;      // true/false
     limitValue: number;    // 5, 20, 0, etc.
   }

   export interface Package {
     name: PackageName;           // 'FREE' | 'PLUS' | 'PREMIUM'
     price: number;               // 0, 99000, 199000
     durationDays: number;        // 0, 30, 365
     entitlements: Entitlement[]; // Array of features
     recommended?: boolean;       // UI hint
   }
   ```

2. **New Functions:**
   - `fetchPackages()`: Fetch packages from `GET /api/package/candidate`
   - `formatPackageFeatures(entitlements)`: Convert entitlements to readable features
   - `formatDuration(days)`: Convert days to "Forever", "1 month", etc.

3. **Updated Functions:**
   - `getPackage(packages, name)`: Now requires packages array as parameter

### 2. **pricing/page.tsx** - Package Selection Page

**Changes:**
```typescript
// Old: Used hardcoded PACKAGES
import { PACKAGES } from "@/lib/payment-api";

// New: Fetch from backend
const [packages, setPackages] = useState<Package[]>([]);

useEffect(() => {
  const packagesData = await fetchPackages();
  setPackages(packagesData);
}, []);
```

**Display Features:**
```typescript
// Old: Hardcoded features array
{pkg.features.map(feature => ...)}

// New: Dynamic from entitlements
const features = formatPackageFeatures(pkg.entitlements);
{features.map(feature => ...)}
```

### 3. **pricing/confirm/page.tsx** - Payment Confirmation

**Changes:**
```typescript
// Old: Direct getPackage call
const selectedPackage = getPackage(packageName);

// New: Fetch packages first, then get selected
const [packages, setPackages] = useState<Package[]>([]);
const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

useEffect(() => {
  const packagesData = await fetchPackages();
  setPackages(packagesData);
  const pkg = getPackage(packagesData, packageName);
  setSelectedPackage(pkg);
}, []);
```

## 📊 API Response Format

### GET /api/package/candidate

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "result": [
    {
      "name": "FREE",
      "price": 0,
      "durationDays": 0,
      "entitlements": [
        {
          "name": "Apply Job",
          "code": "APPLY_JOB",
          "unit": "times/month",
          "hasLimit": true,
          "enabled": true,
          "limitValue": 5
        },
        {
          "name": "CV Builder",
          "code": "CV_BUILDER",
          "unit": "CV",
          "hasLimit": true,
          "enabled": true,
          "limitValue": 1
        }
      ]
    },
    {
      "name": "PLUS",
      "price": 99000,
      "durationDays": 30,
      "entitlements": [...]
    },
    {
      "name": "PREMIUM",
      "price": 199000,
      "durationDays": 30,
      "entitlements": [...]
    }
  ]
}
```

## 🎨 Feature Display Logic

### Entitlement → Feature String

```typescript
formatPackageFeatures(entitlements: Entitlement[]): string[] {
  return entitlements
    .filter(e => e.enabled)  // Only show enabled features
    .map(e => {
      if (e.hasLimit && e.limitValue > 0) {
        // "Apply Job: 5 times/month"
        return `${e.name}: ${e.limitValue} ${e.unit || ''}`;
      }
      // "Job Recommendation"
      return e.name;
    });
}
```

**Examples:**

| Entitlement Data | Display Output |
|------------------|----------------|
| `name: "Apply Job", limitValue: 5, unit: "times/month"` | **Apply Job: 5 times/month** |
| `name: "CV Builder", limitValue: 3, unit: "CV"` | **CV Builder: 3 CV** |
| `name: "Job Recommendation", hasLimit: false` | **Job Recommendation** |
| `name: "AI Analyzer", enabled: false` | *(not displayed)* |

## 🔄 Migration Benefits

### Before (Hardcoded)
❌ Phải update frontend code khi thay đổi packages  
❌ Không thể A/B test packages  
❌ Features list khác nhau giữa frontend/backend  
❌ Khó maintain khi có nhiều packages  

### After (Dynamic)
✅ Backend control packages hoàn toàn  
✅ Có thể update packages real-time  
✅ Single source of truth  
✅ Easy A/B testing  
✅ Consistent với backend  

## 🧪 Testing

### Test Dynamic Package Loading

1. **Start app:**
   ```bash
   npm run dev
   ```

2. **Visit pricing page:**
   ```
   http://localhost:3000/candidate/pricing
   ```

3. **Check console:**
   ```
   ✅ Should fetch packages from API
   ✅ Should display 3 packages (FREE, PLUS, PREMIUM)
   ✅ Should show dynamic features from entitlements
   ```

### Test Backend Package Changes

1. **Backend: Add new entitlement to PREMIUM package**
   ```json
   {
     "name": "Video Interview",
     "code": "VIDEO_INTERVIEW",
     "enabled": true,
     "limitValue": 0
   }
   ```

2. **Frontend: Refresh page**
   ```
   ✅ Should automatically show "Video Interview" in PREMIUM package
   ✅ No frontend code changes needed
   ```

### Test Error Handling

1. **Backend down:**
   ```
   ❌ Error: Failed to fetch packages
   ✅ Toast notification shown
   ✅ Loading state displayed
   ```

2. **Invalid package name in URL:**
   ```
   /candidate/pricing/confirm?package=INVALID
   ✅ Redirect to /candidate/pricing
   ✅ Error toast: "Please select a package first"
   ```

## 📝 Code Example

### Complete Flow

```typescript
// 1. User visits pricing page
const [packages, setPackages] = useState<Package[]>([]);

// 2. Fetch packages from backend
useEffect(() => {
  const packagesData = await fetchPackages();
  // [{ name: 'FREE', entitlements: [...] }, ...]
  setPackages(packagesData);
}, []);

// 3. Display packages
{packages.map(pkg => (
  <div key={pkg.name}>
    <h3>{pkg.name}</h3>
    <p>{formatPrice(pkg.price)}</p>
    <p>{formatDuration(pkg.durationDays)}</p>
    
    {/* Dynamic features */}
    <ul>
      {formatPackageFeatures(pkg.entitlements).map(feature => (
        <li>{feature}</li>
      ))}
    </ul>
  </div>
))}

// 4. User selects package
const handleSelect = (packageName: PackageName) => {
  router.push(`/candidate/pricing/confirm?package=${packageName}`);
};

// 5. Confirm page: Fetch packages again
const packagesData = await fetchPackages();
const selectedPackage = getPackage(packagesData, packageName);

// 6. Display confirmation
<h2>{selectedPackage.name}</h2>
<ul>
  {formatPackageFeatures(selectedPackage.entitlements).map(...)}
</ul>

// 7. Create payment
const paymentUrl = await createPaymentUrl(selectedPackage.name);
window.location.href = paymentUrl;
```

## 🚀 Next Steps

Backend team cần đảm bảo:

1. **API Endpoint Ready:**
   - ✅ `GET /api/package/candidate` trả về đúng format
   - ✅ Response includes all entitlements
   - ✅ Sorted order: FREE → PLUS → PREMIUM

2. **Entitlement Management:**
   - Có thể enable/disable features
   - Có thể update limit values
   - Có thể add/remove entitlements

3. **Package Updates:**
   - Update price → Frontend auto reflects
   - Update duration → Frontend auto reflects
   - Add new feature → Frontend auto displays

## 🔐 Security Notes

- ✅ Pricing data từ backend (can't be manipulated)
- ✅ Payment verification vẫn ở backend
- ✅ Frontend chỉ display, không validate price
- ✅ VNPay integration không thay đổi

## 📖 Documentation Links

- [Payment System README](../PRICING_SYSTEM_README.md)
- [Backend Implementation Guide](../PAYMENT_BACKEND_IMPLEMENTATION.md)
- [Backend Configuration](./PAYMENT_BACKEND_CONFIG.md)

---

**Updated:** November 24, 2025  
**Status:** ✅ Completed and tested
