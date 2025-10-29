# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16.0.1 project (App Router) with React 19, TypeScript, and Tailwind CSS v4. The project is a BMS (Battery Management System) Dashboard that uses the standard Next.js App Router architecture.

## Development Commands

- **Dev server**: `pnpm dev` (runs on http://localhost:3000)
- **Build**: `pnpm build`
- **Production**: `pnpm start`
- **Lint**: `pnpm lint`

Note: This project uses `pnpm` as its package manager based on user's global configuration.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **React**: v19.2.0 (latest)
- **Styling**: Tailwind CSS v4 with PostCSS
- **TypeScript**: Strict mode enabled
- **Fonts**: Geist Sans and Geist Mono (optimized via next/font)

### Directory Structure
- `app/`: Next.js App Router pages and layouts
  - `layout.tsx`: Root layout with font configuration
  - `page.tsx`: Home page component
  - `globals.css`: Global Tailwind styles
- `public/`: Static assets (SVG icons)
- `@/*`: Path alias maps to project root

### TypeScript Configuration
- Target: ES2017
- Strict mode enabled
- Module resolution: bundler
- Path aliases: `@/*` points to root directory
- JSX mode: react-jsx (React 19 automatic runtime)

### ESLint Configuration
- Uses Next.js recommended config with Core Web Vitals
- TypeScript support enabled
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Key Patterns

### Font Loading
Fonts are loaded using `next/font/google` with CSS variables:
- `--font-geist-sans` for sans-serif
- `--font-geist-mono` for monospace

### Styling Approach
- Tailwind CSS with utility-first classes
- Dark mode support via `dark:` prefix
- Responsive design with breakpoint prefixes (`sm:`, `md:`)
