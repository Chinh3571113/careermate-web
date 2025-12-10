# 🔥 Firebase Storage Upload Utility - CV Files

## 📋 Overview

Utility để upload CV files lên Firebase Storage với format tên file: `[originalName]_CM_[timestamp].[ext]`

## 🎯 File Naming Convention

### Upload Format
```
Original: CV.pdf
Storage:  CV_CM_1732702341123.pdf
Path:     candidates/123/CV_CM_1732702341123.pdf
```

### Display Format
Khi hiển thị trên UI, extract lại tên gốc:
```
Storage:  CV_CM_1732702341123.pdf
Display:  CV.pdf
```

## 📁 File Structure

```
src/
├── utils/
│   └── cvFileNameHelper.ts      # Helper functions for file naming
└── services/
    └── cvStorageUpload.ts       # Firebase upload utility
```

## 🚀 Usage

### 1. Upload Single File

```typescript
import { uploadCvFile } from '@/services/cvStorageUpload';

// Upload file
const result = await uploadCvFile(candidateId, file);

console.log(result);
// {
//   originalName: "CV.pdf",
//   storageName: "CV_CM_1732702341123.pdf",
//   downloadUrl: "https://firebasestorage.googleapis.com/...",
//   fullPath: "candidates/123/CV_CM_1732702341123.pdf",
//   extension: "pdf",
//   size: 1234567,
//   contentType: "application/pdf",
//   uploadedAt: "2024-11-27T10:30:00.000Z"
// }
```

### 2. Upload with Options

```typescript
import { uploadCvFile } from '@/services/cvStorageUpload';

const result = await uploadCvFile(candidateId, file, {
  sanitize: true,  // Remove special characters (default: true)
  validate: true,  // Validate file extension (default: true)
  allowedExtensions: ['pdf', 'docx'], // Custom allowed types
});
```

### 3. Extract Original Name

```typescript
import { extractOriginalName } from '@/services/cvStorageUpload';

// From database record
const resume = {
  storageName: "CV_CM_1732702341123.pdf"
};

// Extract for display
const displayName = extractOriginalName(resume.storageName);
// → "CV.pdf"
```

### 4. Upload Multiple Files

```typescript
import { uploadMultipleCvFiles } from '@/services/cvStorageUpload';

const files = [file1, file2, file3];
const results = await uploadMultipleCvFiles(candidateId, files);

// Returns array of upload results
results.forEach(result => {
  console.log(`Uploaded: ${result.originalName} → ${result.storageName}`);
});
```

## 🔧 Helper Functions

### 1. `extractOriginalName(storageName: string): string`

Extract original file name from storage name.

```typescript
extractOriginalName("CV_CM_1732702341123.pdf")
// → "CV.pdf"

extractOriginalName("My Resume_CM_1732702341123.pdf")
// → "My Resume.pdf"

extractOriginalName("CV.pdf") // No separator
// → "CV.pdf"
```

### 2. `generateStorageName(originalFileName: string): string`

Generate storage name with timestamp.

```typescript
generateStorageName("CV.pdf")
// → "CV_CM_1732702341123.pdf"

generateStorageName("My Resume.pdf")
// → "My Resume_CM_1732702341123.pdf"
```

### 3. `getFileExtension(fileName: string): string`

Extract file extension.

```typescript
getFileExtension("CV.pdf")      // → "pdf"
getFileExtension("doc.docx")    // → "docx"
getFileExtension("noext")       // → "pdf" (default)
```

### 4. `isValidFileExtension(fileName: string, allowed?: string[]): boolean`

Validate file extension.

```typescript
isValidFileExtension("CV.pdf")
// → true

isValidFileExtension("virus.exe")
// → false

isValidFileExtension("photo.jpg", ['pdf', 'docx'])
// → false
```

### 5. `sanitizeFileName(fileName: string): string`

Remove special characters from file name.

```typescript
sanitizeFileName("My CV (final)!.pdf")
// → "My CV final.pdf"

sanitizeFileName("CV@2024#.pdf")
// → "CV2024.pdf"
```

## 📊 Complete Example: Upload Flow

```typescript
import { uploadCvFile, extractOriginalName } from '@/services/cvStorageUpload';
import { createResume } from '@/services/resumeService';

async function handleCvUpload(file: File) {
  try {
    // Step 1: Upload to Firebase
    const uploadResult = await uploadCvFile(candidateId, file);
    
    console.log("📤 Upload result:", {
      original: uploadResult.originalName,
      storage: uploadResult.storageName,
      url: uploadResult.downloadUrl,
    });

    // Step 2: Save to database (use storageName)
    const resume = await createResume({
      aboutMe: "",
      resumeUrl: uploadResult.downloadUrl,
      storageName: uploadResult.storageName,  // ✅ Save storage name
      type: "UPLOAD",
      isActive: true,
    });

    // Step 3: Display on UI (use originalName)
    const displayName = extractOriginalName(resume.storageName);
    
    console.log("UI Display:", {
      name: displayName,           // ✅ "CV.pdf"
      url: resume.resumeUrl,       // Firebase URL for download/preview
      storage: resume.storageName, // Internal reference
    });

    return resume;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}
```

## 🗄️ Database Schema

Update your Resume interface to include `storageName`:

```typescript
export interface Resume {
  resumeId: number;
  aboutMe: string;
  resumeUrl: string;           // Firebase download URL
  storageName: string;         // NEW: Storage file name (CV_CM_1732702341123.pdf)
  type: ResumeType;
  isActive: boolean;
  createdAt: string;
  candidateId: number;
  // ... other fields
}
```

## 🎨 UI Display Example

### CV List Component

```typescript
import { extractOriginalName } from '@/services/cvStorageUpload';

function CVList({ resumes }: { resumes: Resume[] }) {
  return (
    <div>
      {resumes.map(resume => {
        // Extract display name
        const displayName = extractOriginalName(resume.storageName);
        
        return (
          <div key={resume.resumeId}>
            <h3>{displayName}</h3>  {/* ✅ Show: "CV.pdf" */}
            <a href={resume.resumeUrl} download={displayName}>
              Download
            </a>
          </div>
        );
      })}
    </div>
  );
}
```

### CV Card Component

```typescript
function CVCard({ resume }: { resume: Resume }) {
  const displayName = extractOriginalName(resume.storageName);
  
  return (
    <div className="cv-card">
      {/* Display original name to user */}
      <div className="cv-name">{displayName}</div>
      
      {/* Use storage name internally */}
      <div className="cv-meta" title={resume.storageName}>
        Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
      </div>
      
      {/* Use downloadUrl for preview/download */}
      <button onClick={() => window.open(resume.resumeUrl)}>
        Preview
      </button>
    </div>
  );
}
```

## 🔍 Debugging

### Enable Debug Logs

The upload utility includes comprehensive logging:

```
📤 Starting CV upload: {fileName: "CV.pdf", fileSize: "1.2 MB"}
🧹 Sanitized file name: CV.pdf
📝 Generated storage name: CV_CM_1732702341123.pdf
📁 Storage path: candidates/123/CV_CM_1732702341123.pdf
⬆️ Uploading to Firebase Storage...
✅ Upload successful: {path: "candidates/123/...", size: 1234567}
🔗 Fetching download URL...
✅ Download URL obtained: https://...
✅ Upload complete: {originalName: "CV.pdf", storageName: "CV_CM_1732702341123.pdf"}
```

### Error Handling

```typescript
try {
  const result = await uploadCvFile(candidateId, file);
} catch (error) {
  if (error.message.includes('Invalid file type')) {
    // Show file type error
  } else if (error.message.includes('Failed to get download URL')) {
    // Show Firebase error
  } else {
    // Generic error
  }
}
```

## ✅ Validation

### File Types
Default allowed: `pdf`, `doc`, `docx`, `jpg`, `png`

```typescript
// Use default validation
await uploadCvFile(candidateId, file);

// Custom validation
await uploadCvFile(candidateId, file, {
  allowedExtensions: ['pdf', 'docx']
});
```

### File Size
Validate before upload:

```typescript
const maxSize = 3 * 1024 * 1024; // 3MB

if (file.size > maxSize) {
  throw new Error('File too large');
}

await uploadCvFile(candidateId, file);
```

## 🧪 Testing

### Test File Naming

```typescript
import { generateStorageName, extractOriginalName } from '@/services/cvStorageUpload';

// Test 1: Normal case
const storage1 = generateStorageName("CV.pdf");
console.assert(storage1.includes("CV_CM_"));
console.assert(storage1.endsWith(".pdf"));

const original1 = extractOriginalName(storage1);
console.assert(original1 === "CV.pdf");

// Test 2: Multiple dots
const storage2 = generateStorageName("My.CV.Final.pdf");
const original2 = extractOriginalName(storage2);
console.assert(original2 === "My.CV.Final.pdf");

// Test 3: No extension
const storage3 = generateStorageName("document");
console.assert(storage3.endsWith(".pdf")); // Default extension
```

### Test Upload

```typescript
async function testUpload() {
  // Create test file
  const file = new File(["test"], "test.pdf", { type: "application/pdf" });
  
  // Upload
  const result = await uploadCvFile("test-candidate-id", file);
  
  // Verify
  console.assert(result.originalName === "test.pdf");
  console.assert(result.storageName.includes("_CM_"));
  console.assert(result.downloadUrl.startsWith("https://"));
  console.assert(result.fullPath.startsWith("candidates/"));
}
```

## 🚨 Important Notes

1. **Always store `storageName` in database** - Needed for file management
2. **Use `extractOriginalName()` for UI display** - Show user-friendly names
3. **Use `downloadUrl` for preview/download** - Direct Firebase URL
4. **File names are sanitized by default** - Special characters removed
5. **Extensions are validated by default** - Only allowed types accepted

## 📝 Migration Guide

If you have existing CVs without `storageName`:

```typescript
// Migration script
async function migrateExistingCVs(resumes: Resume[]) {
  for (const resume of resumes) {
    if (!resume.storageName) {
      // Extract file name from URL
      const urlParts = resume.resumeUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Update database
      await updateResume(resume.resumeId, {
        storageName: fileName // or generate new name
      });
    }
  }
}
```

## 🎯 Best Practices

1. **Upload Flow**:
   ```
   User selects file → Upload to Firebase → Get storageName + downloadUrl → Save to DB
   ```

2. **Display Flow**:
   ```
   Load from DB → Extract originalName from storageName → Show to user
   ```

3. **Download Flow**:
   ```
   User clicks download → Use downloadUrl → Set download attribute to originalName
   ```

4. **Preview Flow**:
   ```
   User clicks preview → Use downloadUrl in iframe/new tab
   ```

## 📞 Support

If you encounter issues:

1. Check console logs for detailed error messages
2. Verify Firebase Storage Rules allow uploads
3. Ensure candidate ID is valid
4. Check file type is in allowed extensions
5. Verify Firebase configuration in `.env`

---

**Status**: ✅ Ready to Use  
**Version**: 1.0.0  
**Last Updated**: November 27, 2025
