# BMS Dashboard - Component Reference

## Project Structure

```
/Users/haim/Projects/bms-dashboard/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                 # Login page (Stack Auth ready)
│   ├── actions/
│   │   └── sites.ts                     # Server Actions for data fetching
│   ├── dashboard/
│   │   ├── layout.tsx                   # Dashboard layout wrapper
│   │   ├── page.tsx                     # Main dashboard page
│   │   └── sites/
│   │       └── [siteId]/
│   │           └── page.tsx             # Site detail page with tabs
│   ├── globals.css                      # Global styles with Tailwind v4
│   ├── layout.tsx                       # Root layout with providers
│   ├── page.tsx                         # Home page (redirects to dashboard)
│   └── providers.tsx                    # Client providers wrapper
├── components/
│   ├── charts/
│   │   ├── battery-history-chart.tsx    # Battery charge area chart
│   │   └── solar-load-chart.tsx         # Solar vs load line chart
│   ├── dashboard/
│   │   ├── battery-gauge.tsx            # Circular battery gauge
│   │   ├── nav.tsx                      # Navigation bar with user menu
│   │   ├── power-flow.tsx               # Power flow diagram
│   │   └── site-card.tsx                # Site overview card
│   └── ui/                               # shadcn/ui components (17 components)
├── hooks/
│   └── use-realtime-data.ts             # Custom hook for polling data
├── lib/
│   └── utils.ts                         # Utility functions (cn helper)
└── src/
    ├── db/
    │   ├── index.ts                     # Database client
    │   └── schema/                      # Drizzle ORM schemas
    └── scripts/                         # Database scripts
```

## Key Components

### Pages

#### Main Dashboard (`/app/dashboard/page.tsx`)
**Purpose**: Overview of all sites with system statistics

**Features**:
- System statistics cards (4 metrics)
- Real-time data polling (60s)
- Grid of site cards (responsive)
- Manual refresh button
- Loading skeletons
- Error handling

**Key Hooks**:
- `useRealtimeData` for sites
- `useRealtimeData` for system stats

**Dependencies**:
- SiteCard component
- Card, Button, Skeleton from ui
- Icons from lucide-react

---

#### Site Detail Page (`/app/dashboard/sites/[siteId]/page.tsx`)
**Purpose**: Detailed view of single site with historical data

**Features**:
- Three tabs: Overview, History, Equipment
- Breadcrumb navigation
- Site header with status
- Real-time updates (60s)
- Manual refresh

**Tabs**:
1. **Overview**: Battery gauge + power flow + equipment status
2. **History**: Battery history + solar/load charts
3. **Equipment**: Equipment table with specifications

**Key Hooks**:
- `useRealtimeData` for site details
- `useRealtimeData` for historical data
- `useParams` for site ID

---

### Core Components

#### BatteryGauge (`/components/dashboard/battery-gauge.tsx`)
**Purpose**: Visual representation of battery charge level

**Props**:
```typescript
interface BatteryGaugeProps {
  level: number           // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}
```

**Features**:
- SVG-based circular progress
- Color-coded (green/yellow/red)
- Three size options
- Smooth animations
- Battery icon in center

**Color Thresholds**:
- Green: ≥60%
- Yellow: 20-60%
- Red: <20%

---

#### SiteCard (`/components/dashboard/site-card.tsx`)
**Purpose**: Overview card for a site on main dashboard

**Props**:
```typescript
interface SiteCardProps {
  site: SiteWithLatestTelemetry
  className?: string
}
```

**Features**:
- Battery gauge (medium size)
- Solar, Load, Grid metrics
- Status badge (online/active)
- Location display
- Last seen timestamp
- Clickable navigation
- Hover effects

**Layout**:
- Header: Site name, location, status
- Body: Battery gauge + metrics grid
- Footer: "View Details" link

---

#### PowerFlow (`/components/dashboard/power-flow.tsx`)
**Purpose**: Visualize power flow between system components

**Props**:
```typescript
interface PowerFlowProps {
  solarPowerKw: number
  batteryPowerKw: number
  loadPowerKw: number
  gridPowerKw: number
  className?: string
}
```

**Features**:
- Four power nodes (Solar, Battery, Grid, Load)
- Animated flow arrows
- Real-time power values
- Color-coded states
- Generation vs consumption summary

**Node Colors**:
- Solar: Yellow
- Battery Charging: Purple
- Battery Discharging: Orange
- Grid Import: Blue
- Grid Export: Green
- Load: Slate

---

#### BatteryHistoryChart (`/components/charts/battery-history-chart.tsx`)
**Purpose**: Display battery charge history over time

**Props**:
```typescript
interface BatteryHistoryChartProps {
  data: Array<{
    timestamp: Date
    avgBatteryChargeLevel: number | null
    minBatteryChargeLevel: number | null
    maxBatteryChargeLevel: number | null
  }>
}
```

**Features**:
- Area chart with gradient fill
- Purple theme
- Interactive tooltips
- Avg/Min/Max display
- Time-based X-axis
- Percentage Y-axis (0-100%)

---

#### SolarLoadChart (`/components/charts/solar-load-chart.tsx`)
**Purpose**: Compare solar generation vs load consumption

**Props**:
```typescript
interface SolarLoadChartProps {
  data: Array<{
    timestamp: Date
    avgSolarPowerKw: number | null
    avgLoadPowerKw: number | null
  }>
}
```

**Features**:
- Dual-line chart
- Yellow line (Solar)
- Slate line (Load)
- Interactive tooltips with net calculation
- Legend
- Time-based X-axis
- kW Y-axis

---

#### Navigation (`/components/dashboard/nav.tsx`)
**Purpose**: Top navigation bar for dashboard

**Features**:
- Logo with branding
- User avatar dropdown
- User name and email display
- Profile menu item
- Responsive design

---

### Hooks

#### useRealtimeData (`/hooks/use-realtime-data.ts`)
**Purpose**: Generic hook for real-time data polling

**Signature**:
```typescript
function useRealtimeData<T>(
  fetchFunction: () => Promise<T>,
  intervalMs?: number // Default: 60000
): {
  data: T | null
  isLoading: boolean
  error: Error | null
  lastUpdated: Date | null
  refresh: () => void
}
```

**Features**:
- Automatic polling at specified interval
- Manual refresh capability
- Loading and error states
- Last updated timestamp
- Type-safe generic implementation

**Usage Example**:
```typescript
const { data, isLoading, error, refresh } = useRealtimeData(
  () => getSites(),
  60000 // 60 seconds
)
```

---

### Server Actions

#### Sites Actions (`/app/actions/sites.ts`)
**Purpose**: Server-side data fetching with Drizzle ORM

**Functions**:

1. **getSites()**
   - Returns: `Promise<SiteWithLatestTelemetry[]>`
   - Fetches all active sites with latest telemetry

2. **getSiteById(siteId: number)**
   - Returns: Site with equipment and latest reading
   - Returns null if not found

3. **getSiteHistory(siteId: number, days: number = 7)**
   - Returns: Hourly aggregated telemetry data
   - Default: Last 7 days

4. **getLatestTelemetry(siteId: number)**
   - Returns: Most recent telemetry reading
   - Returns null if no data

5. **getSystemStats()**
   - Returns: System-wide statistics
   - Includes: total sites, avg battery, total solar, total load

---

## UI Components (shadcn/ui)

All located in `/components/ui/`:

1. **alert.tsx** - Alert messages
2. **avatar.tsx** - User avatars
3. **badge.tsx** - Status badges
4. **breadcrumb.tsx** - Navigation breadcrumbs
5. **button.tsx** - Buttons with variants
6. **card.tsx** - Content cards
7. **dialog.tsx** - Modal dialogs
8. **dropdown-menu.tsx** - Dropdown menus
9. **hover-card.tsx** - Hover cards
10. **navigation-menu.tsx** - Navigation menus
11. **progress.tsx** - Progress bars
12. **select.tsx** - Select dropdowns
13. **separator.tsx** - Visual separators
14. **skeleton.tsx** - Loading skeletons
15. **table.tsx** - Data tables
16. **tabs.tsx** - Tab navigation
17. **tooltip.tsx** - Tooltips

---

## Database Schema Reference

### Sites Table
```typescript
{
  id: number
  organizationId: number
  name: string
  slug: string
  city: string
  state: string
  status: 'active' | 'inactive' | 'maintenance' | 'offline'
  batteryCapacityKwh: number
  solarCapacityKw: number
  lastSeenAt: Date
  // ... more fields
}
```

### Telemetry Readings
```typescript
{
  id: number
  siteId: number
  timestamp: Date
  batteryChargeLevel: number
  batteryVoltage: number
  batteryCurrent: number
  batteryTemperature: number
  batteryStateOfHealth: number
  solarPowerKw: number
  loadPowerKw: number
  gridPowerKw: number
  inverter1PowerKw: number
  inverter2PowerKw: number
  // ... more fields
}
```

### Telemetry Hourly
```typescript
{
  id: number
  siteId: number
  timestamp: Date
  avgBatteryChargeLevel: number
  minBatteryChargeLevel: number
  maxBatteryChargeLevel: number
  avgSolarPowerKw: number
  avgLoadPowerKw: number
  // ... more fields
}
```

### Equipment
```typescript
{
  id: number
  siteId: number
  type: 'inverter' | 'battery' | 'solar_panel' | 'charge_controller' | 'grid_meter'
  name: string
  manufacturer: string
  model: string
  status: 'operational' | 'degraded' | 'maintenance' | 'failed' | 'offline'
  capacity: number
  // ... more fields
}
```

---

## Color Scheme

### Status Colors
- **Green (#10b981)**: Healthy/optimal (battery >60%)
- **Yellow (#f59e0b)**: Warning (battery 20-60%)
- **Red (#ef4444)**: Critical (battery <20%)
- **Blue (#3b82f6)**: Grid import
- **Purple (#8b5cf6)**: Battery/storage
- **Gold (#eab308)**: Solar generation
- **Slate (#475569)**: Load consumption

### Tailwind Classes
- Green: `text-green-500`, `text-green-600`, `bg-green-500`
- Yellow: `text-yellow-500`, `text-yellow-600`, `bg-yellow-500`
- Red: `text-red-500`, `text-red-600`, `bg-red-500`
- Blue: `text-blue-500`, `text-blue-600`, `bg-blue-500`
- Purple: `text-purple-500`, `text-purple-600`, `bg-purple-600`
- Slate: `text-slate-600`, `bg-slate-600`

---

## Responsive Breakpoints

Using Tailwind CSS breakpoints:
- **Mobile**: Default (< 768px) - 1 column
- **Tablet**: `md:` (≥ 768px) - 2 columns
- **Desktop**: `lg:` (≥ 1024px) - 3 columns
- **Large Desktop**: `xl:` (≥ 1280px) - 3 columns

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "16.0.1",
    "react": "19.2.0",
    "drizzle-orm": "^0.44.7",
    "recharts": "^3.3.0",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.548.0",
    "@radix-ui/*": "Latest",
    "tailwindcss": "^4",
    "zod": "^4.1.12"
  }
}
```

---

## Common Patterns

### Server Action Usage
```typescript
// In client component
'use client'
import { getSites } from '@/app/actions/sites'

const { data } = useRealtimeData(() => getSites(), 60000)
```

### Type Safety
```typescript
// Import types from actions
import type { SiteWithLatestTelemetry } from '@/app/actions/sites'

// Use in component props
interface Props {
  site: SiteWithLatestTelemetry
}
```

### Responsive Grid
```typescript
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
```

### Loading States
```typescript
{isLoading ? (
  <Skeleton className="h-32 w-full" />
) : (
  <Component data={data} />
)}
```

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0
