# PDF Export System - Quick Reference

## Overview

Complete end-to-end PDF export system for Network Usage Reports. Users can generate professional PDF reports for selected sites and date ranges.

## Architecture

```
┌─────────────────┐
│   Frontend UI   │ (Phase 4 - Next)
└────────┬────────┘
         │ startPdfExport()
         ▼
┌─────────────────┐
│  Server Actions │ (Phase 2 - Complete)
│  pdf-exports.ts │
└────────┬────────┘
         │ processJob()
         ▼
┌─────────────────┐
│ PDF Generation  │ (Phase 3 - Complete)
│  generatePdf()  │
└────────┬────────┘
         │
    ┌────┴─────┐
    ▼          ▼
┌────────┐ ┌──────────┐
│Database│ │Vercel Blob│
└────────┘ └──────────┘
```

## Usage

### Server-Side

```typescript
import { startPdfExport } from '@/app/actions/pdf-exports'

// Start export
const result = await startPdfExport({
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  },
  siteIds: [1, 2, 3], // Optional - null for all sites
})

if (result.success) {
  const jobId = result.data.jobId
  // Poll for progress
}
```

### Check Progress

```typescript
import { checkPdfProgress } from '@/app/actions/pdf-exports'

const status = await checkPdfProgress(jobId)

// status.data = {
//   id: string
//   status: 'pending' | 'processing' | 'complete' | 'failed'
//   progress: number // 0-100
//   downloadUrl?: string // Available when complete
//   error?: string
// }
```

## PDF Structure

### Pages

1. **Cover Page**
   - Company branding
   - Report title
   - Date range
   - Site count

2. **Executive Summary**
   - KPI metrics grid (6 metrics)
   - Health distribution (Healthy/Warning/Critical)
   - Auto-generated insights
   - Report guide

3. **Site Detail Pages** (one per site)
   - Site header with status
   - Performance summary (6 metrics)
   - Speed metrics table
   - Latency metrics table
   - Data consumption table

### Metrics Displayed

**Summary Level:**
- Average Upload/Download Speed
- Average Latency
- Total Data Consumed
- Average Utilization
- Site Health Counts

**Site Level:**
- Avg/Peak Upload Speed
- Avg/Peak Download Speed
- Avg/Min/Max Latency
- Total Data Consumed
- Utilization Percentage
- Consumption Percentage

## File Locations

### Core Files

```
lib/pdf/
├── NetworkUsageDocument.tsx    # Main document
├── styles.ts                    # Shared styles
├── components/
│   ├── CoverPage.tsx
│   ├── ExecutiveSummary.tsx
│   └── SiteDetailPage.tsx
└── utils/
    └── dataTransform.ts         # Data helpers

app/actions/
├── pdf-exports.ts               # Job management & generation
└── network-usage.ts             # Data source
```

### Database

```sql
-- Jobs table (Phase 2)
pdf_export_jobs (
  id uuid PRIMARY KEY,
  user_id text,
  organization_id integer,
  status text,
  progress integer,
  total_sites integer,
  processed_sites integer,
  download_url text,
  file_size integer,
  date_range_start timestamp,
  date_range_end timestamp,
  site_ids integer[],
  error text,
  expires_at timestamp
)
```

## API Reference

### Server Actions

#### `startPdfExport(params: PdfExportParams)`
Creates new export job and triggers background processing.

**Parameters:**
- `dateRange: { start: Date, end: Date }` - Report period
- `siteIds?: number[]` - Optional site filter

**Returns:**
- `{ success: true, data: { jobId: string } }`
- `{ success: false, error: string }`

#### `checkPdfProgress(jobId: string)`
Get current job status and download URL.

**Returns:**
- `PdfExportJobStatus` with progress, status, downloadUrl

#### `cancelPdfExport(jobId: string)`
Cancel running job (pending or processing only).

#### `getPdfExportHistory()`
Get last 10 exports for current user.

#### `cleanupExpiredExports()`
Delete expired jobs (called by cron).

### Data Utilities

#### `transformSiteData(data, city, state)`
Convert network metrics to PDF format.

#### `calculateAggregateData(sites, dateRange)`
Compute aggregate statistics across sites.

#### `generateInsights(aggregateData)`
Auto-generate textual insights from data.

## Styling System

### Colors

```typescript
colors = {
  primary: '#0f172a',    // slate-900
  accent: '#3b82f6',     // blue-500
  success: '#10b981',    // green-500
  warning: '#f59e0b',    // amber-500
  critical: '#ef4444',   // red-500
}
```

### Status Badges

- **Good**: Green, utilization < 70%
- **Warning**: Amber, utilization 70-90%
- **Critical**: Red, utilization ≥ 90%

### Typography

- Headers: 14-24pt, bold
- Body: 9-10pt, regular
- Labels: 8pt, uppercase, semi-bold
- Metrics: 16-20pt, bold

## Performance

### Batch Processing
- 10 sites per batch
- Parallel data fetching
- Progress updates per batch

### Timing (120 sites)
- Data fetching: ~12-15 seconds
- PDF generation: ~2-3 seconds
- Total: ~15-20 seconds

### File Size
- ~50-100 KB per site detail page
- Total for 120 sites: ~6-12 MB

## Error Handling

### Site-Level Errors
- Logged but don't fail entire export
- Report continues with available data
- Missing data shown as "No data available"

### Job-Level Errors
- Job status set to 'failed'
- Error message stored in DB
- User notified via UI

## Data Sources

### Primary: Network Usage Metrics
```typescript
getSiteNetworkMetrics(siteId, dateRange)
// Returns: SiteNetworkDetail with daily/hourly data
```

### Tables Used
- `network_daily_aggregates` - Daily metrics
- `network_monthly_aggregates` - Monthly summaries
- `sites` - Site information

## Storage

### Vercel Blob
- Path: `exports/{jobId}.pdf`
- Access: Public
- Expiry: 7 days
- Cleanup: Automated cron job

## Configuration

### Batch Size
```typescript
const BATCH_SIZE = 10 // sites per batch
```

### Expiry Period
```typescript
const EXPIRY_DAYS = 7 // days until auto-delete
```

### Table Limits
```typescript
const TABLE_ROWS = 10 // max rows per table
```

## Testing

### Manual Test Script

```typescript
// 1. Start export
const result = await startPdfExport({
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  },
  siteIds: null, // All sites
})

// 2. Poll progress
const interval = setInterval(async () => {
  const status = await checkPdfProgress(result.data.jobId)
  console.log(`Progress: ${status.data.progress}%`)

  if (status.data.status === 'complete') {
    console.log('Download:', status.data.downloadUrl)
    clearInterval(interval)
  }
}, 2000)
```

## Future Enhancements

### Charts
- Line charts for speed trends
- Bar charts for comparisons
- Pie charts for distribution

### Features
- Custom report sections
- Logo/branding upload
- Multiple export formats
- Email delivery

### Performance
- Queue system for large reports
- Cached aggregations
- Incremental updates

## Troubleshooting

### Build Errors
```bash
pnpm build
# Check for TypeScript errors
```

### Runtime Errors
```typescript
// Check job status
const status = await checkPdfProgress(jobId)
console.log(status.data.error) // If failed
```

### Missing Data
- Verify date range has telemetry data
- Check site has network metrics
- Confirm `network_daily_aggregates` populated

## Dependencies

```json
{
  "@react-pdf/renderer": "^4.3.1",
  "@vercel/blob": "^2.0.0"
}
```

## Related Documentation

- [Phase 1: Database Schema](./pdf-export-phase-1.md)
- [Phase 2: Server Actions](./pdf-export-phase-2.md)
- [Phase 3: PDF Generation](./pdf-export-phase-3.md)
- [Network Usage Actions](./network-usage-api.md)

---

**Last Updated**: 2025-01-20
**Status**: Phase 3 Complete, Phase 4 (Frontend) Next
