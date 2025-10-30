# Navigation Patterns - Account Settings

## Overview

This document describes the navigation patterns implemented for the BMS Dashboard, with a focus on the account settings navigation enhancement that provides persistent access to dashboard navigation while users configure their account settings.

## Architecture

### Layout Structure

The application uses Next.js App Router with nested layouts:

```
app/
├── dashboard/
│   ├── layout.tsx          # Main dashboard layout
│   └── [pages]/            # Dashboard pages
└── handler/
    └── [...stack]/
        ├── layout.tsx      # Account settings layout (wraps Stack Auth)
        └── page.tsx        # Stack Auth handler
```

### Navigation Components

**Desktop Navigation:**
- `components/dashboard/sidebar.tsx` - Persistent sidebar (≥768px)
- Visible on all dashboard and account settings pages
- 264px width, fixed position

**Mobile Navigation:**
- `components/dashboard/nav.tsx` - Top navigation bar (<768px)
- `components/dashboard/mobile-nav.tsx` - Hamburger menu sheet
- Collapsible navigation accessible via hamburger icon

**Breadcrumb Navigation:**
- `components/navigation/breadcrumb.tsx` - Contextual page navigation
- Shows: Home icon > Current Page
- Supports all dashboard routes including `/handler/account-settings`

## Navigation Flows

### Desktop Experience

1. **From Dashboard to Account Settings:**
   - User clicks avatar/profile button in sidebar
   - Dropdown menu appears with "Account Settings" option
   - Click navigates to `/handler/account-settings`
   - Sidebar remains visible with subtle highlight on user section

2. **From Account Settings to Dashboard:**
   - User can click any sidebar navigation link
   - User can click Home icon in breadcrumb
   - User can click "Dashboard" text in breadcrumb
   - Navigation maintains context and state

### Mobile Experience

1. **From Dashboard to Account Settings:**
   - User taps hamburger menu icon
   - Sheet menu slides in from left
   - User taps avatar or "Account Settings" in dropdown
   - Navigates to account settings

2. **From Account Settings to Dashboard:**
   - User taps hamburger menu icon
   - Sheet menu displays all navigation options
   - User selects desired page
   - Menu closes and navigates to selected page

## Key Features

### 1. Persistent Navigation

**Problem Solved:** Stack Auth's `fullPage` mode previously isolated users on account settings pages with no way to return to dashboard.

**Solution:** Wrapper layout at `app/handler/[...stack]/layout.tsx` that includes navigation components while preserving Stack Auth functionality.

**Implementation:**
```tsx
export default function HandlerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardNav />  {/* Mobile only */}
      <div className="flex">
        <aside className="hidden md:block">
          <Sidebar />  {/* Desktop only */}
        </aside>
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6 px-6 lg:px-8">
            <Breadcrumb />
            {children}  {/* Stack Auth content */}
          </div>
        </main>
      </div>
    </div>
  )
}
```

### 2. Breadcrumb Navigation

**Purpose:** Provide hierarchical context and quick navigation to parent pages.

**Behavior:**
- Hidden on dashboard home page (`/dashboard`)
- Shows on all other pages including account settings
- Home icon is always clickable, returns to `/dashboard`
- Current page is not clickable (shown as text)

**Routes Supported:**
- `/dashboard` → Hidden
- `/dashboard/sites` → Home > Sites
- `/dashboard/analytics` → Home > Analytics
- `/handler/account-settings` → Home > Account Settings
- All other dashboard routes

### 3. Visual Indicators

**Active Page Highlighting:**
- Sidebar links use `isActive()` function to determine current page
- Active pages show `bg-primary/10` background color
- Active text uses `text-primary` color

**Account Settings Indicator:**
- When on `/handler/account-settings` pages
- Sidebar user section shows `bg-accent/50` background
- Provides subtle visual feedback that user is in settings context

**Implementation:**
```tsx
const isOnAccountSettings = pathname.startsWith('/handler/account-settings')

<div className={cn(
  "border-t p-4 transition-colors",
  isOnAccountSettings && "bg-accent/50"
)}>
  {/* User profile section */}
</div>
```

### 4. Smooth Transitions

**Animation Classes:**
- Main content: `animate-in fade-in duration-300`
- Breadcrumb: `animate-in fade-in slide-in-from-top-2 duration-200`
- User section: `transition-colors`

**Purpose:**
- Provide visual continuity during navigation
- Reduce jarring layout shifts
- Enhance perceived performance

## Responsive Breakpoints

### Mobile (<768px)
- Hide desktop sidebar
- Show mobile navigation bar with hamburger menu
- Full-width content area
- Sheet menu slides in from left

### Desktop (≥768px)
- Show persistent sidebar (264px)
- Hide mobile navigation bar
- Flex layout with sidebar + content area

**CSS:**
```css
/* Sidebar */
.hidden md:block

/* Mobile Nav */
.md:hidden

/* Content Area */
.flex-1
```

## Accessibility

### Keyboard Navigation

✅ **Fully keyboard accessible:**
- Tab through navigation links
- Enter to activate links
- Escape to close mobile menu
- Focus indicators visible on all interactive elements

### Screen Reader Support

✅ **ARIA labels and roles:**
- Navigation landmarks properly labeled
- Button roles for interactive elements
- Alt text for icons

### Focus Management

✅ **Logical focus order:**
1. Skip to main content (if implemented)
2. Brand logo / home link
3. Navigation links (in order)
4. User profile button
5. Main content area

## Performance Optimization

### Dynamic Imports

Navigation components use `next/dynamic` with `{ ssr: false }`:
- Reduces initial bundle size
- Improves Time to First Byte (TTFB)
- Client-side hydration after page load

### Suspense Boundaries

All dynamic components wrapped in Suspense:
- Prevents "NoSuspenseBoundaryError"
- Provides loading fallbacks
- Improves perceived performance

### Component Re-rendering

Minimized unnecessary re-renders:
- `useEffect` with proper dependencies in breadcrumb
- Memoized functions where appropriate
- Conditional rendering based on pathname

## Browser Compatibility

Tested and verified on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Features used:**
- CSS Grid & Flexbox (universally supported)
- Tailwind CSS classes (compiled to standard CSS)
- React 19 features (Server Components, Suspense)
- Next.js App Router (modern browsers)

## Error Handling

### Navigation Errors

**Failed Navigation:**
- Next.js handles routing errors automatically
- Shows error boundary if navigation fails
- User can retry navigation

**Authentication Required:**
- Stack Auth handles redirect to sign-in
- After sign-in, returns to intended page
- Navigation state preserved

### Component Loading Errors

**Dynamic Import Failures:**
- Suspense fallback shows loading state
- Error boundary catches failed imports
- User sees graceful error message

## Testing Checklist

### Phase 1: Foundation ✅
- [x] Sidebar visible on account settings pages (desktop)
- [x] Mobile nav visible on account settings pages (mobile)
- [x] Stack Auth renders correctly within layout
- [x] No breaking changes to authentication flows

### Phase 2: Navigation Enhancement ✅
- [x] Breadcrumb displays correct path
- [x] Active state shows account settings in dropdown
- [x] Sidebar highlights when on settings page
- [x] Smooth transitions between pages

### Phase 3: Polish ✅
- [x] Consistent spacing/padding with dashboard layout
- [x] No layout shifts during navigation
- [x] Performance optimization (dynamic imports, Suspense)

### Phase 4: Testing ✅
- [x] Desktop navigation works (sidebar, breadcrumb)
- [x] Mobile navigation works (hamburger menu)
- [x] Deep linking to `/handler/account-settings` works
- [x] Authentication flows function correctly
- [x] Keyboard navigation accessible
- [x] Browser compatibility verified

## Known Limitations

1. **No Navigation History:**
   - Does not remember last visited dashboard page
   - Always returns to `/dashboard` from breadcrumb home icon
   - Future enhancement: localStorage to track navigation history

2. **No Unsaved Changes Warning:**
   - Navigating away from settings does not prompt for unsaved changes
   - Stack Auth handles its own form state
   - Consider adding if custom settings forms are added

3. **Limited Deep Link Support:**
   - Direct links to specific Stack Auth settings pages work
   - But breadcrumb always shows "Account Settings" (not sub-page)
   - Stack Auth manages its own internal routing

## Future Enhancements

### Short Term

1. **Smart Return Navigation:**
   - Remember last visited dashboard page (localStorage)
   - "Return to [Previous Page]" button
   - Fallback to `/dashboard` if no history

2. **Keyboard Shortcuts:**
   - `Cmd/Ctrl + ,` to open account settings
   - `Esc` to return to dashboard
   - `Cmd/Ctrl + K` for command palette

3. **Settings Quick Access:**
   - Add "Account" to sidebar navigation (optional)
   - Quick settings search in command palette

### Long Term

1. **Navigation History:**
   - Track last 5 visited pages
   - Quick access dropdown to recent pages
   - "Return to where you were" smart navigation

2. **Breadcrumb Enhancement:**
   - Full breadcrumb trail (Dashboard > Section > Page)
   - Breadcrumb dropdown navigation
   - Section-specific breadcrumbs

3. **Mobile App Bar:**
   - Custom app bar for settings on mobile
   - Settings-specific actions
   - PWA integration

## Support

For questions or issues with navigation:
1. Check this documentation first
2. Review `docs/features/account-settings-navigation.md` for detailed specifications
3. Test with Playwright MCP tools for debugging
4. Submit issues to project repository

## Related Files

**Navigation Components:**
- `/components/dashboard/sidebar.tsx`
- `/components/dashboard/nav.tsx`
- `/components/dashboard/mobile-nav.tsx`
- `/components/navigation/breadcrumb.tsx`
- `/lib/navigation.ts`

**Layout Files:**
- `/app/dashboard/layout.tsx`
- `/app/handler/[...stack]/layout.tsx`
- `/app/handler/[...stack]/page.tsx`

**Documentation:**
- `/docs/features/account-settings-navigation.md` (detailed specifications)
- `/docs/navigation-patterns.md` (this file)

---

**Last Updated:** 2025-10-30
**Version:** 1.0
**Status:** Complete - Phases 1-4 ✅
