# 🚀 Quick Migration Script

## Run These Commands:

### 1. Set Environment Variable

```bash
# Add to .env.local
echo "NEXT_PUBLIC_BASE_URL=http://localhost:3000" >> .env.local
```

### 2. Test Print Routes

```bash
# Start dev server
npm run dev

# Open these URLs in browser:
# http://localhost:3000/candidate/cv/print/classic?id=test
# http://localhost:3000/candidate/cv/print/modern?id=test
# http://localhost:3000/candidate/cv/print/professional?id=test

# You should see print-optimized CV pages
```

### 3. Test New Export API

```bash
# Test the new export API endpoint
curl -X POST http://localhost:3000/candidate/cv/api/export-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "cvId": "test123",
    "templateId": "modern",
    "fileName": "test-cv.pdf"
  }' \
  --output test-cv.pdf

# Open test-cv.pdf to verify
```

---

## 📝 Code Changes Needed

### File 1: `src/components/cv/CVPreview.tsx`

**Location:** Line ~635

**Change:**
```typescript
// FIND THIS:
const response = await fetch("/api/export-pdf", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    html: htmlContent,
    fileName: fileName,
  }),
});

// REPLACE WITH:
const response = await fetch("/candidate/cv/api/export-pdf", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    cvId: "YOUR_CV_ID_HERE",  // TODO: Get from saved CV
    templateId: "modern",      // TODO: Use selected template
    fileName: fileName,
  }),
});
```

---

### File 2: `src/app/candidate/cv/print/[templateId]/page.tsx`

**Location:** Line ~45

**Change:**
```typescript
// FIND THIS:
async function getCVData(cvId: string): Promise<CVData | null> {
  try {
    // TODO: Replace with your actual API endpoint
    // const response = await fetch(...);
    
    // Mock data for demonstration
    return {
      fullName: "John Doe",
      // ... mock data
    };
  } catch (error) {
    return null;
  }
}

// REPLACE WITH:
async function getCVData(cvId: string): Promise<CVData | null> {
  try {
    // ✅ YOUR ACTUAL API ENDPOINT
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cv/${cvId}`,
      {
        cache: 'no-store',
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Map your data structure to CVData
    return {
      fullName: data.personalInfo?.fullName || '',
      title: data.personalInfo?.title || '',
      email: data.personalInfo?.email || '',
      phone: data.personalInfo?.phone || '',
      // ... map all other fields
    };
  } catch (error) {
    console.error('Failed to fetch CV:', error);
    return null;
  }
}
```

---

## 🔧 Complete Refactored Function

Copy this entire function to replace your `handleExportAndSavePDF`:

```typescript
const handleExportAndSavePDF = async (userId?: string) => {
  if (isDownloading) return;

  if (!userId) {
    toast.error("Bạn cần đăng nhập để lưu CV");
    return;
  }

  setIsDownloading(true);

  try {
    // Step 1: Save CV to database (implement this)
    toast.loading("Đang lưu CV...");
    
    // TODO: Implement this function to save CV to your database
    // const cvId = await saveCVToDatabase(cvData, userId);
    // For now, use a temporary ID or fetch existing CV ID
    const cvId = "temp-cv-id"; // Replace with actual CV ID
    
    if (!cvId) {
      throw new Error("Failed to save CV data");
    }

    // Step 2: Generate filename
    const fullName = cvData.personalInfo.fullName || "CV";
    const cleanName = fullName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `CV_${cleanName}_${new Date().toISOString().split("T")[0]}`;

    toast.dismiss();
    toast.loading("Đang tạo PDF...");

    // Step 3: Call NEW export API
    const response = await fetch("/candidate/cv/api/export-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cvId: cvId,
        templateId: selectedTemplate || "modern", // Add selectedTemplate state
        fileName: fileName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ API Error:", errorData);
      throw new Error(errorData.message || "Failed to generate PDF");
    }

    toast.dismiss();
    toast.loading("Đang lưu CV lên Firebase...");

    // Step 4: Get PDF blob
    const pdfBlob = await response.blob();

    // Step 5: Upload to Firebase
    const downloadURL = await uploadCVPDF(userId, pdfBlob, cleanName);

    toast.dismiss();
    toast.success("CV đã được lưu thành công!");

    console.log("✅ CV saved to Firebase:", downloadURL);

    // Step 6: Download to local
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);

    return downloadURL;
  } catch (error) {
    console.error("❌ Error exporting and saving PDF:", error);
    toast.dismiss();
    toast.error(
      error instanceof Error ? error.message : "Không thể xuất và lưu CV"
    );
  } finally {
    setIsDownloading(false);
  }
};
```

---

## ✅ Verification Steps

### 1. Test Print Pages Work
```bash
✓ Visit: http://localhost:3000/candidate/cv/print/modern?id=test
✓ Should see: Print-optimized CV page
✓ No errors in console
```

### 2. Test Export API Works
```bash
✓ Call API with curl (see above)
✓ PDF file created
✓ Open PDF - should show CV content
✓ Colors preserved
✓ Fonts render correctly
```

### 3. Test from UI
```bash
✓ Click "Lưu CV vào Firebase" button
✓ Toast shows progress
✓ PDF downloads
✓ Firebase upload succeeds
✓ No console errors
```

---

## 🐛 Common Issues & Fixes

### Issue: "Failed to navigate to print page"

**Fix:**
```bash
# Check .env.local has:
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

### Issue: "CV Not Found" in print page

**Fix:**
Update `getCVData()` to fetch from your API (see File 2 above)

---

### Issue: "Invalid template ID"

**Fix:**
```typescript
// Ensure template ID is one of:
templateId: "classic" | "modern" | "professional"
```

---

### Issue: PDF is blank

**Fix:**
1. Test print page in browser first
2. Check console logs in API route
3. Verify `waitUntil: "networkidle0"` in goto()

---

## 📊 Migration Status

Track your progress:

- [ ] Set `NEXT_PUBLIC_BASE_URL` environment variable
- [ ] Test print pages in browser
- [ ] Test export API with curl
- [ ] Add `selectedTemplate` state to CVPreview
- [ ] Implement `saveCVToDatabase()` function
- [ ] Update `handleExportAndSavePDF()` function
- [ ] Update `getCVData()` in print page
- [ ] Test export from UI
- [ ] Verify PDF quality (fonts, colors, layout)
- [ ] Test Firebase upload
- [ ] Delete old `/api/export-pdf` route (optional)

---

## 🎉 Done!

After completing these steps:
- ✅ No more style injection issues
- ✅ Fonts load perfectly
- ✅ Colors preserved
- ✅ Clean, maintainable code
- ✅ Production-ready

---

**Need help?** Check:
- `PDF_EXPORT_REFACTORING_GUIDE.md` (detailed guide)
- `CV_PRINT_ARCHITECTURE.md` (complete documentation)
- `CV_PRINT_QUICK_START.md` (quick start guide)
