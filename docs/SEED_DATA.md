# Database Seed Script

## Overview

The seed script (`src/db/seed.ts`) populates the BMS Dashboard database with realistic test data for development and testing purposes.

## Usage

Run the seed script using pnpm:

```bash
pnpm db:seed
```

The script is **idempotent** - you can run it multiple times safely. It will:
- Update existing records when possible
- Skip duplicate entries
- Clean up old test data before creating new data

## What Gets Created

### 1. Organization
- **Name**: Demo BMS Company
- **Slug**: demo-bms
- **Subscription**: Professional tier
- **Status**: Active

### 2. Sites (3 total)

#### Site 1: Residential Backup System
- **Type**: Residential
- **Location**: Palo Alto, CA
- **Daily Consumption**: 60 kWh
- **Battery Capacity**: 40 kWh
- **Solar Capacity**: 15 kW
- **Equipment**: 2 inverters, 1 battery bank, solar array

#### Site 2: Small Commercial Site
- **Type**: Commercial
- **Location**: San Jose, CA
- **Daily Consumption**: 70 kWh
- **Battery Capacity**: 50 kWh
- **Solar Capacity**: 20 kW
- **Equipment**: 2 inverters, 1 battery bank, solar array

#### Site 3: Industrial Facility
- **Type**: Industrial
- **Location**: Oakland, CA
- **Daily Consumption**: 65 kWh
- **Battery Capacity**: 60 kWh
- **Solar Capacity**: 25 kW
- **Equipment**: 2 inverters, 1 battery bank, solar array

### 3. Equipment (12 items total)

For each site:
- **2 × Solar Inverters** (SolarEdge SE100K, 100kW each)
- **1 × Battery Bank** (Tesla Powerpack, varying capacity)
- **1 × Solar Panel Array** (SunPower Maxeon 3)

All equipment is marked as "operational" with health scores above 94%.

### 4. Telemetry Data (864 readings total)

For each site:
- **288 readings** (last 24 hours at 5-minute intervals)
- Realistic data patterns based on:
  - Time of day (solar generation peaks at noon)
  - Site type (residential/commercial/industrial load patterns)
  - Battery charge/discharge cycles
  - Grid import/export based on net power

**Sample Data Pattern:**
```
Time: 6:00 AM  → Low solar, low load, battery stable
Time: 12:00 PM → Peak solar, high load, battery charging
Time: 6:00 PM  → No solar, high load, battery discharging
Time: 12:00 AM → No solar, low load, battery stable
```

### 5. Alerts (3 total)

Sample alerts demonstrating different severities:
- **Warning**: Battery charge low (Site 1)
- **Info**: Maintenance due (Site 2, acknowledged)
- **Error**: Grid frequency high (Site 3, resolved)

### 6. Events (3 total)

Sample operational events:
- Site came online
- Configuration changed
- Maintenance completed

### 7. Users (2 total)

- **Admin User** (admin@demobms.com)
  - Role: Admin
  - Full access to all sites

- **Operator** (operator@demobms.com)
  - Role: Operator
  - Limited permissions

## Data Realism

The seed script generates realistic data using:

### Solar Generation
```typescript
// Peak at noon, falloff in morning/evening
// No generation at night (before 6 AM, after 6 PM)
const generateSolarPower = (hour: number, capacity: number): number => {
  if (hour < 6 || hour > 18) return 0
  const normalizedHour = hour - 12 // -6 to +6
  const efficiency = Math.max(0, 1 - Math.abs(normalizedHour) / 8)
  const cloudVariation = 0.85 + Math.random() * 0.15
  return capacity * efficiency * cloudVariation
}
```

### Load Patterns

**Residential**: Peaks in morning (7-9 AM) and evening (6-10 PM)
**Commercial**: High during business hours (8 AM - 6 PM)
**Industrial**: Consistent with peaks during day shift (6 AM - 2 PM)

### Battery Behavior
- Charges when solar > load
- Discharges when load > solar
- Maintains charge level between 20-100%
- Voltage correlates with charge level (480V at 0%, 505V at 100%)

### Grid Interaction
- Imports power when battery is low and solar insufficient
- Exports excess solar when battery is full
- Grid frequency: ~60 Hz with small variations

## Database Impact

Running the seed script will:

1. **Create or update** 1 organization
2. **Create or update** 3 sites
3. **Delete and recreate** 12 equipment items
4. **Delete and recreate** 864 telemetry readings
5. **Delete and recreate** 3 alerts
6. **Delete and recreate** 3 events
7. **Delete and recreate** 2 organization users

**Warning**: Telemetry data is deleted before re-creation to avoid conflicts and ensure consistent test data.

## Customization

To modify the seed data:

### Change Site Configuration
Edit `siteConfigs` array in `src/db/seed.ts`:

```typescript
const siteConfigs = [
  {
    name: 'Your Custom Site',
    slug: 'custom-site',
    dailyConsumptionKwh: 80, // Adjust consumption
    batteryCapacityKwh: 60,  // Adjust battery size
    solarCapacityKw: 30,      // Adjust solar capacity
    type: 'commercial',
  },
]
```

### Change Data Range
Modify the `intervals` constant:

```typescript
const intervals = 288 // 24 hours (change to 576 for 48 hours)
```

### Change Alert Thresholds
Edit site configuration:

```typescript
config: {
  alertThresholds: {
    batteryLowPercent: 25,    // Lower = more alerts
    batteryHighTemp: 40,      // Lower = more alerts
    gridFrequencyMin: 59.0,   // Wider range = fewer alerts
    gridFrequencyMax: 61.0,
  },
}
```

## Verification

After running the seed script, verify data using Drizzle Studio:

```bash
pnpm db:studio
```

Then check:
1. **Organizations** table: 1 record
2. **Sites** table: 3 records
3. **Equipment** table: 12 records (4 per site)
4. **Telemetry Readings** table: 864 records (288 per site)
5. **Alerts** table: 3 records
6. **Events** table: 3 records
7. **Organization Users** table: 2 records

## Common Issues

### Database Connection Error
```
Error: DATABASE_URL environment variable is not set
```
**Solution**: Ensure `.env.local` exists with `DATABASE_URL` set.

### Duplicate Key Violations
```
Error: duplicate key value violates unique constraint
```
**Solution**: The seed script handles most duplicates, but if you encounter this, try:
1. Dropping all tables: `pnpm db:drop`
2. Pushing schema: `pnpm db:push`
3. Running seed: `pnpm db:seed`

### Slow Execution
If the seed script takes a long time:
- Check database connection speed
- Reduce `intervals` constant for fewer telemetry readings
- Ensure database indexes are created

## Script Output

Expected output when running:

```
🌱 Starting database seed...

📦 Creating organization...
✅ Organization: Demo BMS Company (ID: 1)

🏢 Creating sites...
  ✅ Residential Backup System (ID: 1)
  ✅ Small Commercial Site (ID: 2)
  ✅ Industrial Facility (ID: 3)

⚡ Creating equipment...
  ✅ Created equipment for Residential Backup System
  ✅ Created equipment for Small Commercial Site
  ✅ Created equipment for Industrial Facility

📊 Generating telemetry data (last 24 hours)...
  🔄 Generating data for Residential Backup System...
  ✅ Generated 288 telemetry readings
  🔄 Generating data for Small Commercial Site...
  ✅ Generated 288 telemetry readings
  🔄 Generating data for Industrial Facility...
  ✅ Generated 288 telemetry readings

🚨 Creating sample alerts...
✅ Created 3 sample alerts

📝 Creating sample events...
✅ Created 3 sample events

👥 Creating organization users...
✅ Created 2 organization users

✨ Seed completed successfully!

Summary:
  • 1 organization
  • 3 sites
  • 12 equipment items
  • 864 telemetry readings
  • 3 alerts
  • 3 events
  • 2 users

You can now run: pnpm db:studio
Or test the API: POST /api/telemetry
```

## Next Steps

After seeding:

1. **View data in Drizzle Studio**: `pnpm db:studio`
2. **Test telemetry API**: See [TELEMETRY_API.md](./TELEMETRY_API.md)
3. **Build dashboard UI**: Start implementing data visualizations
4. **Create aggregations**: Build hourly/daily rollup queries

## Related Documentation

- [Telemetry API](./TELEMETRY_API.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
