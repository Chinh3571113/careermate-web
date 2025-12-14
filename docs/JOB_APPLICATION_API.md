# Job Application API Integration

## Overview
Complete API integration for job application submission with CV upload, form validation, and success/error handling.

## API Endpoints

### 1. Submit Job Application
**Endpoint**: `POST /api/job-apply`

**Request Body**:
```json
{
  "jobPostingId": 26,
  "candidateId": 123,
  "cvFilePath": "uploads/cv/user123_cv.pdf",
  "fullName": "Tuấn Khang",
  "phoneNumber": "0123456789",
  "preferredWorkLocation": "Ho Chi Minh",
  "coverLetter": "I am excited to apply...",
  "status": "PENDING"
}
```

**Success Response** (code: 200, 201, 1000):
```json
{
  "code": 200,
  "message": "Application submitted successfully",
  "result": {
    "id": 456,
    "jobPostingId": 26,
    "jobTitle": "Python Developer",
    "jobDescription": "...",
    "expirationDate": "2025-12-15",
    "candidateId": 123,
    "cvFilePath": "uploads/cv/user123_cv.pdf",
    "fullName": "Tuấn Khang",
    "phoneNumber": "0123456789",
    "preferredWorkLocation": "Ho Chi Minh",
    "coverLetter": "I am excited to apply...",
    "status": "PENDING",
    "createAt": "2025-11-03T10:30:00Z"
  }
}
```

**Error Response**:
```json
{
  "code": 400,
  "message": "Invalid application data",
  "result": null
}
```

### 2. Upload CV (Optional)
**Endpoint**: `POST /api/upload/cv`

**Request**: `multipart/form-data` with `file` field

**Response**:
```json
{
  "code": 200,
  "message": "File uploaded successfully",
  "result": {
    "url": "https://storage.example.com/cv/filename.pdf"
  }
}
```

## Implementation Files

### 1. API Service Layer
**File**: `src/lib/job-apply-api.ts`

```typescript
// Submit job application
export const submitJobApplication = async (
  data: JobApplicationRequest
): Promise<JobApplicationResponse>

// Upload CV file
export const uploadCV = async (file: File): Promise<string>
```

**Features**:
- Type-safe interfaces
- Error handling with meaningful messages
- Success code validation (200, 201, 1000, 0)
- Console logging for debugging

### 2. Application Page
**File**: `src/app/candidate/jobs/[id]/apply/page.tsx`

**Key Functions**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // 1. Validate form
  // 2. Upload CV if new file
  // 3. Submit application
  // 4. Redirect to success page
}
```

**Features**:
- Form validation
- CV upload with progress
- Toast notifications
- User authentication check
- Auto-fill from auth store

### 3. Success Page
**File**: `src/app/candidate/jobs/[id]/apply/success/page.tsx`

**States**:
- `loading`: Processing application
- `success`: Application submitted successfully
- `error`: Submission failed

**Features**:
- Dynamic status based on URL params
- Application ID from query string
- Error handling with retry options
- Job recommendations (existing)

## User Flow

### Complete Journey

```
1. User navigates to /candidate/jobs/26/apply
   ↓
2. Form displays with:
   - CV selection (current/upload)
   - Full name (pre-filled from auth)
   - Phone number
   - Preferred location
   - Cover letter (optional)
   ↓
3. User fills form and clicks Submit
   ↓
4. If uploading new CV:
   → Toast: "Uploading CV..."
   → POST /api/upload/cv
   → Toast: "CV uploaded successfully"
   ↓
5. Submit application:
   → Toast: "Submitting application..."
   → POST /api/job-apply
   → Toast: "Application submitted successfully!"
   ↓
6. Redirect to /candidate/jobs/26/apply/success?applicationId=456
   ↓
7. Success page shows:
   ✅ Robot icon with paper plane
   ✅ "Application sent successfully!"
   ✅ Job recommendations
```

### Error Scenarios

**Scenario 1: CV Upload Fails**
```
Upload CV → Error
↓
Toast: "Failed to upload CV. Please try again."
↓
User stays on application page
```

**Scenario 2: Application Submission Fails**
```
Submit application → API returns code 400
↓
Toast: "Invalid application data"
↓
User stays on application page
```

**Scenario 3: No Application ID in URL**
```
Navigate to /success without applicationId
↓
Success page shows error state
↓
Red X icon + "Application Failed"
↓
Options: Go Back | Browse Jobs
```

## Data Validation

### Frontend Validation
```typescript
// Full name: Required
if (!formData.fullName.trim()) {
  errors.fullName = "Full name is required";
}

// Phone number: Required + Format
if (!/^\d{10}$/.test(formData.phoneNumber)) {
  errors.phoneNumber = "Please enter a valid phone number";
}

// Preferred location: Required
if (!formData.preferredLocation) {
  errors.preferredLocation = "Required";
}

// CV: Required (either current or upload)
if (!useCurrentCV && !cvFile) {
  toast.error("Please upload your CV");
}
```

### File Validation
```typescript
// File size: Max 3MB
if (file.size > 3 * 1024 * 1024) {
  alert("File size must not exceed 3MB");
}

// File type: .doc, .docx, .pdf only
const allowedTypes = [".doc", ".docx", ".pdf"];
if (!allowedTypes.includes(fileExtension)) {
  alert("Please upload .doc, .docx, or .pdf file");
}
```

## Success Codes

The API accepts multiple success codes:
- `200`: OK (HTTP standard)
- `201`: Created (HTTP standard)
- `1000`: Success (Custom backend code)
- `0`: Success (Alternative custom code)

```typescript
const isSuccess = 
  responseData.code === 200 || 
  responseData.code === 201 ||
  responseData.code === 1000 || 
  responseData.code === 0;
```

## Toast Notifications

### Loading States
```typescript
toast.loading("Uploading CV...", { id: 'upload-cv' });
toast.loading("Submitting application...", { id: 'submit-app' });
```

### Success States
```typescript
toast.success("CV uploaded successfully", { id: 'upload-cv' });
toast.success("Application submitted successfully!", { id: 'submit-app' });
```

### Error States
```typescript
toast.error("Failed to upload CV", { id: 'upload-cv' });
toast.error(errorMessage);
```

## Testing Guide

### Test Case 1: Successful Application with Current CV
1. Login as candidate
2. Go to job detail page
3. Click "Apply Now"
4. Select "Use your current CV"
5. Fill in:
   - Full name: "Tuấn Khang"
   - Phone: "0123456789"
   - Location: "Ho Chi Minh"
   - Cover letter: "I am interested..."
6. Click Submit
7. **Expected**: 
   - Toast: "Submitting application..."
   - Toast: "Application submitted successfully!"
   - Redirect to success page
   - Robot icon with confirmation

### Test Case 2: Successful Application with New CV
1. Login as candidate
2. Go to apply page
3. Select "Upload a new CV"
4. Choose PDF file (< 3MB)
5. Fill form
6. Click Submit
7. **Expected**:
   - Toast: "Uploading CV..."
   - Toast: "CV uploaded successfully"
   - Toast: "Submitting application..."
   - Toast: "Application submitted successfully!"
   - Redirect to success page

### Test Case 3: Validation Errors
1. Go to apply page
2. Leave form empty
3. Click Submit
4. **Expected**:
   - Error messages under each field
   - Form does not submit
   - User stays on page

### Test Case 4: File Validation
1. Select "Upload a new CV"
2. Choose file > 3MB
3. **Expected**: Alert "File size must not exceed 3MB"
4. Choose .jpg file
5. **Expected**: Alert "Please upload .doc, .docx, or .pdf file"

### Test Case 5: API Error Handling
1. Stop backend server
2. Try to submit application
3. **Expected**:
   - Toast: "Submitting application..."
   - Toast: Error message
   - User stays on page

### Test Case 6: Direct Success Page Access
1. Navigate to `/candidate/jobs/26/apply/success` (without applicationId)
2. **Expected**:
   - Error state displayed
   - Red X icon
   - "Application Failed" message
   - Buttons: "Go Back" and "Browse Jobs"

## Integration with Auth Store

The application automatically uses user data from auth store:

```typescript
const { user } = useAuthStore();

// Used in submission:
candidateId: user.id,
cvFilePath: user.cvPath || "current-cv.pdf"

// Pre-fill form:
fullName: user.name
phoneNumber: user.phone
```

## Error Messages

### User-Friendly Messages
```typescript
// Upload error
"Failed to upload CV. Please try again."

// Submission error
"Failed to submit job application"

// Validation errors
"Full name is required"
"Please enter a valid phone number"
"Preferred work location is required"
"Please upload your CV"

// Auth error
"User information not found. Please login again."
```

## Future Enhancements

1. **Application History**
   - View all submitted applications
   - Track application status

2. **Email Notifications**
   - Confirmation email after submission
   - Updates on application status

3. **Resume Parser**
   - Auto-fill form from uploaded CV
   - Extract skills and experience

4. **Application Analytics**
   - Track application success rate
   - Show similar jobs

5. **Draft Save**
   - Save application as draft
   - Resume later

## Troubleshooting

### Issue: "User information not found"
**Solution**: User must be logged in before applying

### Issue: "Failed to upload CV"
**Solution**: Check file size (< 3MB) and format (.pdf, .doc, .docx)

### Issue: Success page shows error
**Solution**: Check if applicationId is in URL query string

### Issue: Toast notifications not showing
**Solution**: Ensure react-hot-toast is properly installed and configured

## API Response Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Show success page |
| 201 | Created | Show success page |
| 1000 | Success (Custom) | Show success page |
| 0 | Success (Alternative) | Show success page |
| 400 | Bad Request | Show error, stay on page |
| 401 | Unauthorized | Redirect to login |
| 404 | Not Found | Show error message |
| 500 | Server Error | Show error, allow retry |
