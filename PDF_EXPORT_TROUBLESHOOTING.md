# PDF Export Troubleshooting Guide

## Error: "Failed to create export job"

### Причина / Cause
Эта ошибка возникает когда система не может создать задачу экспорта PDF. Обычно это связано с отсутствием конфигурации Vercel KV.

This error occurs when the system cannot create a PDF export job. This is usually related to missing Vercel KV configuration.

### Решение / Solution

#### Вариант 1: Использовать локальную разработку (In-Memory Store)

Система автоматически использует резервное хранилище в памяти для локальной разработки, когда Vercel KV не настроен.

**Проверьте консоль на наличие:**
```
[ExportJobStore:KV] KV Configured: false
[ExportJobStore:Memory] Created job ...
```

Если вы видите эти сообщения, система работает правильно в режиме разработки.

**The system automatically uses in-memory fallback storage for local development when Vercel KV is not configured.**

**Check console for:**
```
[ExportJobStore:KV] KV Configured: false
[ExportJobStore:Memory] Created job ...
```

If you see these messages, the system is working correctly in development mode.

#### Вариант 2: Настроить Vercel KV (рекомендуется для продакшена)

**Option 2: Configure Vercel KV (recommended for production)**

Follow the steps in [VERCEL_KV_SETUP.md](./VERCEL_KV_SETUP.md):

1. **Create KV Database:**
   - Go to https://vercel.com/dashboard/stores
   - Click "Create Database" → Select "KV"
   - Name it `careermate-export-jobs`

2. **Get Environment Variables:**
   - Go to your KV database page
   - Click "Environment Variables" tab
   - Copy the three variables

3. **Add to `.env.local`:**
   ```env
   KV_REST_API_URL=https://your-kv-instance.kv.vercel-storage.com
   KV_REST_API_TOKEN=your-token-here
   KV_REST_API_READ_ONLY_TOKEN=your-read-only-token-here
   ```

4. **Restart Development Server:**
   ```bash
   npm run dev
   ```

---

## Error: "Job not found" or Polling Timeout

### Причина / Cause

#### Для локальной разработки:
Хранилище в памяти работает только в одном процессе. Если сервер перезапускается или если используются multiple serverless functions, задачи могут быть потеряны.

**For local development:**
In-memory store only works within a single process. If the server restarts or multiple serverless functions are used, jobs may be lost.

#### Для продакшена:
Убедитесь, что Vercel KV правильно подключен к вашему проекту.

**For production:**
Ensure Vercel KV is properly connected to your project.

### Решение / Solution

1. **Check console logs:**
   ```
   [ExportJobStore:Memory] Retrieved job {jobId}: processing
   ```

2. **For production deployments:**
   - Link KV database to your Vercel project
   - Redeploy your application
   - Verify environment variables in Vercel dashboard

3. **If using local development with in-memory store:**
   - Don't restart the dev server during export
   - Avoid browser hard refresh during export
   - Check that export completes within 90 seconds

---

## Error: PDF Generation Failed

### Причина / Cause
Puppeteer может не работать из-за отсутствия Chrome/Chromium или проблем с зависимостями.

**Puppeteer may not work due to missing Chrome/Chromium or dependency issues.**

### Решение / Solution

1. **Install Chromium:**
   ```bash
   npx puppeteer install
   ```

2. **Check Puppeteer configuration in `next.config.ts`:**
   ```typescript
   experimental: {
     serverComponentsExternalPackages: ['puppeteer-core'],
   },
   ```

3. **Verify Chrome is detected:**
   ```bash
   node check-chrome.cjs
   ```

---

## Best Practices

### Для локальной разработки / For Local Development

✅ **DO:**
- Use in-memory store (no KV needed)
- Keep dev server running during export
- Check console for `[ExportJobStore:Memory]` messages

❌ **DON'T:**
- Restart server during active exports
- Hard refresh browser during export
- Expect job persistence across server restarts

### Для продакшена / For Production

✅ **DO:**
- Configure Vercel KV for persistent job storage
- Link KV database to your Vercel project
- Monitor KV dashboard for job data
- Set up proper error monitoring

❌ **DON'T:**
- Use placeholder values like "asd" for KV credentials
- Deploy without linking KV database
- Ignore KV connection errors in logs

---

## Debug Checklist

Use this checklist when debugging PDF export issues:

- [ ] Check browser console for error messages
- [ ] Look for `[ExportJobStore]` logs in server console
- [ ] Verify `KV Configured: true/false` log on server start
- [ ] Confirm Firebase credentials are valid
- [ ] Test that Puppeteer can generate PDFs locally
- [ ] Check network tab for failed API requests
- [ ] Verify resumeId is not null/undefined
- [ ] Ensure CV data is valid (not sample data)
- [ ] Check that templateId is valid
- [ ] Verify user is logged in (userId exists)

---

## Common Console Logs

### Success (Development with Memory Store):
```
[ExportJobStore:KV] KV Configured: false
[ExportJobStore:Memory] Created job abc-123 for resume 456
[ExportJob] Starting background processing for job abc-123
[ExportJob] Generating PDF for job abc-123...
[ExportJob] PDF generated for job abc-123 (234.56 KB)
[ExportJob] Uploading to Firebase for job abc-123...
[ExportJob] Upload complete for job abc-123
[ExportJobStore:Memory] Updated job abc-123
[ExportJob] Job abc-123 completed successfully in 25.34s
```

### Success (Production with Vercel KV):
```
[ExportJobStore:KV] KV Configured: true
[ExportJobStore:KV] Created job abc-123 for resume 456
[ExportJob] Starting background processing for job abc-123
[ExportJob] Generating PDF for job abc-123...
[ExportJob] PDF generated for job abc-123 (234.56 KB)
[ExportJob] Uploading to Firebase for job abc-123...
[ExportJob] Upload complete for job abc-123
[ExportJobStore:KV] Updated job abc-123
[ExportJob] Job abc-123 completed successfully in 25.34s
```

### Error (KV configured but connection failed):
```
[ExportJobStore:KV] KV Configured: true
[ExportJobStore:KV] KV storage failed, using memory fallback: Connection refused
[ExportJobStore:Memory] Created job abc-123 for resume 456
⚠️ This will work but jobs won't persist across serverless functions
```

---

## Need More Help?

1. Check [VERCEL_KV_SETUP.md](./VERCEL_KV_SETUP.md) for KV setup
2. Check [PDF_EXPORT_QUICK_START.md](./PDF_EXPORT_QUICK_START.md) for usage guide
3. Check [PUPPETEER_PDF_FIREBASE_GUIDE.md](./PUPPETEER_PDF_FIREBASE_GUIDE.md) for PDF generation details
4. Open an issue with full console logs and error messages

