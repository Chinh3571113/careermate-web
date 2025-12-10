# API Integration Setup Guide

## Quick Start

### 1. Environment Configuration

The application uses environment variables to configure the API connection. Two files have been created:

- **`.env.local`** - Your local configuration (gitignored)
- **`.env.example`** - Template for other developers

### 2. Current Setup

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_USE_MOCK_FALLBACK=true
```

## How It Works

### Mock Data Fallback

When `NEXT_PUBLIC_USE_MOCK_FALLBACK=true`:
- ✅ App tries to connect to the backend API first
- ⚠️ If API is unavailable (network error), it automatically switches to mock data
- 📊 You see a warning in console: "⚠️ API unavailable. Using mock data fallback."
- 🎯 Application continues to work with realistic sample data

When `NEXT_PUBLIC_USE_MOCK_FALLBACK=false`:
- ❌ If API is unavailable, the error is shown to the user
- 🔍 Useful for debugging API connection issues

## Using Real Backend

### Option 1: Start Your Backend Server

1. Make sure your backend is running on `http://localhost:8080`
2. The app will automatically connect to it
3. Mock data will NOT be used if API responds successfully

### Option 2: Change API URL

If your backend runs on a different URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# or
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

### Option 3: Disable Mock Fallback

To see real errors when API is down:

```env
NEXT_PUBLIC_USE_MOCK_FALLBACK=false
```

## Development Workflow

### Scenario 1: Backend Not Ready Yet
```env
NEXT_PUBLIC_USE_MOCK_FALLBACK=true
```
✅ Work on frontend features with mock data

### Scenario 2: Testing Real API
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_USE_MOCK_FALLBACK=false
```
✅ Ensure API errors are visible for debugging

### Scenario 3: Production
```env
NEXT_PUBLIC_API_URL=https://api.production.com
NEXT_PUBLIC_USE_MOCK_FALLBACK=false
```
✅ Real API only, no fallback

## Restart Required

⚠️ **Important**: After changing `.env.local`, you must restart the Next.js development server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Mock Data Features

The mock data generator provides:
- 50 realistic job postings
- 5 different companies (TechCorp, DevSolutions, etc.)
- 5 job titles (Frontend, Backend, Full Stack, DevOps, UI/UX)
- Skills, experience levels, work models
- Pagination support (10 items per page)
- Search by keyword (filters by title and company)
- Random posting times (within last 7 days)

## Troubleshooting

### "Network Error" still appears
1. Restart the Next.js dev server
2. Check browser console for the warning message
3. Verify `.env.local` exists in project root

### Mock data not working
1. Ensure `NEXT_PUBLIC_USE_MOCK_FALLBACK=true`
2. Clear browser cache and reload
3. Check console for errors

### API connects but shows wrong data
1. Verify backend is returning correct response format
2. Check `src/lib/job-api.ts` for data transformation
3. Review API response structure in browser DevTools

## File Locations

```
fe/
├── .env.local              # Your local config (gitignored)
├── .env.example            # Template for team
├── src/
│   └── lib/
│       ├── job-api.ts      # API client with mock fallback
│       └── JOB_API_README.md  # API documentation
└── src/app/(home)/jobs-detail/
    └── page.tsx            # Jobs listing page
```

## Next Steps

1. ✅ Environment configured
2. ✅ Mock fallback enabled
3. 🔄 Restart dev server: `npm run dev`
4. 🎯 Test the application
5. 🚀 Start your backend when ready
