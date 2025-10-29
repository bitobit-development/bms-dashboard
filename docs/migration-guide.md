# Database Migration Guide

This guide walks through setting up the BMS database schema from scratch.

## Prerequisites

- Neon PostgreSQL database provisioned
- Environment variables configured in `.env.local`
- Node.js and pnpm installed

## Step 1: Install Dependencies

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit @types/postgres
```

## Step 2: Verify Environment Variables

Ensure `.env.local` contains:

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://..."           # Pooled connection (use for queries)
POSTGRES_PRISMA_URL="postgresql://..."    # For schema operations
```

## Step 3: Generate Initial Migration

```bash
# Generate migration files from schema
pnpm drizzle-kit generate
```

This creates migration SQL files in `drizzle/migrations/`.

## Step 4: Review Generated Migration

Check the migration files in `drizzle/migrations/`. You should see:

- Table creation statements
- Index definitions
- Foreign key constraints

## Step 5: Apply Migration

```bash
# Push schema to database
pnpm drizzle-kit push
```

Or apply migrations manually:

```bash
# Run migrations
pnpm drizzle-kit migrate
```

## Step 6: Create Telemetry Partitions

After the initial schema is created, set up monthly partitioning for `telemetry_readings`:

### Option A: Manual Partition Creation

Connect to your database and run:

```sql
-- Enable pg_partman extension (optional but recommended)
CREATE EXTENSION IF NOT EXISTS pg_partman;

-- Create partitions for current and next 12 months
CREATE TABLE telemetry_readings_202410 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

CREATE TABLE telemetry_readings_202411 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE telemetry_readings_202412 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE telemetry_readings_202501 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE telemetry_readings_202502 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE telemetry_readings_202503 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE telemetry_readings_202504 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE telemetry_readings_202505 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

CREATE TABLE telemetry_readings_202506 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE telemetry_readings_202507 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE telemetry_readings_202508 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE telemetry_readings_202509 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE telemetry_readings_202510 PARTITION OF telemetry_readings
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
```

### Option B: Automated Partition Management (Recommended)

If pg_partman is available:

```sql
-- Set up automatic partition management
SELECT partman.create_parent(
  p_parent_table := 'public.telemetry_readings',
  p_control := 'timestamp',
  p_type := 'native',
  p_interval := 'monthly',
  p_premake := 3,  -- Pre-create 3 months ahead
  p_start_partition := '2024-10-01'
);

-- Update partition maintenance config
UPDATE partman.part_config
SET infinite_time_partitions = true,
    retention = '90 days',  -- Drop partitions older than 90 days
    retention_keep_table = false
WHERE parent_table = 'public.telemetry_readings';

-- Schedule automatic partition creation (run daily)
-- Add to cron or use pg_cron extension:
SELECT cron.schedule(
  'partition-maintenance',
  '0 3 * * *',  -- 3 AM daily
  $$SELECT partman.run_maintenance_proc()$$
);
```

## Step 7: Seed Development Data

Create a seed script for development:

```typescript
// scripts/seed.ts
import { db } from '@/db'
import {
  organizations,
  sites,
  equipment,
  organizationUsers,
} from '@/db/schema'

async function seed() {
  console.log('Seeding database...')

  // 1. Create demo organization
  const [org] = await db.insert(organizations).values({
    name: 'Demo Energy Corp',
    slug: 'demo-energy',
    email: 'admin@demo-energy.com',
    status: 'active',
    subscriptionTier: 'professional',
  }).returning()

  console.log(`✓ Created organization: ${org.name}`)

  // 2. Create demo sites
  const [site1] = await db.insert(sites).values({
    organizationId: org.id,
    name: 'Site Alpha',
    slug: 'site-alpha',
    address: '123 Solar Street',
    city: 'San Francisco',
    state: 'CA',
    country: 'US',
    latitude: 37.7749,
    longitude: -122.4194,
    nominalVoltage: 500,
    dailyConsumptionKwh: 65,
    batteryCapacityKwh: 100,
    solarCapacityKw: 20,
    status: 'active',
  }).returning()

  const [site2] = await db.insert(sites).values({
    organizationId: org.id,
    name: 'Site Beta',
    slug: 'site-beta',
    address: '456 Power Avenue',
    city: 'Los Angeles',
    state: 'CA',
    country: 'US',
    latitude: 34.0522,
    longitude: -118.2437,
    nominalVoltage: 500,
    dailyConsumptionKwh: 70,
    batteryCapacityKwh: 120,
    solarCapacityKw: 25,
    status: 'active',
  }).returning()

  console.log(`✓ Created sites: ${site1.name}, ${site2.name}`)

  // 3. Create equipment for site 1
  await db.insert(equipment).values([
    {
      siteId: site1.id,
      type: 'inverter',
      name: 'Inverter 1',
      manufacturer: 'SolarEdge',
      model: 'SE100K',
      capacity: 100,
      voltage: 500,
      status: 'operational',
      healthScore: 95,
    },
    {
      siteId: site1.id,
      type: 'inverter',
      name: 'Inverter 2',
      manufacturer: 'SolarEdge',
      model: 'SE100K',
      capacity: 100,
      voltage: 500,
      status: 'operational',
      healthScore: 93,
    },
    {
      siteId: site1.id,
      type: 'battery',
      name: 'Battery Bank 1',
      manufacturer: 'Tesla',
      model: 'Powerpack',
      capacity: 100,
      voltage: 500,
      status: 'operational',
      healthScore: 97,
    },
  ])

  console.log(`✓ Created equipment for ${site1.name}`)

  // 4. Create demo user
  await db.insert(organizationUsers).values({
    organizationId: org.id,
    stackUserId: 'demo-user-123',
    email: 'admin@demo-energy.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    status: 'active',
  })

  console.log('✓ Created demo user')
  console.log('\n✅ Database seeded successfully!')
}

seed().catch(console.error)
```

Run seed script:

```bash
tsx scripts/seed.ts
```

## Step 8: Verify Schema

Check that all tables were created:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check partitions
SELECT
  parent.relname AS parent_table,
  child.relname AS partition_name
FROM pg_inherits
  JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
  JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'telemetry_readings'
ORDER BY child.relname;

-- Verify indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Step 9: Set Up Drizzle Studio (Optional)

Drizzle Studio provides a visual database browser:

```bash
# Start Drizzle Studio
pnpm drizzle-kit studio
```

Open http://localhost:4983 to explore your database.

## Rollback Migrations

If you need to rollback:

```bash
# Drop all tables (CAUTION: Destructive!)
pnpm drizzle-kit drop
```

Or manually drop tables:

```sql
-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS organization_users CASCADE;
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS telemetry_daily CASCADE;
DROP TABLE IF EXISTS telemetry_hourly CASCADE;
DROP TABLE IF EXISTS telemetry_readings CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
```

## Future Migrations

When you modify the schema:

1. **Update schema files** in `src/db/schema/`
2. **Generate migration**:
   ```bash
   pnpm drizzle-kit generate
   ```
3. **Review migration SQL** in `drizzle/migrations/`
4. **Apply migration**:
   ```bash
   pnpm drizzle-kit push
   ```

### Zero-Downtime Migration Example

For production, use this pattern:

```typescript
// 1. Add nullable column
await db.schema.alterTable('sites').addColumn('newField', 'text')

// 2. Backfill data in batches (avoid locking)
const batchSize = 1000
let offset = 0

while (true) {
  const batch = await db
    .select()
    .from(sites)
    .limit(batchSize)
    .offset(offset)

  if (batch.length === 0) break

  await db.update(sites)
    .set({ newField: 'default value' })
    .where(inArray(sites.id, batch.map(s => s.id)))

  offset += batchSize
  console.log(`Backfilled ${offset} rows...`)
}

// 3. Make column non-null (after backfill completes)
await db.schema.alterTable('sites').alterColumn('newField', {
  notNull: true,
})
```

## Monitoring

### Check Database Size

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Slow Queries

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Check Index Usage

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Unused indexes (consider dropping)
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
  AND indexname NOT LIKE '%_pkey';
```

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT version();"
```

### Migration Conflicts

If migrations fail:

1. Check migration order in `drizzle/migrations/meta`
2. Manually resolve conflicts in database
3. Re-run migration

### Partition Issues

If partition creation fails:

```sql
-- Check if parent table is properly partitioned
SELECT
  partattrs,
  partclass,
  partexprs
FROM pg_partitioned_table
WHERE partrelid = 'telemetry_readings'::regclass;
```

## Next Steps

1. Set up automated partition creation (pg_partman or cron job)
2. Configure database backups (Neon handles this automatically)
3. Set up monitoring and alerting (slow queries, disk usage)
4. Implement data retention policies
5. Create aggregation jobs (hourly/daily rollups)

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Drizzle Kit Docs](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [pg_partman Documentation](https://github.com/pgpartman/pg_partman)
