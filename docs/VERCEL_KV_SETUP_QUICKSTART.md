# ⚡ Vercel KV Setup - Quick Start

## 🎯 What You Need To Do

The PDF export "Job not found" error has been **fixed** with a hybrid storage solution. To enable it in production:

---

## 🚀 Steps to Enable Vercel KV (5 minutes)

### 1. Go to Vercel Dashboard

Visit: https://vercel.com/dashboard

### 2. Open Your Project

Click on your `careermate` project (or whatever it's called)

### 3. Navigate to Storage

Click the **"Storage"** tab in the top menu

### 4. Create KV Database

1. Click **"Create Database"**
2. Select **"KV (Redis)"**
3. Name it: `careermate-export-jobs`
4. Click **"Create"**

### 5. Connect to Project

1. Vercel will ask which project to connect to
2. Select your project
3. Click **"Connect"**

### 6. Deploy

Vercel automatically adds these environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

The next deployment will automatically use KV! ✅

---

## 🧪 How to Test

### Test Locally (Optional)

If you want to test KV before deploying:

1. Download environment variables:
   ```bash
   vercel env pull .env.local
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Look for this in console:
   ```
   [ExportJobStore] ✅ Vercel KV initialized (production mode)
   ```

### Test in Production

1. Deploy to Vercel:
   ```bash
   git push
   # or
   vercel --prod
   ```

2. Try exporting a CV as PDF

3. Check console - should see:
   - ✅ No more "Job not found" errors
   - ✅ Jobs persist across requests
   - ✅ Polling works reliably

---

## 📊 Vercel KV Pricing

**Free Tier Includes:**
- 3,000 commands/day
- 256 MB storage
- More than enough for CV exports!

**Current Usage Estimate:**
- Each PDF export = ~3-5 KV commands
- Can handle 600+ exports/day on free tier

---

## 🔍 Monitoring

### View Jobs in KV

1. Go to Vercel Dashboard → Storage → Your KV database
2. Click **"Data Browser"**
3. Search for keys: `export-job:*`

### Check Connection Status

Add this test endpoint:

```typescript
// src/app/api/test-kv/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { kv } = await import("@vercel/kv");
    await kv.ping();
    return NextResponse.json({ 
      status: "connected",
      message: "Vercel KV is working!" 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: "disconnected",
      message: error.message 
    }, { status: 500 });
  }
}
```

Visit: `https://your-domain.vercel.app/api/test-kv`

---

## ❓ FAQ

### Q: Do I need KV for local development?

**A:** No! The system automatically falls back to in-memory storage. KV is only needed for production on Vercel.

### Q: What happens if KV fails?

**A:** The system gracefully falls back to in-memory storage (same as development).

### Q: How long are jobs stored?

**A:** 10 minutes (automatic TTL in KV). Jobs are cleaned up automatically.

### Q: Can I use a different Redis provider?

**A:** Yes, but you'll need to modify `export-job-store.ts` to use a different Redis client (e.g., `ioredis`).

---

## ✅ That's It!

Once Vercel KV is set up:
1. ✅ Jobs persist across serverless instances
2. ✅ No more "Job not found" errors
3. ✅ PDF export polling works reliably
4. ✅ Automatic cleanup after 10 minutes
5. ✅ Zero code changes needed!

**The fix is already implemented in your code. Just enable KV and deploy!** 🚀

---

**Need Help?** Check the full documentation in `EXPORT_JOB_STORE_FIX.md`

