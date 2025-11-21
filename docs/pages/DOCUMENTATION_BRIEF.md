# Documentation Writing Brief for yael-technical-docs

**Project**: BMS Dashboard Page Documentation
**Agent**: yael-technical-docs
**Status**: Ready for implementation
**Priority**: High

## Overview

Write comprehensive technical documentation for 5 priority pages of the BMS Dashboard application. Each page has a screenshot available in `/docs/pages/dashboard/screenshots/` and needs detailed markdown documentation following the provided template.

## Pages to Document

### 1. Dashboard Home (`/dashboard`)
- **File**: `/docs/pages/dashboard/home.md`
- **Screenshot**: `/docs/pages/dashboard/screenshots/home.png`
- **Route**: `/dashboard`
- **Component**: Client Component (`app/dashboard/page.tsx`)
- **Access Level**: Authenticated users

**Key Features to Document**:
- Real-time site overview with 4 metric cards (Total Sites, Avg Battery Level, Total Solar, Total Load)
- Site cards grid showing all BMS installations with live telemetry
- Battery charge level circular progress indicators
- Solar, Load, and Grid power metrics per site
- Online/Offline status indicators
- "View Details" links to individual site pages
- Auto-refresh functionality
- Real-time clock display in sidebar

**Technical Details to Include**:
- Uses `useRealtimeData` hook for polling updates
- Fetches data via `getSitesWithLatestTelemetry` Server Action
- Updates every 30 seconds
- Client component with React 19 features

### 2. Sites List (`/dashboard/sites`)
- **File**: `/docs/pages/dashboard/sites-list.md`
- **Screenshot**: `/docs/pages/dashboard/screenshots/sites-list.png`
- **Route**: `/dashboard/sites`
- **Component**: Client Component (`app/dashboard/sites/page.tsx`)
- **Access Level**: Authenticated users

**Key Features to Document**:
- Grid/List view toggle
- Search functionality
- Status filter (All Status dropdown)
- Sort by Name dropdown
- Export button
- Add Site button (admin action)
- Site cards with:
  - Site name and location
  - Active/Inactive status badge
  - Battery capacity (kWh) and Solar capacity (kW)
  - Charge level progress bar with percentage
  - Current power reading
  - Last seen timestamp
  - "View Details" button

**Technical Details to Include**:
- Search filters sites by name/location
- Status filter: active, inactive, all
- Grid layout responsive (3 columns → 2 → 1)
- Export functionality for data export

### 3. Equipment Management (`/dashboard/equipment`)
- **File**: `/docs/pages/dashboard/equipment.md`
- **Screenshot**: `/docs/pages/dashboard/screenshots/equipment.png`
- **Route**: `/dashboard/equipment`
- **Component**: Client Component (`app/dashboard/equipment/page.tsx`)
- **Access Level**: Authenticated users

**Key Features to Document**:
- Equipment cards grid display
- Search equipment textbox
- Multiple filters:
  - All Types dropdown
  - All Status dropdown
  - All Sites dropdown
  - Name sort dropdown
- Export button
- Add Equipment button (admin action)
- Equipment cards showing:
  - Equipment type icon (Battery/Inverter/Solar)
  - Equipment name ("Battery Bank")
  - Type label
  - Site association
  - Manufacturer and model (e.g., "BYD Battery-Box Premium HVS")
  - Serial number (S/N)
  - Health Score percentage with progress bar
  - Capacity (kWh) and Voltage (V)
  - "View Details" button
  - Edit and Delete action buttons
- Operational status badge

**Technical Details to Include**:
- Equipment types: Battery, Inverter, Solar Panel
- Health score calculation and thresholds
- Status: Operational, Maintenance, Offline
- Grid layout responsive

### 4. Alerts Dashboard (`/dashboard/alerts`)
- **File**: `/docs/pages/dashboard/alerts.md`
- **Screenshot**: `/docs/pages/dashboard/screenshots/alerts.png`
- **Route**: `/dashboard/alerts`
- **Component**: Client Component (`app/dashboard/alerts/page.tsx`)
- **Access Level**: Authenticated users

**Key Features to Document**:
- Alert summary cards (4 metric cards):
  - Critical Alerts (red icon) - Count: 0
  - Error Alerts (orange icon) - Count: 0
  - Warning Alerts (yellow icon) - Count: 0
  - Resolved (24h) (green icon) - Count: 0
- Filter panel with 4 dropdowns:
  - All Severities
  - All Categories
  - All Status
  - All Sites
- Refresh button
- Export button
- Empty state message: "No alerts found - There are no alerts matching your current filters"
- Last updated timestamp

**Technical Details to Include**:
- Alert severity levels: Critical, Error, Warning, Info
- Alert categories (based on system)
- Alert status: Active, Acknowledged, Resolved
- Real-time alert counts
- Filter combinations
- Empty state when no matching alerts

### 5. Analytics Dashboard (`/dashboard/analytics`)
- **File**: `/docs/pages/dashboard/analytics.md`
- **Screenshot**: `/docs/pages/dashboard/screenshots/analytics.png`
- **Route**: `/dashboard/analytics`
- **Component**: Client Component (`app/dashboard/analytics/page.tsx`)
- **Access Level**: Authenticated users

**Key Features to Document**:
- Time range selector buttons:
  - Last 24h
  - Last 7 Days
  - Last 30 Days
- Custom date range picker (from/to dates)
- Site filter dropdown (All Sites)
- Refresh button
- Export button
- 8 Metric cards:
  - Total Energy Generated (kWh) - Solar icon
  - Total Energy Consumed (kWh) - Plug icon
  - Peak Power Demand (kW) - Trending up icon
  - Avg Battery Cycles - Battery icon
  - Solar Capacity Factor (%) - Solar icon
  - Grid Independence (%) - Target icon
  - System Efficiency (%) - Activity icon
  - Energy Savings (R) - Savings icon
- Energy Trends chart:
  - Line chart with Daily/Hourly toggle
  - Generated vs Consumed comparison
  - X-axis: Time
  - Y-axis: kWh
  - Interactive tooltips

**Technical Details to Include**:
- Date range affects all metrics and charts
- Metrics calculated from telemetry data
- Chart powered by Recharts library
- Daily aggregation from `telemetry_daily` table
- Hourly from `telemetry_hourly` table
- Currency: South African Rand (R)

## Documentation Template to Follow

```markdown
# {Page Name}

**Route**: `{route}`
**Access**: {Public | Authenticated | Admin Only}
**Component**: {Server | Client}
**Screenshot**: ![{Page Name}](./screenshots/{filename})

## Overview

{2-3 paragraph description of the page's purpose, main functionality, and role in the BMS Dashboard application. Include context about who uses this page and why.}

## Key Features

### Feature 1: {Name}
- **Description**: {What this feature does in detail}
- **How to Use**: {Step-by-step instructions}
- **Location**: {Where in the UI - reference screenshot}
- **Permissions**: {Who can use this feature}

### Feature 2: {Name}
...

## UI Components

### Navigation
{Describe sidebar and header navigation visible}

### Main Content Area
{Describe the primary content layout}

### Cards/Tables/Charts
{Detail each major UI component}

### Action Buttons
{List all buttons and their functions}

## Data Displayed

### Primary Metrics
- **Metric 1**: {Description, unit, data source, update frequency}
- **Metric 2**: ...

### Real-time Data
{What data updates in real-time, how often}

### Historical Data
{What data is historical, date ranges}

## User Actions

### Primary Actions
- **Action 1**: {What it does, required permission, expected outcome}
- **Action 2**: ...

### Secondary Actions
- **Filter/Search**: {How filtering works}
- **Export**: {What gets exported, format}
- **Refresh**: {Manual refresh behavior}

## Navigation

### Accessing This Page
- From sidebar: {Click which nav item}
- From dashboard: {If applicable}
- Direct URL: `{route}`

### Related Pages
- **{Page Name}**: {Why user would navigate there, link}
- **{Page Name}**: ...

### Breadcrumb Path
{Full navigation hierarchy}

## Technical Implementation

### Component Type
{Server Component vs Client Component and why}

### Data Fetching
- **Server Actions**: {List Server Actions used}
- **API Endpoints**: {If any}
- **Data Sources**: {Database tables, external APIs}

### Real-time Updates
- **Mechanism**: {Polling, WebSocket, etc.}
- **Frequency**: {Update interval}
- **Hook Used**: {e.g., useRealtimeData}

### State Management
{How state is managed, any special hooks}

### Dependencies
- **External Libraries**: {Recharts, date-fns, etc.}
- **Internal Components**: {Custom components used}

## Code References

### Main Component
- **File**: `app/{route}/page.tsx`
- **Type**: {Client/Server Component}

### Server Actions
- **File**: `app/actions/{file}.ts`
- **Functions**: {List key functions}

### Database Schema
- **Tables**: {Relevant tables}
- **Queries**: {Key query patterns}

## Additional Notes

### Performance Considerations
{Any performance optimizations, caching, etc.}

### Known Limitations
{Current limitations or planned improvements}

### Future Enhancements
{Planned features from roadmap if known}
```

## Quality Requirements

### Documentation Must Include
- [ ] Clear, concise overview paragraph
- [ ] Complete feature descriptions with how-to instructions
- [ ] All UI components documented
- [ ] All user actions explained
- [ ] Data sources and update frequencies specified
- [ ] Navigation paths documented
- [ ] Technical implementation details
- [ ] Code file references with line numbers where relevant
- [ ] Screenshot properly embedded and referenced

### Writing Style
- Professional and technical
- Active voice
- Present tense
- No marketing language
- Assume reader is a developer or power user
- Include keyboard shortcuts where applicable
- Reference specific UI elements visible in screenshots

### Formatting
- Use proper markdown headings hierarchy (H1 → H2 → H3)
- Use code blocks for code examples
- Use tables for structured data
- Use bullet lists for features
- Use numbered lists for procedures
- Bold important terms on first use
- Use inline code for `routes`, `components`, `variables`

## File Organization

Save each file to:
- `/docs/pages/dashboard/home.md`
- `/docs/pages/dashboard/sites-list.md`
- `/docs/pages/dashboard/equipment.md`
- `/docs/pages/dashboard/alerts.md`
- `/docs/pages/dashboard/analytics.md`

## Delivery Checklist

- [ ] All 5 pages documented
- [ ] Each file follows the template structure
- [ ] Screenshots properly linked
- [ ] All sections completed (no TODOs left)
- [ ] Technical accuracy verified against source code
- [ ] No broken links or references
- [ ] Consistent formatting across all files
- [ ] Code references include file paths

## Additional Context

**Application**: BMS (Battery Management System) Dashboard
**Tech Stack**: Next.js 16, React 19, TypeScript, Drizzle ORM, Neon PostgreSQL
**Authentication**: Stack Auth (logged in users only)
**Real-time**: Polling-based updates every 30 seconds
**Database**: PostgreSQL with time-series telemetry tables

**Key Concepts**:
- **Sites**: Physical BMS installations (community halls with battery systems)
- **Equipment**: Batteries, inverters, solar panels at each site
- **Telemetry**: Real-time sensor data (voltage, current, power, SOC)
- **Alerts**: System notifications based on telemetry thresholds
- **Analytics**: Historical data analysis and reporting

## Source Code References

- **Pages**: `/Users/haim/Projects/bms-dashboard/app/dashboard/`
- **Server Actions**: `/Users/haim/Projects/bms-dashboard/app/actions/`
- **Database Schema**: `/Users/haim/Projects/bms-dashboard/src/db/schema/`
- **Components**: `/Users/haim/Projects/bms-dashboard/components/dashboard/`

## Notes for yael-technical-docs

- Reference the actual screenshots to accurately describe what's visible
- Check source code files for technical accuracy
- Include specific component names and props where relevant
- Document keyboard shortcuts if implemented (K for search, etc.)
- Note any accessibility features (ARIA labels, keyboard navigation)
- Cross-reference related pages for better navigation
- Use consistent terminology throughout all documentation

---

**Priority**: Start with Dashboard Home, then Sites List, Equipment, Alerts, Analytics (in that order)

**Estimated Time**: 30-40 minutes for all 5 pages

**Coordination**: Report back when complete for quality review by rotem-strategy
