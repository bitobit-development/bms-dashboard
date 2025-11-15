# Vercel Cron Setup for Telemetry Generation

This document explains how to deploy the BMS Dashboard with automated telemetry generation using Vercel Cron Jobs.

## Overview

The telemetry generator runs automatically every 5 minutes on Vercel's serverless infrastructure, eliminating the need for a separate PM2 process or dedicated server.

## Files Created

1. **`vercel.json`** - Vercel cron configuration
2. **`app/api/cron/telemetry/route.ts`** - Cron endpoint API route
3. **`CRON_SECRET`** environment variable - Authentication for cron jobs

## Deployment Steps

### 1. Add Environment Variable to Vercel

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: `OlGm2s63YGt0DC9sXmJQU0JoumRmYkrbb9LlG82qUrw=`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 2. Deploy to Vercel

```bash
# Commit the new files
git add vercel.json app/api/cron/telemetry/route.ts docs/VERCEL_CRON_SETUP.md
git commit -m "feat: add Vercel cron job for telemetry generation"

# Push to GitHub (auto-deploys to Vercel)
git push origin main
```

### 3. Verify Cron Job Setup

After deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Cron Jobs** tab
3. Verify the `/api/cron/telemetry` job is listed
4. Check it's scheduled for `*/5 * * * *` (every 5 minutes)

### 4. Monitor Execution

View cron job logs:

1. Go to **Deployments** → Select latest deployment
2. Click **Functions** tab
3. Find `/api/cron/telemetry` function
4. View execution logs and metrics

## How It Works

```
┌─────────────────┐
│ Vercel Cron     │
│ (Every 5 min)   │
└────────┬────────┘
         │
         │ Triggers
         ▼
┌─────────────────────────┐
│ /api/cron/telemetry     │
│                         │
│ 1. Authenticates request│
│ 2. Loads active sites   │
│ 3. Fetches weather data │
│ 4. Generates telemetry  │
│ 5. Updates lastSeenAt   │
└────────┬────────────────┘
         │
         │ Writes to
         ▼
┌─────────────────┐
│ Neon PostgreSQL │
│ Database        │
└─────────────────┘
```

## Security

- Cron requests are authenticated using the `CRON_SECRET` environment variable
- Only requests with `Authorization: Bearer <CRON_SECRET>` header are accepted
- Vercel automatically includes this header when triggering cron jobs

## Monitoring & Debugging

### Check if Sites are Online

```bash
# Query the database to verify lastSeenAt is updating
pnpm exec dotenv -e .env.local -- pnpm exec tsx src/scripts/check-lastSeenAt.ts
```

Sites should show:
- 🟢 **Online** - lastSeenAt within 10 minutes
- 🟡 **Delayed** - lastSeenAt within 30 minutes
- 🔴 **Offline** - lastSeenAt more than 30 minutes ago

### Manual Trigger (Testing)

You can manually trigger the cron job:

```bash
curl -X GET 'https://your-app.vercel.app/api/cron/telemetry' \
  -H 'Authorization: Bearer OlGm2s63YGt0DC9sXmJQU0JoumRmYkrbb9LlG82qUrw='
```

Expected response:
```json
{
  "success": true,
  "sitesProcessed": 120,
  "errors": 0,
  "totalSites": 120,
  "duration": 45000,
  "timestamp": "2025-11-15T18:00:00.000Z"
}
```

### View Logs

**Vercel Dashboard:**
1. Go to your deployment
2. Click **Functions** tab
3. Select `/api/cron/telemetry`
4. View real-time logs

**Log Output Example:**
```
[2025-11-15T18:00:00.000Z] 🔄 Cron: Generating telemetry...
   Found 120 active sites
   Weather: 18°C, clear
   ✅ Completed: 120 success, 0 errors in 45000ms
```

## Execution Limits

- **Hobby Plan**: 60 seconds max execution time
- **Pro Plan**: 300 seconds (5 minutes) max execution time
- **Memory**: 1024 MB default
- **Concurrent Executions**: Limited by plan

**Current Performance:**
- Processing 120 sites takes ~45-60 seconds
- Well within Hobby plan limits
- For 200+ sites, consider upgrading to Pro plan

## Troubleshooting

### Cron Job Not Running

1. Check `vercel.json` exists in repository
2. Verify `CRON_SECRET` is set in Vercel environment variables
3. Check deployment logs for errors
4. Ensure you're on a paid Vercel plan (Hobby or Pro)

### Sites Showing Offline

1. Check cron job execution logs
2. Verify database connection (`DATABASE_URL` environment variable)
3. Test manual trigger to check for errors
4. Check `lastSeenAt` field in database

### Weather Data Errors

The cron job has fallback weather handling:
- If weather API fails, uses default nighttime weather
- Temperature: 18°C, 0 kW solar generation
- Check logs for "Weather fetch failed" warning

## Local Development

For local development, keep using PM2:

```bash
# Start PM2 telemetry generator
pnpm telemetry:pm2:start

# Check status
pnpm telemetry:pm2:status

# View logs
pnpm telemetry:pm2:logs

# Stop
pnpm telemetry:pm2:stop
```

## Migration from PM2

To switch from local PM2 to Vercel Cron:

1. **Stop PM2 process:**
   ```bash
   pnpm telemetry:pm2:stop
   pm2 delete bms-telemetry-generator
   ```

2. **Deploy to Vercel** (see steps above)

3. **Verify sites come online** after 5-10 minutes

## Cost Considerations

**Vercel Cron:**
- ✅ Free on Hobby plan (with execution limits)
- ✅ No separate server costs
- ✅ Automatic scaling
- ⚠️ Limited to plan's execution time limits

**PM2 Alternative (if needed):**
- Railway: $5/month
- Render: Free tier available
- DigitalOcean: $4/month

##Cron Schedule Reference

Current: `*/5 * * * *` (every 5 minutes)

Other options:
- `*/1 * * * *` - Every 1 minute
- `*/10 * * * *` - Every 10 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Daily at midnight

## Support

For issues, check:
1. Vercel deployment logs
2. Database connection status
3. Environment variables configuration
4. GitHub issues: https://github.com/bitobit-development/bms-dashboard/issues
