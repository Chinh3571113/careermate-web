# 🔥 Firebase Setup Guide for Avatar Upload

## ✅ Đã hoàn thành:

### 1. **Firebase Integration Files**
- ✅ `src/lib/firebase.ts` - Firebase initialization
- ✅ `src/lib/firebase-upload.ts` - Upload helpers (avatar & CV)
- ✅ `.env.example` - Environment variables template

### 2. **UI Components**
- ✅ `PersonalDetailDialog.tsx` - Avatar upload UI with preview
  - Drag & drop zone với preview
  - Edit và Delete buttons
  - Upload progress indicator
  - File validation (type & size)

### 3. **API Integration**
- ✅ `candidate-profile-api.ts` - Added `updateCandidateProfile()` function
- ✅ `page.tsx` - `handleSavePersonalDetail()` saves image URL to DB

---

## 📋 Setup Steps:

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `careermate` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firebase Storage

1. In Firebase Console, go to **Build → Storage**
2. Click "Get started"
3. Choose "Start in **production mode**" (we'll set custom rules)
4. Select location: `asia-southeast1` (Singapore) or closest to your users
5. Click "Done"

### Step 3: Set Security Rules

1. Go to **Storage → Rules** tab
2. Replace the default rules with:

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // === CV files: private ===
    match /careermate-files/candidates/{userId}/cv/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // === Avatars: public read, private write ===
    match /careermate-files/candidates/{userId}/profile/{fileName} {
      allow read: if true; // anyone can view
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // === Block everything else ===
    match /{path=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click "Publish"

### Step 4: Get Firebase Config

1. Go to **Project settings** (⚙️ icon)
2. Scroll down to "Your apps"
3. Click "</>" (Web) icon
4. Register app name: `careermate-web`
5. Copy the `firebaseConfig` object

### Step 5: Configure Environment Variables

1. Create `.env.local` file in project root:

```bash
# Copy from .env.example and fill in your values
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=careermate.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=careermate
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=careermate.appspot.com
NEXT_PUBLIC_FIREBASE_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGdeE9FtSSIt4HX12Liji_SELAhDIEOiY",
  authDomain: "cm-storage-86d7d.firebaseapp.com",
  projectId: "cm-storage-86d7d",
  storageBucket: "cm-storage-86d7d.firebasestorage.app",
  messagingSenderId: "35332421629",
  appId: "1:35332421629:web:8014a07c41b2cd35328b94",
  measurementId: "G-RDFCZLH50Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

2. **⚠️ IMPORTANT:** Add `.env.local` to `.gitignore`

```bash
# .gitignore
.env.local
.env*.local
```

### Step 6: Test Upload

1. Run the app: `npm run dev`
2. Go to cm-profile page
3. Click Edit button on Profile Header
4. Click "Edit" button under avatar
5. Select an image file
6. Click "Save"
7. Check Firebase Storage to verify file uploaded

---

## 🔄 Data Flow:

```
User selects image
  ↓
PersonalDetailDialog.tsx
  → handleFileChange()
  ↓
firebase-upload.ts
  → uploadAvatar(userId, file)
  ↓
Firebase Storage
  → /careermate-files/candidates/{userId}/profile/{timestamp}_filename.jpg
  ↓
Returns downloadURL
  ↓
PersonalDetailDialog
  → onProfileImageChange(downloadURL)
  ↓
page.tsx
  → handleSavePersonalDetail()
  ↓
API PUT /api/candidates/profiles
  → { image: downloadURL, ... }
  ↓
Database saves URL
  ↓
On page reload:
  → fetchCurrentCandidateProfile()
  → Get image URL from DB
  → Display avatar
```

---

## 🎯 Features:

### ✅ Upload Avatar
- Max size: 5MB
- Supported formats: JPG, PNG, GIF
- Auto-generate unique filename with timestamp
- Preview before save
- Delete/replace avatar

### ✅ Security
- **Private write**: Only owner can upload to their folder
- **Public read**: Anyone can view avatar (for recruiter view)
- **CV files**: Private read/write (future feature)

### ✅ Storage Structure
```
/careermate-files/
  └── candidates/
       └── {userId}/
            ├── cv/          ← Private (future)
            │   └── 1234567890_resume.pdf
            └── profile/     ← Public read
                └── 1234567890_avatar.jpg
```

---

## 🧪 Testing Checklist:

- [ ] Upload image < 5MB ✅
- [ ] Upload image > 5MB (should fail) ❌
- [ ] Upload non-image file (should fail) ❌
- [ ] Preview updates immediately
- [ ] Delete button removes preview
- [ ] Save button stores URL to DB
- [ ] Reload page shows uploaded avatar
- [ ] Firebase Storage shows file in correct path
- [ ] Avatar is publicly accessible (test in incognito)

---

## 🐛 Troubleshooting:

### Issue: "Failed to upload avatar"
**Solution:** Check Firebase config in `.env.local`

### Issue: "Permission denied"
**Solution:** Verify Storage Rules are published correctly

### Issue: "CORS error"
**Solution:** Firebase Storage allows all origins by default, but if you see CORS:
1. Go to Google Cloud Console
2. Open Cloud Shell
3. Run:
```bash
echo '[{"origin": ["*"], "method": ["GET"], "maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://YOUR-BUCKET-NAME.appspot.com
```

### Issue: Avatar not loading
**Solution:** 
1. Check URL format: Should start with `https://firebasestorage.googleapis.com/`
2. Verify file exists in Firebase Console
3. Check browser console for errors

---

## 📚 Related Files:

- `README_FIREBASE_STORAGE.md` - Detailed Firebase Storage documentation
- `src/lib/firebase.ts` - Firebase SDK initialization
- `src/lib/firebase-upload.ts` - Upload helper functions
- `src/lib/candidate-profile-api.ts` - API functions
- `src/app/candidate/cm-profile/components/dialogs/PersonalDetailDialog.tsx` - UI component
- `src/app/candidate/cm-profile/page.tsx` - Main page logic

---

## 🚀 Next Steps:

1. **CV Upload**: Implement CV upload using `uploadCV()` function
2. **File Management**: Add cleanup for old avatars (keep only latest)
3. **Image Optimization**: Add resize/compress before upload
4. **Progress Bar**: Show upload progress percentage
5. **Firebase Auth**: Optional - integrate with Firebase Auth for better security

---

**Last Updated:** 2025-01-07
