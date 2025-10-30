# Feature Specification: Live Time Information Display

## Overview
Enhance the BMS Dashboard with live time information to provide users with clear temporal context for their site monitoring data. This includes a live current time display and per-site last checked timestamps.

## Current State Analysis

### Existing Time-Related Features
- **Dashboard Last Updated**: Uses `formatDistanceToNow()` showing "Updated X ago" near refresh button (line 66, dashboard/page.tsx)
- **Site Cards Last Seen**: Shows relative time like "about 23 hours ago" on each site card (line 145, site-card.tsx)
- **Data Polling**: Uses `useRealtimeData` hook with 60-second intervals for data refresh
- **Telemetry Timestamps**: Each telemetry reading has a `timestamp` field in the database

### Current Time Display Locations
1. `/app/dashboard/page.tsx` (line 64-68): Last updated timestamp near refresh button
2. `/components/dashboard/site-card.tsx` (line 143-147): Last seen timestamp on site cards
3. Multiple pages using `formatDistanceToNow` from date-fns library

### Data Flow
```
Database (telemetryReadings.timestamp)
  ↓
Server Actions (getSites, getSystemStats)
  ↓
useRealtimeData Hook (60s polling)
  ↓
lastUpdated state + site.lastSeenAt
  ↓
formatDistanceToNow (date-fns)
  ↓
Display: "Updated X ago" / "about 23 hours ago"
```

## Feature Requirements

### 1. Live Current Time Display
**Goal**: Display a continuously updating clock on the dashboard

**Specifications**:
- **Update Frequency**: Every 1 second
- **Format Options**:
  - Option A: `HH:mm:ss` (24-hour format) - e.g., "14:32:15"
  - Option B: `h:mm:ss A` (12-hour format) - e.g., "2:32:15 PM"
  - Option C: Include date - e.g., "Oct 30, 2025 2:32 PM"
- **Timezone**: System timezone (user's local time)
- **Location**: Near "Updated X ago" text in dashboard header (line 64-68)
- **Visual Design**:
  - Subtle, not distracting
  - Consistent with existing muted text style
  - Optional clock icon (Clock from lucide-react)

### 2. Last Checked Time Per Site
**Goal**: Show when each site's data was last received

**Specifications**:
- **Data Source**: `site.lastSeenAt` timestamp from database
- **Format Options**:
  - Option A: Relative time only - "Last checked 23 hours ago"
  - Option B: Absolute + Relative - "Last checked: Oct 29, 3:45 PM (23 hours ago)"
  - Option C: Conditional display - Absolute if > 1 hour, relative if < 1 hour
- **Update Trigger**: When new data arrives (after refresh)
- **Location**: Replace existing relative time on site cards (line 143-147)
- **Visual Design**:
  - Clock icon next to text
  - Color coding based on freshness:
    - Green: < 5 minutes
    - Yellow: 5-60 minutes
    - Orange: 1-24 hours
    - Red: > 24 hours

## Technical Design

### Component Architecture

#### 1. LiveClock Component
**File**: `/components/ui/live-clock.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'

interface LiveClockProps {
  showIcon?: boolean
  format?: '24h' | '12h' | 'full'
  className?: string
}

export function LiveClock({
  showIcon = true,
  format: timeFormat = '24h',
  className
}: LiveClockProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatString = {
    '24h': 'HH:mm:ss',
    '12h': 'h:mm:ss a',
    'full': 'MMM dd, yyyy h:mm:ss a'
  }[timeFormat]

  return (
    <div className={className}>
      {showIcon && <Clock className="h-4 w-4 inline mr-1" />}
      <span className="tabular-nums">
        {format(currentTime, formatString)}
      </span>
    </div>
  )
}
```

**Key Features**:
- Client component with useState and useEffect
- 1-second update interval
- Cleanup on unmount to prevent memory leaks
- Configurable format and icon display
- Tabular numbers for consistent width

**Performance Considerations**:
- Uses React.memo if needed to prevent unnecessary parent re-renders
- Interval cleanup prevents memory leaks
- Lightweight - only updates time display, no heavy computation

#### 2. LastCheckedDisplay Component
**File**: `/components/dashboard/last-checked-display.tsx`

```typescript
'use client'

import { Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'

interface LastCheckedDisplayProps {
  timestamp: Date | string
  showAbsoluteTime?: boolean
  className?: string
}

export function LastCheckedDisplay({
  timestamp,
  showAbsoluteTime = false,
  className
}: LastCheckedDisplayProps) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const minutesSinceUpdate = Math.floor((Date.now() - date.getTime()) / (1000 * 60))

  const getFreshnessColor = () => {
    if (minutesSinceUpdate < 5) return 'text-green-600'
    if (minutesSinceUpdate < 60) return 'text-yellow-600'
    if (minutesSinceUpdate < 1440) return 'text-orange-600'
    return 'text-red-600'
  }

  const relativeTime = formatDistanceToNow(date, { addSuffix: true })
  const absoluteTime = format(date, 'MMM dd, h:mm a')

  return (
    <div className={cn('flex items-center gap-1 text-xs', getFreshnessColor(), className)}>
      <Clock className="h-3 w-3" />
      <span>
        {showAbsoluteTime && minutesSinceUpdate > 60
          ? `${absoluteTime} (${relativeTime})`
          : `Last checked ${relativeTime}`
        }
      </span>
    </div>
  )
}
```

**Key Features**:
- Server-compatible (no intervals needed)
- Color-coded freshness indicators
- Conditional absolute/relative time display
- Handles both Date objects and ISO strings
- Icon integration

#### 3. Integration Points

**Dashboard Page** (`/app/dashboard/page.tsx`):
```typescript
// Add to line 63-68, replace existing time display section
<div className="flex items-center gap-4">
  <LiveClock
    format="12h"
    className="text-sm text-muted-foreground"
  />
  {lastUpdated && (
    <span className="text-sm text-muted-foreground">
      Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
    </span>
  )}
  <Button
    variant="outline"
    size="sm"
    onClick={refresh}
    disabled={sitesLoading}
  >
    <RefreshCw className={`h-4 w-4 mr-2 ${sitesLoading ? 'animate-spin' : ''}`} />
    Refresh
  </Button>
</div>
```

**Site Card** (`/components/dashboard/site-card.tsx`):
```typescript
// Replace lines 143-147
{lastSeenAt && (
  <LastCheckedDisplay
    timestamp={lastSeenAt}
    showAbsoluteTime={true}
  />
)}
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Live Current Time (LiveClock Component)                │
│                                                         │
│  Browser Time API → useState → setInterval (1s)        │
│       ↓                                                 │
│  format(currentTime) → Display                         │
│                                                         │
│  Cleanup: clearInterval on unmount                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Last Checked Per Site (LastCheckedDisplay)             │
│                                                         │
│  Database (telemetryReadings.timestamp)                │
│       ↓                                                 │
│  Server Action (getSites) → site.lastSeenAt            │
│       ↓                                                 │
│  useRealtimeData (60s polling) → sites state           │
│       ↓                                                 │
│  SiteCard receives site.lastSeenAt                     │
│       ↓                                                 │
│  LastCheckedDisplay calculates freshness               │
│       ↓                                                 │
│  Color-coded display with relative/absolute time       │
└─────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Create Core Components (30 min)
**Tasks**:
1. Create `/components/ui/live-clock.tsx` component
2. Create `/components/dashboard/last-checked-display.tsx` component
3. Add necessary imports (date-fns already installed)
4. Write unit tests for time formatting logic

**Deliverables**:
- LiveClock component with 1s update interval
- LastCheckedDisplay component with color coding
- Both components tested and working

**Testing Checklist**:
- [ ] LiveClock updates every second
- [ ] LiveClock cleanup works (no memory leaks)
- [ ] Time formats correctly in 24h/12h modes
- [ ] LastCheckedDisplay shows correct relative time
- [ ] Color coding works for all time ranges
- [ ] Components handle invalid timestamps gracefully

### Phase 2: Dashboard Integration (20 min)
**Tasks**:
1. Import LiveClock into `/app/dashboard/page.tsx`
2. Add LiveClock next to "Updated X ago" text (line 64)
3. Style to match existing muted text design
4. Verify layout responsiveness

**Deliverables**:
- Live clock displayed in dashboard header
- Responsive layout maintained
- No visual regression

**Testing Checklist**:
- [ ] Clock visible in header
- [ ] Updates every second
- [ ] Doesn't cause layout shifts
- [ ] Works on mobile/tablet viewports
- [ ] Matches design system styling

### Phase 3: Site Card Integration (20 min)
**Tasks**:
1. Import LastCheckedDisplay into `/components/dashboard/site-card.tsx`
2. Replace existing time display (line 143-147)
3. Add conditional absolute time for old readings
4. Verify color coding works

**Deliverables**:
- Last checked time on each site card
- Color-coded freshness indicators
- Improved temporal awareness

**Testing Checklist**:
- [ ] Displays on all site cards
- [ ] Color changes based on freshness
- [ ] Absolute time shows for old readings
- [ ] Updates when data refreshes
- [ ] Icon aligns properly

### Phase 4: Cross-Platform Testing (15 min)
**Tasks**:
1. Test on different browsers (Chrome, Safari, Firefox)
2. Test on mobile devices
3. Verify timezone handling
4. Performance profiling

**Deliverables**:
- Cross-browser compatibility confirmed
- Mobile experience optimized
- Performance benchmarks met

**Testing Checklist**:
- [ ] Works in Chrome, Safari, Firefox
- [ ] Mobile layout correct
- [ ] Timezone displays correctly
- [ ] No performance degradation
- [ ] Accessible (screen reader compatible)

### Phase 5: Polish & Documentation (15 min)
**Tasks**:
1. Add JSDoc comments to components
2. Update CLAUDE.md if needed
3. Add feature to project README
4. Create user-facing documentation

**Deliverables**:
- Well-documented code
- User guide for time features
- Updated project documentation

## UI/UX Considerations

### Time Display Formats

#### Dashboard Header - Live Clock
**Recommended Format**: 12-hour with seconds
- Example: "2:32:15 PM"
- Rationale: Familiar to most users, includes seconds for "live" feel
- Alternative: 24-hour for technical users

**Visual Design**:
```
┌────────────────────────────────────────────────┐
│ Dashboard                                      │
│ Welcome back, Admin User                       │
│                                                │
│         [Clock Icon] 2:32:15 PM               │
│         Updated less than a minute ago        │
│         [Refresh Button]                       │
└────────────────────────────────────────────────┘
```

#### Site Cards - Last Checked
**Recommended Format**: Conditional display
- Recent (< 1 hour): "Last checked 5 minutes ago" (green)
- Moderate (1-24 hours): "Last checked Oct 29, 3:45 PM (23 hours ago)" (orange)
- Stale (> 24 hours): "Last checked Oct 28, 10:30 AM (2 days ago)" (red)

**Visual Design**:
```
┌────────────────────────────────────┐
│ Site Name                [Online] │
│ Location                           │
│ [Clock] Last checked 5 min ago    │ ← Green color
│                                    │
│ [Battery Gauge]  [Metrics]        │
└────────────────────────────────────┘
```

### Color Coding Strategy

**Freshness Indicators**:
| Time Range | Color | Tailwind Class | User Perception |
|------------|-------|----------------|-----------------|
| 0-5 min | Green | text-green-600 | Real-time, fresh |
| 5-60 min | Yellow | text-yellow-600 | Recent, acceptable |
| 1-24 hours | Orange | text-orange-600 | Outdated, concerning |
| > 24 hours | Red | text-red-600 | Stale, needs attention |

### Accessibility
- **Screen Readers**: Use semantic time elements with aria-labels
- **Color Blindness**: Don't rely solely on color; include icons
- **Keyboard Navigation**: Ensure all interactive elements are accessible
- **Motion**: No rapid animations, smooth 1s transitions

### Responsive Design
- **Desktop**: Full format with icons
- **Tablet**: Abbreviated format, icons remain
- **Mobile**: Compact format, stack if needed

## Testing Checklist

### Functional Testing
- [ ] Live clock updates every second without fail
- [ ] Live clock shows correct time (verify against system time)
- [ ] Live clock cleanup works (no memory leaks after unmount)
- [ ] Time formats correctly in all modes (24h, 12h, full)
- [ ] Last checked display shows correct relative time
- [ ] Last checked display color codes correctly
- [ ] Absolute time displays for readings > 1 hour old
- [ ] Components handle null/undefined timestamps gracefully
- [ ] Components handle invalid date strings gracefully
- [ ] Timezone displays correctly (system timezone)

### Integration Testing
- [ ] Dashboard header layout doesn't break
- [ ] Site cards layout remains intact
- [ ] Live clock doesn't trigger parent re-renders
- [ ] Last checked updates when data refreshes
- [ ] Multiple site cards all show correct times
- [ ] Refresh button still works as expected
- [ ] No console errors or warnings

### Performance Testing
- [ ] Live clock doesn't cause performance degradation
- [ ] Page load time not impacted
- [ ] Smooth rendering with 5+ site cards
- [ ] No layout shifts (CLS score maintained)
- [ ] Memory usage stable over 10+ minutes
- [ ] CPU usage minimal (< 1% for clock updates)

### Cross-Browser Testing
- [ ] Chrome/Chromium (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Visual/UI Testing
- [ ] Live clock aligns properly in header
- [ ] Font size matches surrounding text
- [ ] Icons sized correctly (h-3, h-4 classes)
- [ ] Color coding visible and distinct
- [ ] Spacing consistent with design system
- [ ] No visual regressions on existing elements
- [ ] Responsive breakpoints work (md, lg)
- [ ] Dark mode support (if applicable)

### Accessibility Testing
- [ ] Screen reader announces time updates appropriately
- [ ] Time elements have proper ARIA labels
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] No reliance on color alone for information

### User Experience Testing
- [ ] Time information is easily noticeable
- [ ] Live clock doesn't distract from main content
- [ ] Last checked time is clear and understandable
- [ ] Color coding intuition matches user expectations
- [ ] Overall temporal awareness improved
- [ ] No confusion about timezone/format

## Edge Cases & Error Handling

### Edge Cases to Handle
1. **Invalid Timestamps**:
   - Null or undefined timestamps
   - Invalid date strings
   - Future dates (clock drift)
   - Very old dates (years ago)

2. **Timezone Issues**:
   - User changes timezone while app is open
   - Daylight saving time transitions
   - Server timezone vs client timezone

3. **Performance Edge Cases**:
   - Page backgrounded (browser throttling)
   - Many site cards (100+)
   - Slow devices/browsers

4. **Data Edge Cases**:
   - Site never checked (no lastSeenAt)
   - Site just added (lastSeenAt is current time)
   - Telemetry service down (no new timestamps)

### Error Handling Strategy

```typescript
// Example: Safe timestamp handling
function safeFormatTime(timestamp: Date | string | null | undefined): string {
  try {
    if (!timestamp) return 'Never'

    const date = typeof timestamp === 'string'
      ? new Date(timestamp)
      : timestamp

    if (isNaN(date.getTime())) return 'Invalid date'
    if (date.getTime() > Date.now()) return 'Just now' // Future date
    if (date.getTime() < Date.now() - 365 * 24 * 60 * 60 * 1000) {
      return format(date, 'MMM dd, yyyy') // > 1 year ago
    }

    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.error('Error formatting time:', error)
    return 'Unknown'
  }
}
```

## Dependencies

### Existing Dependencies (Already Installed)
- `date-fns`: Time formatting and manipulation
- `lucide-react`: Clock icon
- `react`: useState, useEffect hooks
- `tailwindcss`: Styling classes

### No New Dependencies Required
All functionality can be implemented with existing packages.

## Success Metrics

### Technical Metrics
- Live clock updates with 99.9% accuracy (< 1s drift)
- Memory usage increase < 5MB
- CPU usage for clock < 1%
- Zero console errors
- Page load time impact < 50ms

### User Experience Metrics
- Users can identify stale data at a glance (color coding)
- Temporal awareness improved (qualitative feedback)
- No confusion about time display (< 5% support queries)
- Feature adoption (monitoring analytics if available)

### Business Metrics
- Reduced time to identify offline sites
- Improved monitoring response time
- Increased user confidence in data freshness

## Future Enhancements

### Phase 2 Features (Future)
1. **User Preferences**:
   - Allow users to choose 12h vs 24h format
   - Timezone selection option
   - Show/hide live clock preference

2. **Advanced Time Features**:
   - Time range picker for historical data
   - "Last updated" tooltip with full timestamp
   - Automatic alert for stale data (> configurable threshold)

3. **Performance Optimizations**:
   - Use Web Workers for clock updates (if needed)
   - Batch time updates for multiple cards
   - Smart update intervals (slower when backgrounded)

4. **Enhanced Visualizations**:
   - Sparkline showing update frequency
   - Heat map of site update patterns
   - Timeline view of telemetry arrivals

## Implementation Prompt for Agent

Use this specification to implement the live time information feature. Follow these guidelines:

1. **Start with Phase 1**: Create both components in isolation first
2. **Test thoroughly**: Verify each component works before integration
3. **Integrate incrementally**: Dashboard first, then site cards
4. **Use existing patterns**: Follow current codebase conventions
5. **Maintain performance**: Profile before/after implementation
6. **Document changes**: Add JSDoc comments and update docs

### Agent Instructions
```
You are implementing the Live Time Information Display feature for the BMS Dashboard.

Context:
- Project uses Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Client components require 'use client' directive
- date-fns is already installed for time formatting
- Current relative time uses formatDistanceToNow from date-fns
- Dashboard polling happens every 60 seconds via useRealtimeData hook

Tasks:
1. Create LiveClock component in /components/ui/live-clock.tsx
   - Use useState and useEffect for 1-second interval
   - Support 24h, 12h, and full formats
   - Clean up interval on unmount
   - Use tabular-nums for consistent width

2. Create LastCheckedDisplay component in /components/dashboard/last-checked-display.tsx
   - Accept timestamp prop (Date | string)
   - Calculate freshness and apply color coding
   - Show conditional absolute/relative time
   - Include Clock icon from lucide-react

3. Integrate LiveClock into /app/dashboard/page.tsx
   - Add near line 64 (next to "Updated X ago")
   - Use 12h format by default
   - Match existing muted text styling

4. Integrate LastCheckedDisplay into /components/dashboard/site-card.tsx
   - Replace lines 143-147
   - Pass site.lastSeenAt as timestamp
   - Enable showAbsoluteTime for old readings

5. Test the implementation:
   - Verify clock updates every second
   - Check color coding on site cards
   - Ensure no layout breaks
   - Test on mobile viewport
   - Check for memory leaks (unmount/remount)

After implementation:
- Use Playwright MCP to visually verify the feature
- Navigate to dashboard and take screenshot
- Verify live clock is updating
- Verify site cards show color-coded timestamps
- Document any issues or deviations from spec

Follow the project's coding standards:
- Use functional components
- Prefer Server Components (use 'use client' only when needed)
- Use Tailwind utility classes
- Add proper TypeScript types
- Handle edge cases (null, undefined timestamps)
```

## Notes for Implementation

### Important Considerations
1. **'use client' Directive**: Both new components need this since they use hooks
2. **Interval Cleanup**: Critical to prevent memory leaks
3. **Tabular Numbers**: Use `tabular-nums` class for consistent width
4. **Color Accessibility**: Test color contrast ratios
5. **Performance**: Monitor re-render frequency
6. **Timezone**: Use user's local timezone (browser default)

### Don't Forget
- Import Clock icon from lucide-react
- Import format and formatDistanceToNow from date-fns
- Export components properly
- Add proper TypeScript interfaces
- Handle null/undefined timestamps
- Test interval cleanup (unmount component)

### Best Practices
- Keep components simple and focused
- Avoid over-engineering (no complex state management needed)
- Follow existing code style in the project
- Use project's utility classes (cn from lib/utils)
- Leverage existing UI components (Badge, Card, etc.)

## Conclusion

This feature enhances the BMS Dashboard by providing users with clear, real-time temporal context. The live clock gives instant awareness of current time, while color-coded last checked timestamps help users quickly identify sites with stale data.

The implementation is straightforward, performant, and follows React best practices. By using existing dependencies and patterns, the feature integrates seamlessly into the current architecture.

Expected development time: ~2 hours including testing and polish.
