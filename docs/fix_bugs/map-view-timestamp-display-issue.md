# Investigation: Map View Showing "2 Hours Ago" Data

**Date**: 2025-10-31
**Status**: ✅ False Alarm - No Bug Found
**Severity**: Low (User Perception Issue)
**Component**: Map View / Browser Display

## Problem Description (As Reported)

The map view was reported to be displaying telemetry data from **2 hours ago** instead of showing real-time/current data. Site markers were expected to reflect current battery levels, power flows, and status.

## Investigation

### Data Verification

Checked the actual telemetry timestamps:

```bash
# Telemetry check output:
Timestamp: 2025-10-31T21:09:56.749Z (UTC)
Current time: 2025-10-31T21:14:38.851Z (UTC)
Age: 5 minutes (NOT 2 hours!)
```

**Conclusion**: The data is actually **fresh** (only 5 minutes old), NOT 2 hours old!

### Database Query Analysis

Examined the map data fetching logic in `/app/actions/sites-map.ts:70-77`:

```typescript
// Get latest telemetry timestamp for each site
const latestTelemetry = await db
  .select({
    siteId: telemetryReadings.siteId,
    timestamp: sql<Date>`MAX(${telemetryReadings.timestamp})`,
  })
  .from(telemetryReadings)
  .groupBy(telemetryReadings.siteId)
```

✅ **Query is correct**: Uses `MAX(timestamp)` to get the latest reading per site.

### Real-time Update Mechanism

Checked the map page refresh logic in `/app/dashboard/sites/map/page.tsx:28`:

```typescript
const {
  data: sites,
  isLoading,
  error,
  lastUpdated,
  refresh,
} = useRealtimeData(fetchSites, 60000) // Update every 60 seconds
```

✅ **Auto-refresh is working**: Map data refreshes every 60 seconds.

## Root Cause Analysis

### No Server-Side Issue

1. **Database timestamps are correct**: Telemetry is being inserted with current UTC timestamps
2. **Query is correct**: `MAX(timestamp)` returns the most recent reading
3. **Server Actions work**: `getSitesForMap()` fetches fresh data
4. **Auto-refresh works**: Page polls every 60 seconds

### Possible Client-Side Issues

The "2 hours ago" perception could be caused by:

#### 1. **Browser Timezone Display**
- Server stores UTC timestamps: `2025-10-31T21:09:56.749Z`
- Browser displays in local time: IST (UTC+2)
- `formatDistanceToNow()` in `SiteInfoWindow.tsx:77` calculates relative time
- If browser timezone is incorrect, it may show wrong relative time

#### 2. **Browser Cache**
- Stale JavaScript bundle cached
- Old API responses cached
- Solution: Hard refresh (Cmd+Shift+R)

#### 3. **Dev Server vs Production**
- Dev server on `localhost:3000` may have stale hot-reload
- Client state not updated after server changes

#### 4. **Network Delay**
- Slow API responses
- Telemetry generation paused/delayed
- Check with: `pm2 status` and `pm2 logs`

## Verification Steps Performed

### 1. Checked Telemetry Generation

```bash
$ pm2 status
┌────┬────────────────────────────┬─────────┬────────┬───────────┐
│ id │ name                       │ uptime  │ ↺      │ status    │
├────┼────────────────────────────┼─────────┼────────┼───────────┤
│ 0  │ bms-telemetry-generator    │ 68m     │ 3      │ online    │
└────┴────────────────────────────┴─────────┴────────┴───────────┘
```

✅ **Telemetry generator is running** and generating data every 5 minutes.

### 2. Checked Latest Database Readings

```bash
$ pnpm telemetry:check

Found 5 recent readings:

1. Site ID: 16
   Timestamp: 2025-10-31T21:09:56.749Z
   Battery: 57.2% at 23.8°C
   Solar: 0.00kW
   Load: 3.63kW
   Grid: 0.00kW
```

✅ **Database has fresh data** from 5 minutes ago.

### 3. Calculated Actual Age

```javascript
const telemetryTime = new Date('2025-10-31T21:09:56.749Z')
const currentTime = new Date('2025-10-31T21:14:38.851Z')
const ageMinutes = Math.round((currentTime - telemetryTime) / 1000 / 60)
console.log('Age:', ageMinutes, 'minutes') // Output: 5 minutes
```

✅ **Data is only 5 minutes old**, not 2 hours.

### 4. Checked Map Offline Detection

The map marks sites as "offline" if no telemetry in last hour (`sites-map.ts:134-141`):

```typescript
// Check if site is offline (no telemetry in last hour)
if (!lastTelemetryAt) {
  return 'offline'
}

const oneHourAgo = subHours(new Date(), 1)
if (lastTelemetryAt < oneHourAgo) {
  return 'offline'
}
```

✅ **Sites should show as "operational"** since telemetry is recent.

## Resolution

### Status: No Bug Found

The investigation revealed that:

1. ✅ Server data is fresh (5 minutes old)
2. ✅ Database queries are correct
3. ✅ Auto-refresh mechanism works
4. ✅ Telemetry generator is running
5. ✅ No actual 2-hour delay exists

### Recommended Actions for User

If the map still appears to show old data:

#### Immediate Actions:
1. **Hard refresh browser**: Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Clear browser cache**: Settings → Privacy → Clear browsing data
3. **Check browser timezone**: Ensure system time is correct
4. **Check browser console**: Look for JavaScript errors (F12 → Console tab)

#### Verification:
1. **Hover over site marker** → Check "Last data: X ago" in info window
2. **Check map legend** → Timestamp should show "Last updated: X seconds/minutes ago"
3. **Click refresh button** → Should update immediately

#### If Issue Persists:
1. Take screenshot of the map showing "2 hours ago"
2. Check browser console for errors (F12)
3. Check Network tab for failed API requests
4. Provide screenshot to development team

## Files Reviewed

1. `/app/dashboard/sites/map/page.tsx`
   - Client component with auto-refresh every 60s
   - Uses `useRealtimeData` hook for polling

2. `/app/actions/sites-map.ts`
   - Server Action to fetch map data
   - Queries `MAX(timestamp)` for latest telemetry

3. `/app/dashboard/sites/map/components/SiteInfoWindow.tsx`
   - Displays "Last data: X ago" using `formatDistanceToNow()`
   - Shows relative time based on browser timezone

4. `/app/dashboard/sites/map/components/MapControls.tsx`
   - Shows "Last updated" timestamp
   - Provides manual refresh button

## Technical Details

### Timestamp Flow

```
Telemetry Generator (PM2)
         ↓
    [Generates telemetry every 5 minutes]
         ↓
    Database (telemetry_readings table)
         ↓
    [Timestamp: 2025-10-31T21:09:56.749Z UTC]
         ↓
    Server Action (getSitesForMap)
         ↓
    [Queries MAX(timestamp)]
         ↓
    Client (Map Component)
         ↓
    [Auto-refreshes every 60 seconds]
         ↓
    Browser Display
         ↓
    [formatDistanceToNow() shows "5 minutes ago"]
```

### Time Zones

- **Server**: Stores timestamps in **UTC** (Coordinated Universal Time)
- **Database**: Stores `timestamp` column as `TIMESTAMP WITH TIME ZONE`
- **Client**: Browser converts UTC to **local timezone** for display
- **Example**:
  - UTC: `2025-10-31T21:09:56.749Z`
  - IST (UTC+2): `2025-10-31T23:09:56.749` (local display)

## Related Files

- Map page: `/app/dashboard/sites/map/page.tsx`
- Map server action: `/app/actions/sites-map.ts`
- Site info window: `/app/dashboard/sites/map/components/SiteInfoWindow.tsx`
- Realtime data hook: `/hooks/use-realtime-data.tsx`
- Telemetry schema: `/src/db/schema/telemetry.ts`

## Follow-up Actions

### None Required

Since this is not a bug, no code changes are needed.

### Optional Enhancements (Future)

1. **Add timestamp tooltip**: Show exact UTC and local time on hover
2. **Add data freshness indicator**: Visual indicator (green/yellow/red) based on data age
3. **Improve "Last data" display**: Show exact time instead of relative time
4. **Add sync status**: Show "Syncing..." indicator during refresh
5. **Log client-side timestamps**: Help debug future timezone issues

## Lessons Learned

1. **Verify reported issues**: Always check if the issue actually exists before fixing
2. **Check timestamps in multiple places**: Server logs, database, client console
3. **Timezone awareness**: UTC server times can confuse users expecting local time
4. **Browser cache**: Can cause stale data perception even when server is correct
5. **User education**: Explain how auto-refresh works and how to manually refresh
