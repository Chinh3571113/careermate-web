# Firebase Storage Integration Guide

## 📌 Overview

This project uses Firebase Storage for storing user-uploaded files (CVs, avatars, etc.). The integration follows these principles:

1. **Store paths, not URLs** - Database stores file paths like `careermate-files/candidates/5/avatar/xxx.jpg`
2. **Resolve URLs at runtime** - Call `getDownloadURL()` when displaying files
3. **No manual URL building** - Never concatenate bucket + path + token manually

## 🔧 Available Utilities

### Core Functions (`@/lib/firebase-file.ts`)

```typescript
import { getFileUrl, useFileUrl, resolveFileUrl } from '@/lib/firebase-file';

// Get download URL from storage path
const url = await getFileUrl("careermate-files/candidates/5/avatar/photo.jpg");

// React hook for components
function Avatar({ path }) {
  const url = useFileUrl(path);
  if (!url) return <Skeleton />;
  return <img src={url} />;
}

// Handle both paths and URLs
const url = await resolveFileUrl(pathOrUrl);
```

### Upload Functions (`@/lib/firebase-upload.ts`)

```typescript
import { uploadAvatar, uploadCvFile } from '@/lib/firebase-upload';

// Upload avatar - returns both path and URL
const result = await uploadAvatar(candidateId, file);
console.log(result.storagePath); // Store this in database
console.log(result.downloadUrl); // Use for immediate display

// Upload CV file
const cvResult = await uploadCvFile(candidateId, file);
```

### React Components (`@/components/ui/firebase-image.tsx`)

```typescript
import { FirebaseImage, FirebaseAvatar } from '@/components/ui/firebase-image';

// General image component
<FirebaseImage 
  src="careermate-files/candidates/5/avatar/photo.jpg"
  alt="User avatar"
  className="w-20 h-20 rounded-full"
  fallback={<UserIcon />}
/>

// Avatar-specific component
<FirebaseAvatar
  src={user.avatarPath}
  alt={user.name}
  size="lg"
  fallbackInitials="JD"
/>
```

## 📁 Storage Path Structure

```
careermate-files/
└── candidates/
    └── {candidateId}/
        ├── avatar/
        │   └── {timestamp}_{filename}.{ext}
        └── cv/
            └── {uuid}.{ext}
```

## ✅ Best Practices

### DO:
- ✅ Store storage paths in database
- ✅ Use `useFileUrl` hook in React components
- ✅ Use `FirebaseImage` component for displaying images
- ✅ Let the SDK handle URL generation and token management

### DON'T:
- ❌ Store full download URLs in database (tokens expire!)
- ❌ Manually build URLs like `https://firebasestorage.googleapis.com/v0/b/...`
- ❌ Manually encode paths with `encodeURIComponent`
- ❌ Add `?alt=media&token=xxx` manually

## 🔄 Migration Guide

If you have existing code that builds URLs manually:

### Before (Bad):
```typescript
const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
```

### After (Good):
```typescript
import { getFileUrl } from '@/lib/firebase-file';
const url = await getFileUrl(path);
```

### For React Components:

#### Before:
```tsx
<img src={user.avatarUrl} alt="Avatar" />
```

#### After:
```tsx
import { useFileUrl } from '@/lib/firebase-file';

function Avatar({ path }) {
  const url = useFileUrl(path);
  return url ? <img src={url} alt="Avatar" /> : <Skeleton />;
}
```

Or use the pre-built component:
```tsx
import { FirebaseImage } from '@/components/ui/firebase-image';

<FirebaseImage src={user.avatarPath} alt="Avatar" />
```

## 🐛 Troubleshooting

### "Invalid HTTP method/URL pair" error
- **Cause**: Using email address in path (contains `@` character)
- **Fix**: Use numeric `candidateId` instead of email

### Images not loading
- **Check**: Is the path correct? (should start with `careermate-files/`)
- **Check**: Is the file actually uploaded to Firebase?
- **Check**: Do you have proper Firebase Storage rules?

### Tokens expiring
- **This shouldn't happen anymore** if you're using `getDownloadURL()`
- The SDK automatically handles token refresh

## 📦 File Structure

```
src/
├── lib/
│   ├── firebase.ts           # Firebase initialization
│   ├── firebase-file.ts      # URL resolution utilities
│   ├── firebase-upload.ts    # Upload utilities
│   └── firebase-storage.ts   # Re-exports (convenience)
└── components/
    └── ui/
        ├── firebase-image.tsx  # Image components
        └── premium-avatar.tsx  # Avatar with premium badge
```
