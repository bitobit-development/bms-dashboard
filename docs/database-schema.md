# BMS Dashboard Database Schema Documentation

## Overview

This document describes the production-ready database schema for the Battery Management System (BMS) platform. The schema is designed for:

- **Multi-tenant** support via organizations
- **High-volume time-series** data (5-minute intervals from 100+ sites)
- **Efficient queries** with strategic indexing
- **Scalability** to 1000+ sites
- **Compliance** and audit trails

## Technology Stack

- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM (type-safe, lightweight)
- **Migration Tool**: Drizzle Kit
- **Connection Pooling**: Neon's built-in pgbouncer

## Schema Architecture

### Entity Relationship Overview

```
organizations (1) ──→ (N) sites ──→ (N) equipment
      │                   │
      │                   ├──→ (N) telemetry_readings
      │                   ├──→ (N) alerts
      │                   ├──→ (N) events
      │                   └──→ (N) maintenance_records
      │
      └──→ (N) organization_users
```

## Table Definitions

### 1. Organizations (`organizations`)

**Purpose**: Multi-tenant organization management

**Key Fields**:
- `id` (PK): Unique identifier
- `slug`: URL-friendly unique identifier
- `settings`: JSONB for flexible configuration
- `subscriptionTier`: Business tier (trial/basic/professional/enterprise)
- `status`: Organization status (active/inactive/suspended)

**Indexes**:
- Unique index on `slug`

**Design Decisions**:
- JSONB for settings allows flexible configuration per organization
- Subscription tier enables feature gating
- Soft status management (no hard deletes)

---

### 2. Sites (`sites`)

**Purpose**: Physical locations with BMS equipment

**Key Fields**:
- `id` (PK): Unique identifier
- `organizationId` (FK): References organizations
- `latitude`, `longitude`: Geolocation
- `nominalVoltage`: System voltage (default 500V)
- `dailyConsumptionKwh`: Expected daily usage (60-70 kWh)
- `config`: JSONB for alert thresholds and maintenance schedules
- `status`: Site operational status

**Indexes**:
- `sites_org_id_idx`: Filter by organization
- `sites_status_idx`: Filter by status
- `sites_org_status_idx`: Composite (organization + status)
- `sites_location_idx`: Geospatial queries

**Design Decisions**:
- Geolocation enables map-based visualizations
- JSONB config allows per-site alert thresholds
- `lastSeenAt` tracks site connectivity
- Cascade delete removes all site data when site is deleted

---

### 3. Equipment (`equipment`)

**Purpose**: Individual components (inverters, batteries, solar panels)

**Key Fields**:
- `id` (PK): Unique identifier
- `siteId` (FK): References sites
- `type`: Equipment type (inverter/battery/solar_panel/etc.)
- `manufacturer`, `model`, `serialNumber`: Equipment identification
- `capacity`: kW or kWh rating
- `healthScore`: 0-100 health indicator
- `status`: Operational status

**Indexes**:
- `equipment_site_id_idx`: Equipment by site
- `equipment_type_idx`: Equipment by type
- `equipment_site_type_idx`: Composite (site + type)
- `equipment_maintenance_idx`: Maintenance scheduling

**Design Decisions**:
- Flexible `specs` JSONB for manufacturer-specific data
- Health score enables predictive maintenance
- Warranty tracking for compliance

---

### 4. Telemetry Readings (`telemetry_readings`) ⚡ PARTITIONED

**Purpose**: 5-minute interval time-series data

**Key Fields**:
- `id` (PK): Unique identifier
- `siteId` (FK): References sites
- `timestamp`: Reading timestamp (partition key)
- **Battery metrics**: voltage, current, charge level, temperature, SOH, power
- **Solar metrics**: power, energy, efficiency
- **Inverter metrics**: power, efficiency, temperature (2 inverters)
- **Grid metrics**: voltage, frequency, power, energy
- **Load metrics**: power, energy consumption

**Indexes**:
- `telemetry_site_timestamp_idx`: Critical for time-range queries
- `telemetry_timestamp_idx`: Partition management
- `telemetry_site_timestamp_unique`: Prevent duplicate readings

**Partitioning Strategy**:
```sql
-- Monthly partitioning for efficient data management
CREATE TABLE telemetry_readings_202501 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE telemetry_readings_202502 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

**Design Decisions**:
- **Monthly partitioning** balances query performance and management overhead
- **Composite index** (siteId + timestamp DESC) enables fast time-range queries
- **Unique constraint** prevents duplicate readings
- **Separate columns** instead of JSONB for better query performance
- **Null values** allowed for sensor failures (data quality tracked in metadata)

**Data Volume Estimate**:
- 1 site × 288 readings/day (5-min intervals) = 288 rows/day
- 100 sites × 288 readings/day = 28,800 rows/day
- Monthly partition size: ~864,000 rows
- Annual storage: ~10.5M rows (manageable with partitioning)

---

### 5. Telemetry Hourly (`telemetry_hourly`)

**Purpose**: Hourly aggregations for faster dashboard queries

**Key Fields**:
- Averages: Battery metrics, solar efficiency, grid power
- Sums: Energy totals (solar, grid, load)
- Min/Max: Battery charge level tracking
- `readingCount`: Number of 5-min intervals aggregated

**Indexes**:
- Similar to telemetry_readings for consistent query patterns

**Design Decisions**:
- Pre-computed aggregations reduce load on main telemetry table
- Dashboard queries use hourly data for recent trends
- Updated via scheduled jobs or triggers

---

### 6. Telemetry Daily (`telemetry_daily`)

**Purpose**: Daily rollups for historical analysis

**Key Fields**:
- Daily energy totals
- Battery statistics (avg, min, max)
- System uptime tracking

**Design Decisions**:
- Enables efficient long-term trend analysis
- Supports monthly/yearly reports without scanning millions of rows
- Much smaller dataset than raw telemetry

---

### 7. Alerts (`alerts`)

**Purpose**: System alerts and notifications

**Key Fields**:
- `siteId` (FK), `equipmentId` (FK): Alert source
- `severity`: info/warning/error/critical
- `category`: battery/solar/grid/inverter/system/maintenance
- `code`: Alert type identifier (e.g., 'BATTERY_LOW')
- `status`: active/acknowledged/resolved/dismissed
- `context`: JSONB with threshold values, actual values
- `notificationsSent`: Track email/SMS/webhook deliveries

**Indexes**:
- `alerts_site_status_idx`: Active alerts dashboard
- `alerts_severity_idx`: Critical alerts filtering
- `alerts_site_active_idx`: Composite (site + status + severity)

**Design Decisions**:
- Alert lifecycle tracking (created → acknowledged → resolved)
- Notification tracking prevents duplicate sends
- Context JSONB stores alert-specific data
- Soft resolution (never delete alerts for audit trail)

---

### 8. Events (`events`)

**Purpose**: Operational event log and audit trail

**Key Fields**:
- `type`: Event classification (site_online, maintenance_started, etc.)
- `actorType`, `actorId`: Who/what triggered the event
- `context`: JSONB with event details

**Indexes**:
- `events_site_created_idx`: Site timeline
- `events_created_at_idx`: Recent events

**Design Decisions**:
- Comprehensive audit trail for compliance
- Actor tracking for accountability
- Immutable log (append-only)

---

### 9. Maintenance Records (`maintenance_records`)

**Purpose**: Equipment maintenance tracking

**Key Fields**:
- `type`: scheduled/preventive/corrective/emergency
- `workPerformed`, `partsReplaced`: Maintenance details
- `performedBy`, `supervisedBy`: Personnel tracking
- `scheduledAt`, `startedAt`, `completedAt`: Timeline

**Indexes**:
- `maintenance_scheduled_idx`: Upcoming maintenance
- `maintenance_status_idx`: In-progress maintenance

**Design Decisions**:
- Complete maintenance lifecycle tracking
- Parts tracking for inventory management
- Supports preventive maintenance scheduling

---

### 10. Organization Users (`organization_users`)

**Purpose**: User memberships and role-based access control

**Key Fields**:
- `stackUserId`: Stack Auth integration
- `organizationId` (FK): Organization membership
- `role`: owner/admin/operator/viewer
- `permissions`: JSONB for granular overrides
- `siteAccess`: Optional site-level restrictions

**Indexes**:
- `org_user_unique`: Unique constraint (org + user)
- `org_users_org_id_idx`: Users by organization
- `org_users_stack_user_idx`: Lookup by Stack Auth ID

**Design Decisions**:
- Complements Stack Auth with application-specific data
- RBAC with permission overrides
- Site-level access control for operators
- Invitation tracking for audit

**Role Permission Matrix**:
- **OWNER**: Full access, billing, user management
- **ADMIN**: Manage sites/equipment, invite users
- **OPERATOR**: View data, acknowledge alerts, update maintenance
- **VIEWER**: Read-only access

---

### 11. User Activity Log (`user_activity_log`)

**Purpose**: Audit trail for user actions

**Key Fields**:
- `action`: User action (login, view_site, acknowledge_alert)
- `resource`, `resourceId`: What was accessed
- `details`: IP, user agent, location

**Design Decisions**:
- Compliance and security auditing
- Performance monitoring (detect slow queries from user activity)
- Debugging and support

---

## Indexing Strategy

### Critical Performance Indexes

1. **Time-range queries** (most common):
   ```sql
   CREATE INDEX telemetry_site_timestamp_idx
   ON telemetry_readings (site_id, timestamp DESC);
   ```

2. **Active alerts dashboard**:
   ```sql
   CREATE INDEX alerts_site_active_idx
   ON alerts (site_id, status, severity);
   ```

3. **Organization filtering**:
   ```sql
   CREATE INDEX sites_org_status_idx
   ON sites (organization_id, status);
   ```

### Index Maintenance

- Use `CREATE INDEX CONCURRENTLY` to avoid table locks in production
- Monitor index usage with `pg_stat_user_indexes`
- Drop unused indexes to improve write performance

---

## Query Patterns

### 1. Latest Readings from All Sites

```typescript
import { db } from '@/db'
import { telemetryReadings, sites } from '@/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'

// Get latest reading for each site in an organization
const latestReadings = await db
  .select({
    siteId: telemetryReadings.siteId,
    siteName: sites.name,
    timestamp: telemetryReadings.timestamp,
    batteryChargeLevel: telemetryReadings.batteryChargeLevel,
    solarPowerKw: telemetryReadings.solarPowerKw,
    loadPowerKw: telemetryReadings.loadPowerKw,
  })
  .from(telemetryReadings)
  .innerJoin(sites, eq(telemetryReadings.siteId, sites.id))
  .where(
    and(
      eq(sites.organizationId, organizationId),
      eq(sites.status, 'active')
    )
  )
  .groupBy(telemetryReadings.siteId, sites.name)
  .orderBy(desc(telemetryReadings.timestamp))
  .limit(100)
```

### 2. Historical Data Aggregation

```typescript
// Get hourly averages for the last 24 hours
const hourlyData = await db
  .select()
  .from(telemetryHourly)
  .where(
    and(
      eq(telemetryHourly.siteId, siteId),
      sql`${telemetryHourly.timestamp} >= NOW() - INTERVAL '24 hours'`
    )
  )
  .orderBy(desc(telemetryHourly.timestamp))
```

### 3. Active Alerts

```typescript
// Get all active critical alerts for an organization
const criticalAlerts = await db
  .select({
    alertId: alerts.id,
    siteName: sites.name,
    severity: alerts.severity,
    title: alerts.title,
    createdAt: alerts.createdAt,
  })
  .from(alerts)
  .innerJoin(sites, eq(alerts.siteId, sites.id))
  .where(
    and(
      eq(sites.organizationId, organizationId),
      eq(alerts.status, 'active'),
      eq(alerts.severity, 'critical')
    )
  )
  .orderBy(desc(alerts.createdAt))
```

### 4. Dashboard Metrics

```typescript
// Get current status for all sites
const siteMetrics = await db
  .select({
    siteId: sites.id,
    siteName: sites.name,
    status: sites.status,
    lastSeen: sites.lastSeenAt,
    activeAlerts: sql<number>`COUNT(CASE WHEN ${alerts.status} = 'active' THEN 1 END)`,
    criticalAlerts: sql<number>`COUNT(CASE WHEN ${alerts.severity} = 'critical' AND ${alerts.status} = 'active' THEN 1 END)`,
  })
  .from(sites)
  .leftJoin(alerts, eq(sites.id, alerts.siteId))
  .where(eq(sites.organizationId, organizationId))
  .groupBy(sites.id, sites.name, sites.status, sites.lastSeenAt)
```

---

## Migration Strategy

### Initial Setup

1. **Install Drizzle ORM and dependencies**:
```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

2. **Configure Drizzle** (`drizzle.config.ts`):
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
```

3. **Generate initial migration**:
```bash
pnpm drizzle-kit generate
```

4. **Apply migration**:
```bash
pnpm drizzle-kit push
```

### Creating Partitions

After initial migration, create monthly partitions:

```sql
-- Create partitions for 2025 (example)
CREATE TABLE telemetry_readings_202501 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE telemetry_readings_202502 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Continue for each month...

-- Automate with pg_partman extension (recommended)
CREATE EXTENSION pg_partman;

SELECT partman.create_parent(
  'public.telemetry_readings',
  'timestamp',
  'native',
  'monthly'
);
```

### Future Schema Changes

1. **Add column** (zero-downtime):
```typescript
// 1. Add nullable column
await db.schema.alterTable('sites').addColumn('newField', 'text')

// 2. Backfill data in batches
// 3. Make non-null if required
await db.schema.alterTable('sites').alterColumn('newField', { notNull: true })
```

2. **Index creation** (non-blocking):
```sql
CREATE INDEX CONCURRENTLY idx_name ON table_name (column);
```

### Data Seeding

Create seed data for development:

```typescript
// seed.ts
import { db } from './src/db'
import { organizations, sites, equipment } from './src/db/schema'

await db.insert(organizations).values({
  name: 'Demo Organization',
  slug: 'demo-org',
  status: 'active',
})

await db.insert(sites).values({
  organizationId: 1,
  name: 'Site Alpha',
  slug: 'site-alpha',
  latitude: 40.7128,
  longitude: -74.0060,
  status: 'active',
})

await db.insert(equipment).values([
  {
    siteId: 1,
    type: 'inverter',
    name: 'Inverter 1',
    capacity: 100,
    status: 'operational',
  },
  {
    siteId: 1,
    type: 'inverter',
    name: 'Inverter 2',
    capacity: 100,
    status: 'operational',
  },
])
```

---

## Performance Optimization

### Query Performance Targets

- **Latest readings**: < 100ms
- **Hourly aggregations**: < 200ms
- **Dashboard metrics**: < 500ms
- **Historical reports**: < 2s

### Optimization Techniques

1. **Use aggregation tables** (hourly/daily) for dashboards
2. **Limit result sets** with pagination
3. **Use covering indexes** when possible
4. **Monitor slow queries** with `pg_stat_statements`
5. **Connection pooling** via Neon's pgbouncer

### Scaling Considerations

- **Vertical scaling**: Neon supports autoscaling compute
- **Partition management**: Automated with pg_partman
- **Archive old data**: Move partitions to cold storage after 1 year
- **Read replicas**: For analytics workloads (Neon supports this)

---

## Data Retention

### Retention Policy

- **Raw telemetry**: 90 days (then archive or delete)
- **Hourly aggregations**: 1 year
- **Daily aggregations**: 5 years
- **Alerts**: 2 years
- **Events**: Indefinite (audit trail)
- **Maintenance records**: Indefinite

### Implementation

```sql
-- Drop old partitions (90 days)
DROP TABLE IF EXISTS telemetry_readings_202401;

-- Or archive to S3/Glacier
pg_dump -t telemetry_readings_202401 | gzip > archive/202401.sql.gz
```

---

## Compliance and Security

### Audit Trail

- All alerts stored indefinitely
- User activity log tracks all actions
- Event log for operational changes
- Maintenance records for equipment history

### Data Privacy

- Organization data isolation (multi-tenancy)
- Row-level security (RLS) can be added if needed
- User access controlled via roles and permissions
- PII stored only in user tables (encrypted at rest by Neon)

---

## Monitoring and Maintenance

### Health Checks

1. **Connection pool status**
2. **Query performance** (slow query log)
3. **Partition health** (check missing partitions)
4. **Index usage** (unused indexes)
5. **Table bloat** (vacuum status)

### Maintenance Tasks

- **Daily**: Monitor slow queries
- **Weekly**: Check partition creation
- **Monthly**: Review index usage, vacuum analyze
- **Quarterly**: Archive old data

---

## Next Steps

1. **Set up Drizzle ORM** with Neon connection
2. **Generate and apply** initial migration
3. **Create partitions** for telemetry_readings
4. **Seed development data**
5. **Implement query patterns** in API routes
6. **Set up monitoring** for query performance
7. **Configure automated backups** (Neon handles this)

---

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Time-Series Best Practices](https://www.timescale.com/blog/time-series-data-postgresql-10-vs-timescaledb-816ee808bac5/)
