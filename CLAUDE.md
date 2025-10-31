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

**Key Relationships:**
- Organizations have many users and sites
- Sites have equipment and telemetry
- Users have roles: `owner`, `admin`, `operator`, `viewer`
- User status flow: `pending` → `active` (or `inactive`/`suspended`)

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
- PM2 process generates continuous telemetry data
- Inserts to `telemetry_readings` table
- Background jobs aggregate to hourly/daily tables
- Real-time dashboard updates via polling

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

### Backend
- **Drizzle ORM 0.44.7** - Type-safe SQL query builder
- **Neon PostgreSQL** - Serverless Postgres with pooling
- **Stack Auth 2.8.47** - Authentication via Neon integration
- **Server Actions** - No API routes, actions in `app/actions/`

### Dev Tools
- **ESLint 9** - Linting with Next.js config
- **Drizzle Kit** - Schema migrations and studio
- **tsx** - TypeScript execution for scripts
- **PM2** - Process manager for telemetry generation

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
```bash
pnpm telemetry:5min           # Generate 5min of data
pnpm telemetry:check          # Verify data
pnpm telemetry:pm2:start      # Start continuous generation
pnpm telemetry:pm2:logs       # View generation logs
```

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

## Deployment

**GitHub**: https://github.com/bitobit-development/bms-dashboard
- Auto-deploy to Vercel on push to `main`

**Vercel**:
- Project: `bms-dashboard`
- Organization: `bit2bits-projects`
- Environment variables synced from Neon
- Latest: https://bms-dashboard-3d09a3wrc-bit2bits-projects.vercel.app

## Bug Fix Documentation

All bug fixes should be documented in `docs/fix_bugs/` with:
- Problem description and root cause
- Solution implementation details
- Code references with file:line format
- Testing instructions
- Follow-up improvements

See `docs/fix_bugs/user-signup-approval-sync.md` for reference template.
