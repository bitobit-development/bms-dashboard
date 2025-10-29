# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BMS (Battery Management System) Dashboard - A Next.js 16.0.1 application with React 19, TypeScript, and Tailwind CSS v4, integrated with Neon PostgreSQL and Stack Auth.

## Development Commands

- **Dev server**: `pnpm dev` (runs on http://localhost:3000)
- **Build**: `pnpm build`
- **Production**: `pnpm start`
- **Lint**: `pnpm lint`

**Package Manager**: This project uses `pnpm`. No lock file is currently committed.

## Environment Setup

### Required Environment Variables (.env.local)

**Database (Neon PostgreSQL):**
- `DATABASE_URL` - Pooled connection via pgbouncer (recommended for most uses)
- `DATABASE_URL_UNPOOLED` - Direct connection without pgbouncer
- `POSTGRES_PRISMA_URL` - Connection with timeout for schema operations
- `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_NO_SSL` - Alternative connection formats
- `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual connection parameters

**Authentication (Stack Auth via Neon):**
- `NEXT_PUBLIC_STACK_PROJECT_ID` - Public project identifier
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` - Public client key
- `STACK_SECRET_SERVER_KEY` - Secret server key (never expose to client)

**Note**: `.env.local` is gitignored. All production environment variables are synced to Vercel.

## Tech Stack

- **Framework**: Next.js 16.0.1 (App Router)
- **React**: 19.2.0 (latest with React 19 features)
- **TypeScript**: v5 with strict mode
- **Styling**: Tailwind CSS v4 with PostCSS plugin
- **Fonts**: Geist Sans & Geist Mono (via next/font/google)
- **Database**: Neon PostgreSQL (serverless Postgres)
- **Auth**: Stack Auth (Neon Auth integration)
- **Deployment**: Vercel (auto-deploy from GitHub main branch)
- **Linting**: ESLint 9 with Next.js config

## Architecture

### App Router Structure
```
app/
├── layout.tsx          # Root layout with font configuration
├── page.tsx            # Home page (Server Component)
├── globals.css         # Tailwind CSS with theme configuration
└── favicon.ico         # App icon
```

### Key Patterns

**Server Components by Default:**
- All components in `app/` are React Server Components unless marked with `'use client'`
- Minimize client components; only use for interactivity, state, effects, browser APIs

**Styling:**
- Tailwind v4 with `@import "tailwindcss"` in globals.css
- CSS variables for theming: `--background`, `--foreground`
- `@theme inline` directive for Tailwind theme customization
- Automatic dark mode via `prefers-color-scheme`
- Font variables: `--font-geist-sans`, `--font-geist-mono`

**TypeScript Configuration:**
- Target: ES2017
- Module resolution: bundler
- Path alias: `@/*` maps to project root
- JSX: react-jsx (React 19 automatic runtime)
- Strict mode enabled

## Database Architecture (Not Yet Implemented)

Expected patterns when database is integrated:
- **ORM**: Drizzle ORM (type-safe, lightweight)
- **Migrations**: Use Drizzle Kit for zero-downtime migrations
- **Connection**: Use `DATABASE_URL` for queries, `POSTGRES_PRISMA_URL` for schema operations
- **Pooling**: Connection pooling via Neon's pgbouncer (DATABASE_URL includes pooler)

## Authentication (Not Yet Implemented)

Stack Auth integration via Neon:
- Client-side: Use `NEXT_PUBLIC_STACK_*` environment variables
- Server-side: Use `STACK_SECRET_SERVER_KEY` for API operations
- Expected: Server Actions for auth operations, session management

## Deployment

**GitHub**: https://github.com/bitobit-development/bms-dashboard
- Branch: `main`
- Auto-deploy to Vercel on push

**Vercel**:
- Project: `bms-dashboard`
- Organization: `bit2bits-projects`
- Environment variables synced across Production/Preview/Development
- Latest deployment: https://bms-dashboard-3d09a3wrc-bit2bits-projects.vercel.app

## Code Style

**Next.js Best Practices:**
- Prefer Server Components over Client Components
- Use Server Actions for mutations
- Implement proper error boundaries
- Use Suspense for loading states
- Optimize images with next/image
- Implement proper metadata in layouts

**TypeScript:**
- Use functional programming patterns
- Avoid classes; prefer functions and hooks
- Use descriptive variable names (isLoading, hasError, canSubmit)
- Export components first, then helpers, then types

**File Naming:**
- Components: PascalCase.tsx
- Directories: lowercase-with-dashes
- Server Components: default (no 'use client')
- Client Components: add 'use client' directive

## Important Notes

- No testing framework configured yet (consider Jest + React Testing Library)
- No database schema or migrations yet (Drizzle ORM expected)
- No authentication implementation yet (Stack Auth integration pending)
- Tailwind CSS v4 uses new `@import` and `@theme inline` syntax (different from v3)
- React 19 features available (use actions, useFormStatus, useOptimistic, etc.)

## User's Global Instructions (from ~/.claude/CLAUDE.md)

**Server Management:**
- Always check if dev server is running: `lsof -ti:3000`
- If port occupied: `npx kill-port 3000` then start
- Wait 5-10 seconds after starting server before testing

**Testing:**
- After ANY feature change, use Playwright MCP to test in browser
- Use browser_navigate, browser_snapshot, browser_click for UI testing

**Documentation:**
- Use context7 MCP tools for up-to-date library docs
- Update subagents with current documentation before starting work

**Bug Fixes:**
- Document bugs in `docs/fix_bugs/` with MD files
- Include bug description and fix details

**File Management:**
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files over creating new ones
- NEVER proactively create documentation files unless explicitly requested
