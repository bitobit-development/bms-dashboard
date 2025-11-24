# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BMS (Battery Management System) Dashboard - A production Next.js 16.0.1 application for monitoring and managing battery energy storage systems. Built with React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, Neon PostgreSQL, and Stack Auth.

## Development Commands

### Core Development
- `pnpm dev` - Start dev server on http://localhost:3000
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Database (Drizzle ORM + Neon PostgreSQL)
- `pnpm db:generate` - Generate migrations from schema changes
- `pnpm db:push` - Push schema to database (interactive, requires confirmation)
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:studio` - Open Drizzle Studio for database GUI
- `pnpm db:seed` - Seed database with initial data
- `pnpm db:seed:weather` - Seed weather data
- `pnpm db:seed:network` - Seed network telemetry data (realistic randomized)
- `pnpm db:stats` - Check database statistics

### Telemetry & Testing
- `pnpm telemetry:run` - Generate telemetry data manually
- `pnpm telemetry:1min` - Generate 1 minute of telemetry
- `pnpm telemetry:5min` - Generate 5 minutes of telemetry
- `pnpm telemetry:check` - Check telemetry data
- `pnpm telemetry:pm2:start` - Start telemetry generator via PM2
- `pnpm weather:test` - Test weather API integration

### User Management
- `pnpm user:list` - List all users with status
- `pnpm user:check` - Check specific user details
- `pnpm user:approve-admin` - Approve user as admin
- `pnpm user:sync-stack-id` - Sync Stack Auth user IDs

**Package Manager**: Always use `pnpm`, not npm or yarn.

## Environment Setup

### Required Environment Variables (.env.local)

**Database (Neon PostgreSQL):**
- `DATABASE_URL` - Pooled connection (use for queries)
- `DATABASE_URL_UNPOOLED` - Direct connection
- `POSTGRES_PRISMA_URL` - For schema operations with timeout

**Authentication (Stack Auth):**
- `NEXT_PUBLIC_STACK_PROJECT_ID` - Public project ID
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` - Public client key
- `STACK_SECRET_SERVER_KEY` - Secret key (server-only, never expose)

**Vercel Cron (Production Telemetry):**
- `CRON_SECRET` - Authentication secret for cron job endpoint (required for production)

**Vercel Blob (PDF Storage):**
- `BLOB_READ_WRITE_TOKEN` - Token for Vercel Blob storage (required for PDF exports)

**Email Notifications (Optional):**
- `EMAIL_FROM` - Sender email address
- `EMAIL_API_KEY` - Email service API key (Resend, SendGrid, etc.)
- `ADMIN_EMAILS` - Comma-separated admin emails for notifications
- `NEXT_PUBLIC_APP_URL` - Application URL for email links

## Architecture

### Directory Structure
```
app/
├── actions/              # Server Actions for data mutations
│   ├── sites.ts         # Site CRUD operations
│   ├── alerts-actions.ts
│   ├── management.ts    # User management, audit logs
│   └── ...
├── dashboard/           # Main dashboard routes
│   ├── layout.tsx       # Dashboard layout with nav/sidebar
│   ├── page.tsx         # Dashboard home (client component)
│   └── sites/           # Site detail pages
├── management/          # Admin pages
│   └── users/
│       └── pending/     # User approval queue
├── handler/             # Stack Auth handlers
│   └── [...stack]/
└── stack.ts             # Stack Auth server configuration

src/
├── db/
│   ├── schema/          # Drizzle schema definitions
│   │   ├── users.ts     # organizationUsers, userActivityLog
│   │   ├── sites.ts     # Sites, equipment
│   │   ├── telemetry.ts # Time-series data
│   │   ├── alerts.ts    # Alert system
│   │   └── index.ts     # Schema exports
│   ├── seed.ts          # Database seeding
│   └── index.ts         # DB connection
└── lib/
    ├── actions/
    │   └── users.ts     # User approval workflow
    └── email.ts         # Email notification system

components/
├── auth/                # Authentication UI components
│   ├── pending-approval.tsx      # Pending user approval page
│   ├── already-signed-in.tsx     # Custom "already signed in" page
│   ├── account-inactive.tsx      # Inactive account page
│   ├── login-loading.tsx         # Consistent loading component
│   └── login-form.tsx            # Login form wrapper
├── dashboard/           # Dashboard-specific components
│   ├── nav.tsx         # Navigation bar
│   ├── sidebar.tsx     # Sidebar navigation
│   └── site-card.tsx   # Site display cards
└── ui/                  # Reusable UI components (shadcn/ui)

middleware.ts            # Auth middleware + user sync
```

### Database Schema (Drizzle ORM)

**Core Tables:**
- `organizations` - Multi-tenant organizations
- `organization_users` - User-organization mapping with roles
- `user_activity_log` - Audit trail for user lifecycle events
- `user_audit_log` - General audit log for admin actions
- `sites` - Battery/solar installation sites
- `equipment` - Batteries, inverters, solar panels
- `telemetry_readings` - Real-time sensor data
- `telemetry_hourly` / `telemetry_daily` - Aggregated time-series
- `alerts` - System alerts and notifications
- `weather` - Weather data for sites
- `network_telemetry` - Network bandwidth and latency metrics (hourly)
- `network_daily_aggregates` / `network_monthly_aggregates` - Network usage rollups
- `pdf_export_jobs` - Background PDF generation tracking with progress

**Key Relationships:**
- Organizations have many users and sites
- Sites have equipment, telemetry, and network metrics
- Users have roles: `owner`, `admin`, `operator`, `viewer`
- User status flow: `pending` → `active` (or `inactive`/`suspended`)
- PDF export jobs track background processing with progress updates

**Total Sites**: 131 active sites across KwaZulu-Natal, South Africa (see `docs/sites-list.md`)

**Total Tables**: 15 (12 core + 3 network/PDF)

### Authentication & Authorization

**Stack Auth Integration:**
- Server-only auth via `/app/stack.ts` (uses `stackServerApp`)
- Middleware at `/middleware.ts` protects `/dashboard` routes
- User sync happens automatically on first dashboard access
- Cookie-based session tracking prevents duplicate syncs

**User Approval Workflow:**
1. New user signs up via Stack Auth
2. `syncUserToDatabase()` creates user record with `status='pending'`
3. Admins view pending users at `/management/users/pending`
4. `approveUser()` or `rejectUser()` changes status
5. Email notifications sent (console logs if email not configured)
6. All actions logged to `user_activity_log` for audit trail

**Authorization Pattern:**
```typescript
// Server Action example
export async function someAdminAction() {
  const user = await stackServerApp.getUser()
  if (!user) return { error: 'Not authenticated' }

  const dbUser = await db.query.organizationUsers.findFirst({
    where: eq(organizationUsers.stackUserId, user.id)
  })

  if (!dbUser || !['owner', 'admin'].includes(dbUser.role)) {
    return { error: 'Not authorized' }
  }

  // Perform action...
}
```

### Data Flow Patterns

**Server Actions (app/actions/):**
- Marked with `'use server'` directive
- Use Drizzle ORM for database queries
- Return `{ success: boolean, data?, error? }` format
- Called from client components via async functions
- Trigger `revalidatePath()` after mutations

**Client Components:**
- Marked with `'use client'` directive
- Use React 19 hooks (useOptimistic, useFormStatus, useActionState)
- Custom hook `useRealtimeData` for polling updates
- Call Server Actions directly, no API routes needed

**Telemetry System:**
- **Production**: Vercel Cron (`/api/cron/telemetry`) runs every 5 minutes, processes all 120 sites in ~10s
- **Development**: PM2 process generates continuous telemetry data locally
- Data flow: Insert to `telemetry_readings` → aggregate to hourly/daily tables
- Real-time dashboard updates via polling
- Sites show as "online" when `lastSeenAt` is within 10 minutes

## Tech Stack Details

### Frontend
- **Next.js 16.0.1** - App Router with Turbopack
- **React 19.2.0** - Server Components, Actions, new hooks
- **TypeScript 5** - Strict mode, path aliases (`@/*`)
- **Tailwind CSS v4** - New `@import "tailwindcss"` syntax
- **Radix UI** - Headless component primitives
- **Lucide React** - Icon library
- **Recharts** - Charts and visualizations
- **date-fns** - Date formatting and manipulation
- **@react-pdf/renderer 4.3.1** - Programmatic PDF generation (not Puppeteer)

### Backend
- **Drizzle ORM 0.44.7** - Type-safe SQL query builder
- **Neon PostgreSQL** - Serverless Postgres with pooling
- **Stack Auth 2.8.47** - Authentication via Neon integration
- **Server Actions** - No API routes, actions in `app/actions/`
- **Vercel Blob 2.0.0** - Serverless file storage for PDFs (48-hour expiry)

### Dev Tools
- **ESLint 9** - Linting with Next.js config
- **Drizzle Kit** - Schema migrations and studio
- **tsx** - TypeScript execution for scripts
- **PM2** - Process manager for telemetry generation

## Running Scripts

Scripts in `/scripts/` directory require environment variables from `.env.local`:

```bash
# Method 1: Using set -a (recommended)
(
  set -a
  source .env.local
  set +a
  pnpm tsx scripts/your-script.ts
)

# Method 2: Using export with grep (alternative)
# Not recommended due to special character handling issues
```

**Common Scripts:**
- `list-all-sites.ts` - List all sites with city/state
- `remove-duplicate-sites.ts` - Remove duplicate sites from database
- `seed-network-data.ts` - Seed network telemetry data
- `verify-network-coverage.ts` - Verify network data coverage

## Key Implementation Patterns

### Database Migrations
```bash
# After schema changes in src/db/schema/
pnpm db:generate  # Generate migration file
pnpm db:push      # Push to database (interactive)
```

### User Sync on First Login
```typescript
// app/dashboard/page.tsx
useEffect(() => {
  syncUserToDatabase().catch(console.error)
}, [])
```

### Middleware for New Sessions
```typescript
// middleware.ts
if (isNewUserSession(request)) {
  response.cookies.set('user-synced', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
}
```

### Audit Logging
```typescript
// Automatically logs: user_created, user_approved, user_rejected, user_status_changed
await logUserActivity(stackUserId, action, details, organizationId)
```

### Email Notifications
```typescript
// src/lib/email.ts - Currently logs to console
// To enable: Set EMAIL_FROM, EMAIL_API_KEY, ADMIN_EMAILS env vars
await notifyAdminsNewUser(userEmail, userName)
await notifyUserApproved(userEmail, userName)
```

## Code Style & Conventions

### Component Patterns
- **Server Components**: Default, no `'use client'`, can use async/await
- **Client Components**: Add `'use client'`, use hooks, interactivity
- **Naming**: PascalCase for components, camelCase for functions
- **File structure**: Component → helpers → types

### TypeScript
- Avoid `any`, use `unknown` or proper types
- Prefer `interface` for object shapes, `type` for unions
- Use Drizzle's inferred types: `typeof table.$inferSelect`
- Server Actions return typed results

### Styling
- Tailwind utility classes, no CSS modules
- CSS variables in `globals.css`: `--background`, `--foreground`
- Dark mode via `prefers-color-scheme`
- Component variants via `class-variance-authority`

### Server Actions
- File-level `'use server'` directive
- Validate auth and authorization first
- Use Drizzle transactions for multi-step operations
- Return structured responses: `{ success, data?, error? }`
- Call `revalidatePath()` after mutations

## Common Workflows

### Adding a New Feature
1. Update database schema in `src/db/schema/`
2. Run `pnpm db:generate` and `pnpm db:push`
3. Create Server Action in `app/actions/` or `src/lib/actions/`
4. Build UI components in `components/`
5. Create page/route in `app/`
6. Test with `pnpm dev` and manual verification
7. Document in `docs/` if complex

### User Management
```bash
pnpm user:list                # See all users
pnpm user:approve-admin       # Promote user to admin
pnpm user:check               # Check specific user
```

### Testing Database Changes
```bash
pnpm db:studio                # Visual database browser
pnpm db:stats                 # Check table sizes/counts
pnpm db:seed                  # Reset with seed data
```

### Telemetry Development

**Local Development (PM2):**
```bash
pnpm telemetry:5min           # Generate 5min of data
pnpm telemetry:check          # Verify data
pnpm telemetry:pm2:start      # Start continuous generation
pnpm telemetry:pm2:logs       # View generation logs
pnpm telemetry:pm2:status     # Check PM2 status
pnpm telemetry:pm2:stop       # Stop generation
```

**Production (Vercel Cron):**
- Configured in `vercel.json` to run every 5 minutes (`*/5 * * * *`)
- Endpoint: `/api/cron/telemetry` (authenticated with `CRON_SECRET`)
- Processes all active sites in parallel (~10 seconds on Pro plan)
- Manual trigger: `curl -H 'Authorization: Bearer $CRON_SECRET' https://your-app.vercel.app/api/cron/telemetry`
- View logs: Vercel Dashboard → Functions → `/api/cron/telemetry`

**PM2 Setup Note**: PM2 configuration (`ecosystem.config.js`) uses `dotenv-cli` to load `.env.local`. Ensure PM2 is installed globally: `npm install -g pm2`

## Important Notes

### Next.js 16 Changes
- Middleware → Proxy (deprecation warning, still works)
- React 19 automatic JSX runtime
- Turbopack as default dev bundler
- Enhanced Server Actions support

### Tailwind CSS v4
- New `@import "tailwindcss"` syntax (not `@tailwind`)
- `@theme inline` for customization
- PostCSS plugin approach

### Stack Auth Specifics
- Token store: `nextjs-cookie`
- Server-only via `stackServerApp` (not `StackProvider`)
- Client usage via `useUser()` hook requires Suspense boundaries
- Redirect URLs: `/login`, `/dashboard`, `/`
- **Type Assertion Required**: Use `(app as any).signOut()` due to Stack Auth v2.8.47 type inference issue
- Client app configured in `app/stack-client.ts`, server app in `app/stack.ts`

### Database Considerations
- Use `DATABASE_URL` (pooled) for queries
- Use `POSTGRES_PRISMA_URL` for schema operations
- Drizzle Kit interactive mode requires manual confirmation
- Audit logs exist but require table creation (`user_audit_log`)

### Known Issues
- 92 existing linter warnings (not blocking)
- Missing Suspense boundaries in some components
- `middleware.ts` deprecation (rename to `proxy.ts` in future)
- Email notifications log to console (need service configuration)
- Stack Auth `signOut()` requires type assertion: `(app as any).signOut()`

## Deployment

**GitHub**: https://github.com/bitobit-development/bms-dashboard
- Auto-deploy to Vercel on push to `main`

**Vercel**:
- Project: `bms-dashboard`
- Organization: `bit2bits-projects`
- Plan: Pro (required for 60-second function timeout)
- Environment variables synced from Neon + `CRON_SECRET`
- Cron Jobs: `/api/cron/telemetry` runs every 5 minutes
- Latest: https://bms-dashboard-bit2bits-projects.vercel.app

## Authentication Page Design Pattern

All authentication-related pages follow a consistent design:

**Pattern Structure:**
```typescript
<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
  <Card className="max-w-md w-full">
    <CardHeader className="text-center space-y-2">
      <div className="mx-auto w-12 h-12 bg-[color]-100 dark:bg-[color]-900/20 rounded-full flex items-center justify-center mb-2">
        <Icon className="h-6 w-6 text-[color]-600 dark:text-[color]-400" />
      </div>
      <CardTitle className="text-2xl">[Title]</CardTitle>
      <CardDescription>[Description]</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Page content */}
    </CardContent>
  </Card>
</div>
```

**Color Scheme:**
- 🔵 Blue (Loader2) = Loading/In Progress (`login-loading.tsx`)
- 🟡 Amber (Clock) = Pending/Waiting (`pending-approval.tsx`)
- 🟢 Green (CircleCheck) = Success/Active (`already-signed-in.tsx`)
- 🔴 Red (CircleX) = Error/Inactive (`account-inactive.tsx`)

**Loading States:**
- `app/loading.tsx` - Root loading
- `app/(auth)/loading.tsx` - Auth routes loading
- `app/handler/loading.tsx` - Stack Auth handler loading
- `app/dashboard/loading.tsx` - Dashboard loading

All loading states use `LoginLoading` component for consistency.

## Data Usage Reports & PDF Export

### Network Usage Tracking

**Feature**: Track bandwidth utilization, data consumption, and network latency across all sites with date range filtering.

**Key Components:**
- **Page**: `/app/dashboard/data-usage/page.tsx` - Overview with summary stats, search, site cards
- **Detail Page**: `/app/dashboard/data-usage/[siteId]/page.tsx` - Individual site metrics with charts
- **Server Actions**: `/app/actions/network-usage.ts` - 6 actions for data fetching, aggregation, export

**Data Tables:**
- `network_telemetry` - Raw hourly metrics (upload/download speed, latency, data consumed)
- `network_daily_aggregates` - Daily rollups with min/max/avg calculations
- `network_monthly_aggregates` - Monthly summaries

**Seed Data:**
- Run `pnpm db:seed:network` to generate realistic randomized data
- Per-site characteristics: base utilization (40-95%), latency (10-50ms), reliability (70-100%)
- Temporal patterns: time-of-day variations, seasonal trends, weekend effects
- Random anomalies: outages, latency spikes, bandwidth congestion

**Export Formats:**
- CSV: Tabular data export with all metrics
- JSON: Structured data for API consumption
- PDF: Professional reports with executive summary (see below)

### PDF Export System

**Architecture**: Background job processing with real-time progress tracking and Vercel Blob storage.

**Key Files:**
- **Server Actions**: `/app/actions/pdf-exports.ts` - 7 actions (start, check progress, cancel, delete, history, cleanup, process)
- **PDF Engine**: `/lib/pdf/` - React PDF document generation
  - `NetworkUsageDocument.tsx` - Main PDF template
  - `components/CoverPage.tsx` - Professional branding
  - `components/ExecutiveSummary.tsx` - KPIs, health distribution, insights
  - `components/SiteDetailPage.tsx` - Individual site metrics tables
  - `styles.ts` - Consistent PDF styling
  - `utils/dataTransform.ts` - Data formatting helpers

**UI Components** (`/components/dashboard/data-usage/`):
- `pdf-export-modal.tsx` - Configuration dialog (date range, site selection)
- `pdf-progress-modal.tsx` - Real-time progress tracking with 2s polling
- `export-history.tsx` - Last 10 exports with status, download links

**Job Processing Flow:**
1. User configures export (date range, sites) and clicks "PDF"
2. `startPdfExport()` creates job in `pdf_export_jobs` table with `status='pending'`
3. Background `processJob()` runs:
   - Fetches network data in batches (20 sites per query)
   - Updates progress (0-100%) after each batch
   - Generates PDF using `@react-pdf/renderer`
   - Uploads to Vercel Blob with 48-hour expiry
   - Updates job with `download_url` and `status='completed'`
4. Frontend polls `checkPdfProgress()` every 2 seconds
5. On completion, auto-downloads PDF and shows download button

**Database Table** (`pdf_export_jobs`):
- Tracks: status (pending/processing/completed/failed/cancelled)
- Progress: 0-100% with processed_sites / total_sites
- Metadata: date range, site IDs, file size, download URL
- Expiry: Vercel Blob URLs expire after 48 hours

**Performance:**
- Batch processing: 10 sites per batch for PDF generation
- Parallel data fetching: 20 sites per query
- Estimated time: 15-20 seconds for 120 sites
- Vercel Pro plan: 60-second timeout for large exports

**File Naming Convention:**
- Format: `{startDate}_{endDate}_{siteCount}sites_{randomId}.pdf`
- Example: `2025-01-01_2025-01-31_131sites_a1b2c3d4.pdf`
- Random suffix: 8-character hex string for uniqueness

**Export History Features:**
- View PDF in new browser tab via "View" button
- Download PDF with proper filename via "Download" button
- Delete export (removes from Vercel Blob and database)
- Confirmation dialog before deletion

**Manual Setup Required:**
```bash
# 1. Create database table
pnpm db:push  # Select "Yes" for pdf_export_jobs table

# 2. Set Vercel Blob token in .env.local
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# 3. Seed network data (optional, for testing)
pnpm db:seed:network
```

## Bug Fix Documentation

All bug fixes should be documented in `docs/fix_bugs/` with:
- Problem description and root cause
- Solution implementation details
- Code references with file:line format
- Testing instructions
- Follow-up improvements

**Recent Fixes:**
- `user-signup-approval-sync.md` - User approval workflow implementation
- `pending-user-bypass-authorization.md` - Fixed pending users accessing dashboard
- `signup-redirect-already-signed-in.md` - Fixed signup redirect flow
- `custom-already-signed-in-page.md` - Custom auth page implementation
- `login-loading-design-inconsistency.md` - Consistent loading states
