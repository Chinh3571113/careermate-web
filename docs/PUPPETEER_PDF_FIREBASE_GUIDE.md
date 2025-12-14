# 📄 Puppeteer PDF Export & Firebase Integration Guide

## 🎯 Tổng quan

Hệ thống xuất PDF cho CV sử dụng:
- **Puppeteer** (headless browser) để render HTML thành PDF chất lượng cao
- **Firebase Storage** để lưu trữ CV của người dùng
- **Next.js API Routes** để xử lý server-side

---

## 🏗️ Kiến trúc

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  CVPreview  │─────▶│ /api/export  │─────▶│   Puppeteer     │
│  Component  │      │    -pdf      │      │   (Chromium)    │
└─────────────┘      └──────────────┘      └─────────────────┘
       │                     │                      │
       │                     ▼                      ▼
       │              PDF Blob Response        PDF Generated
       │                     │                      
       ▼                     │                      
┌─────────────┐             │                      
│  Firebase   │◀────────────┘                      
│  Storage    │                                     
└─────────────┘                                     
```

---

## 📦 Các file đã tạo

### 1. API Route: `/src/app/api/export-pdf/route.ts`

**Chức năng:**
- Nhận HTML content từ client
- Sử dụng Puppeteer để render thành PDF
- Trả về PDF blob

**Cấu hình:**
- **Development**: Sử dụng Chrome local
- **Production**: Sử dụng @sparticuz/chromium (serverless-friendly)

**Input:**
```json
{
  "html": "<div>CV content...</div>",
  "fileName": "CV_Nguyen_Van_A_2025-11-12"
}
```

**Output:**
- PDF file (application/pdf)

---

### 2. Firebase Helper: `/src/lib/firebase-upload.ts`

**Function mới:** `uploadCVPDF()`

```typescript
uploadCVPDF(
  userId: string,
  pdfBlob: Blob,
  customFileName?: string
): Promise<string>
```

**Chức năng:**
- Upload PDF blob lên Firebase Storage
- Path: `/careermate-files/candidates/{userId}/cv/{timestamp}_{fileName}.pdf`
- Trả về: Download URL

**Metadata:**
- `contentType`: application/pdf
- `uploadedAt`: ISO timestamp
- `type`: "generated-cv"

---

### 3. Component Update: `/src/components/cv/CVPreview.tsx`

**Thêm:**
- Import `useAuthStore` để lấy userId
- Function `handleExportAndSavePDF()` - xuất PDF và lưu Firebase
- Button "Lưu CV vào Firebase" trong toolbar

**Flow:**
1. User click "Lưu CV vào Firebase"
2. Kiểm tra authentication
3. Get HTML content từ `.cv-container`
4. Call API `/api/export-pdf` với HTML
5. Nhận PDF blob
6. Upload lên Firebase
7. Hiển thị toast success với download URL
8. Auto download PDF về local

---

## 🔐 Firebase Security Rules

CV được lưu trong path riêng tư:

```
/careermate-files/candidates/{userId}/cv/
```

**Rules:**
- ✅ Owner có thể read/write
- ❌ Người khác không thể truy cập

Xem chi tiết: `README_FIREBASE_STORAGE.md`

---

## 🚀 Cách sử dụng

### Từ UI:

1. Mở CV template page
2. Chỉnh sửa CV data
3. Click "Lưu CV vào Firebase"
4. Chờ toast "CV đã được lưu thành công"
5. File PDF sẽ được:
   - Upload lên Firebase Storage
   - Download về máy local

### Programmatic:

```typescript
import { uploadCVPDF } from "@/lib/firebase-upload";

// Generate PDF
const response = await fetch("/api/export-pdf", {
  method: "POST",
  body: JSON.stringify({ html: htmlContent, fileName: "my-cv" })
});

const pdfBlob = await response.blob();

// Upload to Firebase
const downloadURL = await uploadCVPDF(userId, pdfBlob, "CV_Fullname");

console.log("CV saved:", downloadURL);
```

---

## 🧪 Testing

### Local Development:

1. **Cài Chrome** (nếu chưa có)
2. Run dev server: `npm run dev`
3. Mở CV template page
4. Click "Lưu CV vào Firebase"

**Expected:**
- ✅ PDF được tạo và download
- ✅ Toast hiển thị progress
- ✅ Console log Firebase URL

### Production:

**Vercel/Deploy:**
- @sparticuz/chromium sẽ tự động được sử dụng
- Memory: Đảm bảo ≥1GB RAM cho Puppeteer
- Timeout: Set ≥30s cho PDF generation

---

## ⚙️ Cấu hình

### Chrome Path (Development):

Trong `route.ts`, path Chrome đã được config cho:
- ✅ Windows: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`
- ✅ macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- ✅ Linux: `/usr/bin/google-chrome`

Nếu Chrome ở vị trí khác, update `executablePath` trong code.

### PDF Options:

```typescript
pdf.pdf({
  format: "A4",
  printBackground: true,
  margin: {
    top: "10mm",
    bottom: "10mm",
    left: "10mm",
    right: "10mm",
  },
  scale: 1,
})
```

---

## 📊 File Structure

```
/careermate-files/
 └── candidates/
      └── {userId}/
           └── cv/
                ├── 1731398400000_CV_Nguyen_Van_A.pdf
                ├── 1731398500000_CV_Nguyen_Van_A.pdf
                └── ...
```

**Naming Convention:**
- `{timestamp}_{customFileName}.pdf`
- Timestamp: Unix milliseconds
- CustomFileName: User's full name (sanitized)

---

## 🐛 Troubleshooting

### Error: "Failed to launch browser"

**Local:**
- Kiểm tra Chrome đã cài đặt
- Verify path trong code

**Production:**
- Check memory limits (Vercel: upgrade plan nếu cần)
- Xem logs: `console.log` trong route.ts

### Error: "Firebase upload failed"

- Kiểm tra Firebase config
- Verify security rules
- Check userId có hợp lệ không

### PDF trống hoặc không đúng layout

- Kiểm tra CSS in `.cv-container`
- Test với `printBackground: true`
- Thử adjust viewport size

---

## 🎨 Customization

### Thay đổi PDF options:

Edit `/src/app/api/export-pdf/route.ts`:

```typescript
const pdfBuffer = await page.pdf({
  format: "A4", // or "Letter"
  landscape: false, // or true
  margin: { ... },
  scale: 0.9, // zoom in/out
});
```

### Thêm watermark hoặc header/footer:

```typescript
const styledHtml = `
  <html>
    <head>
      <style>
        @page {
          margin-top: 30mm;
        }
        header { position: fixed; top: 0; }
      </style>
    </head>
    <body>
      <header>Watermark here</header>
      ${html}
    </body>
  </html>
`;
```

---

## 📈 Future Enhancements

- [ ] Hỗ trợ multiple templates với layout riêng
- [ ] Auto cleanup old CVs (giữ max 5 files)
- [ ] Compress PDF để giảm size
- [ ] Preview PDF trước khi lưu
- [ ] Share CV link (public URL với expiry time)
- [ ] Email CV trực tiếp cho recruiter

---

## 🔗 Liên quan

- [Firebase Storage Setup](./README_FIREBASE_STORAGE.md)
- [Puppeteer Docs](https://pptr.dev/)
- [@sparticuz/chromium](https://github.com/Sparticuz/chromium)

---

## ✅ Checklist Deploy

Trước khi deploy production:

- [ ] Firebase Security Rules đã apply
- [ ] Environment variables đã set (Firebase config)
- [ ] Test local với Chrome
- [ ] Test upload Firebase
- [ ] Verify auth integration (userId)
- [ ] Check memory limits (≥1GB)
- [ ] Set API timeout ≥30s

---

**Maintainer:** CareerMate Team  
**Last Updated:** 2025-11-12
