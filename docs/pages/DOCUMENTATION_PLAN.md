# BMS Dashboard - Page Documentation Plan

**Generated**: 2025-11-03
**Status**: Planning Phase Complete
**Total Pages**: 21 documented pages

## Documentation Structure

```
docs/pages/
├── README.md                          # Master index with navigation
├── DOCUMENTATION_PLAN.md              # This file
├── authentication/
│   ├── README.md                      # Authentication section index
│   ├── login.md                       # Login page documentation
│   └── screenshots/
│       └── login.png
├── dashboard/
│   ├── README.md                      # Dashboard section index
│   ├── home.md                        # Dashboard home
│   ├── sites-list.md                  # Sites list view
│   ├── sites-map.md                   # Sites map view
│   ├── site-detail.md                 # Individual site detail
│   ├── equipment.md                   # Equipment management
│   ├── alerts.md                      # Alerts page
│   ├── analytics.md                   # Analytics dashboard
│   ├── weather.md                     # Weather dashboard
│   ├── maintenance.md                 # Maintenance scheduling
│   ├── reports.md                     # Report generation
│   ├── docs.md                        # Documentation page
│   ├── settings.md                    # User settings
│   ├── support.md                     # Support page
│   └── screenshots/
│       ├── home.png
│       ├── sites-list.png
│       ├── sites-map.png
│       ├── site-detail-1.png
│       ├── equipment.png
│       ├── alerts.png
│       ├── analytics.png
│       ├── weather.png
│       ├── maintenance.png
│       ├── reports.png
│       ├── docs.png
│       ├── settings.png
│       └── support.png
└── management/
    ├── README.md                      # Management section index
    ├── overview.md                    # Management dashboard
    ├── users.md                       # User management
    ├── users-pending.md               # Pending approvals
    ├── settings.md                    # Organization settings
    └── screenshots/
        ├── overview.png
        ├── users.png
        ├── users-pending.png
        └── settings.png
```

## Page Inventory

### 1. Public Pages (2 pages)

| Page | Route | File | Purpose |
|------|-------|------|---------|
| Landing | `/` | `app/page.tsx` | Landing page / redirect |
| Login | `/login` | `app/(auth)/login/page.tsx` | User authentication |

### 2. Dashboard Pages (13 pages)

| Page | Route | File | Purpose |
|------|-------|------|---------|
| Dashboard Home | `/dashboard` | `app/dashboard/page.tsx` | Main dashboard with site overview |
| Sites List | `/dashboard/sites` | `app/dashboard/sites/page.tsx` | All sites in list view |
| Sites Map | `/dashboard/sites/map` | `app/dashboard/sites/map/page.tsx` | Interactive map view of sites |
| Site Detail | `/dashboard/sites/[siteId]` | `app/dashboard/sites/[siteId]/page.tsx` | Individual site details |
| Equipment | `/dashboard/equipment` | `app/dashboard/equipment/page.tsx` | Equipment management |
| Alerts | `/dashboard/alerts` | `app/dashboard/alerts/page.tsx` | Alerts and notifications |
| Analytics | `/dashboard/analytics` | `app/dashboard/analytics/page.tsx` | Analytics and insights |
| Weather | `/dashboard/weather` | `app/dashboard/weather/page.tsx` | Weather dashboard |
| Maintenance | `/dashboard/maintenance` | `app/dashboard/maintenance/page.tsx` | Maintenance scheduling |
| Reports | `/dashboard/reports` | `app/dashboard/reports/page.tsx` | Report generation |
| Docs | `/dashboard/docs` | `app/dashboard/docs/page.tsx` | Documentation |
| Settings | `/dashboard/settings` | `app/dashboard/settings/page.tsx` | User settings |
| Support | `/dashboard/support` | `app/dashboard/support/page.tsx` | Support page |

### 3. Management Pages (4 pages)

| Page | Route | File | Purpose |
|------|-------|------|---------|
| Management Dashboard | `/management` | `app/management/page.tsx` | Admin dashboard overview |
| User Management | `/management/users` | `app/management/users/page.tsx` | Manage all users |
| Pending Approvals | `/management/users/pending` | `app/management/users/pending/page.tsx` | Approve pending users |
| Organization Settings | `/management/settings` | `app/management/settings/page.tsx` | Organization configuration |

### 4. System Pages (2 pages - not documented)

| Page | Route | File | Purpose |
|------|-------|------|---------|
| Stack Auth Handler | `/handler/[...stack]` | `app/handler/[...stack]/page.tsx` | Auth system routes |
| Debug User | `/debug-user` | `app/debug-user/page.tsx` | Development debug page |

**Total Documented**: 19 pages (excluding 2 system pages)

## Access Levels

- **Public**: Landing (1)
- **Authenticated**: All dashboard pages (13)
- **Admin Only**: All management pages (4)
- **Auth Required**: Login (1)

## Screenshot Requirements

### Configuration
- **Resolution**: 1920x1080 viewport
- **Format**: PNG
- **Type**: Full page screenshots
- **Naming**: kebab-case (e.g., `dashboard-home.png`)

### Dynamic Pages
For site detail page, capture 2-3 different sites:
- `/dashboard/sites/1` → `site-detail-1.png`
- `/dashboard/sites/2` → `site-detail-2.png` (optional)
- `/dashboard/sites/3` → `site-detail-3.png` (optional)

### Total Screenshots Expected
- Authentication: 1
- Dashboard: 13-15 (including multiple site detail examples)
- Management: 4
- **Total**: 18-20 screenshots

## Documentation Template

Each page documentation follows this structure:

```markdown
# {Page Name}

**Route**: `{route}`
**Access**: {Public | Authenticated | Admin Only}
**Component**: {Server | Client}
**Screenshot**: ![Screenshot](./screenshots/{filename})

## Overview
1-2 paragraph description of page purpose and context.

## Key Features

### Feature 1: {Name}
- **Description**: What this feature does
- **How to Use**: Step-by-step instructions
- **Location**: Where in the screenshot

### Feature 2: {Name}
...

## UI Components

List of major UI components visible on the page:
- Navigation/Header
- Sidebar
- Main content area
- Cards/Tables/Charts
- Action buttons

## Data Displayed

- **Data Field 1**: Description and source
- **Data Field 2**: Description and source
- Update frequency and real-time behavior

## User Actions

- **Action 1**: What it does, required permission
- **Action 2**: What it does, required permission

## Navigation

- **Access From**: How users reach this page
- **Links To**: Related pages accessible from here
- **Breadcrumb**: Full navigation path

## Technical Notes

- Server Component vs Client Component
- Real-time updates mechanism
- API/Server Action dependencies
- Special considerations
```

## Quality Criteria

### Screenshots
- [ ] Clear and readable at 1920px width
- [ ] Full page capture showing all content
- [ ] Proper authentication state (logged in as admin)
- [ ] No sensitive data visible
- [ ] Consistent browser chrome removed or included

### Documentation
- [ ] Follows template structure
- [ ] All sections completed
- [ ] Screenshot properly linked
- [ ] Cross-references to related pages
- [ ] Technical accuracy verified

### Organization
- [ ] Files in correct directories
- [ ] Consistent naming convention
- [ ] Master index comprehensive
- [ ] Category READMEs created
- [ ] No broken links

## Timeline

- **Phase 1**: Planning (Complete) - 5 minutes
- **Phase 2**: Screenshots - 15 minutes
- **Phase 3**: Documentation - 20 minutes
- **Phase 4**: Index & Organization - 5 minutes
- **Total**: 45 minutes

## Next Steps

1. Verify dev server is running on http://localhost:3000
2. Confirm authentication (logged in as admin)
3. Begin screenshot capture with Playwright MCP
4. Start with priority pages:
   - Dashboard home
   - Sites list
   - Site detail
   - Equipment
   - Alerts

## Notes

- Debug user page (`/debug-user`) excluded from documentation (dev only)
- Stack Auth handler pages excluded (system routes)
- Landing page may redirect to dashboard if authenticated
- Some pages may have empty states (new installations)
