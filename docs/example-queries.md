# Example Database Queries

This document provides production-ready query examples for common BMS platform operations.

## Table of Contents

1. [Dashboard Queries](#dashboard-queries)
2. [Telemetry Queries](#telemetry-queries)
3. [Alert Management](#alert-management)
4. [Site Management](#site-management)
5. [Reporting Queries](#reporting-queries)

---

## Dashboard Queries

### Get Organization Overview

```typescript
import { db } from '@/db'
import { sites, alerts, telemetryReadings } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'

async function getOrganizationDashboard(organizationId: number) {
  // Get all sites with latest telemetry and alert counts
  const sitesOverview = await db
    .select({
      siteId: sites.id,
      siteName: sites.name,
      siteStatus: sites.status,
      lastSeen: sites.lastSeenAt,

      // Latest telemetry data
      latestTimestamp: sql<Date>`MAX(${telemetryReadings.timestamp})`,
      batteryChargeLevel: sql<number>`(
        SELECT ${telemetryReadings.batteryChargeLevel}
        FROM ${telemetryReadings}
        WHERE ${telemetryReadings.siteId} = ${sites.id}
        ORDER BY ${telemetryReadings.timestamp} DESC
        LIMIT 1
      )`,
      solarPowerKw: sql<number>`(
        SELECT ${telemetryReadings.solarPowerKw}
        FROM ${telemetryReadings}
        WHERE ${telemetryReadings.siteId} = ${sites.id}
        ORDER BY ${telemetryReadings.timestamp} DESC
        LIMIT 1
      )`,

      // Alert counts
      activeAlerts: sql<number>`COUNT(CASE WHEN ${alerts.status} = 'active' THEN 1 END)`,
      criticalAlerts: sql<number>`COUNT(CASE WHEN ${alerts.status} = 'active' AND ${alerts.severity} = 'critical' THEN 1 END)`,
    })
    .from(sites)
    .leftJoin(alerts, eq(sites.id, alerts.siteId))
    .leftJoin(telemetryReadings, eq(sites.id, telemetryReadings.siteId))
    .where(eq(sites.organizationId, organizationId))
    .groupBy(sites.id)

  return sitesOverview
}
```

### Get Latest Readings for All Sites

```typescript
async function getLatestReadingsForAllSites(organizationId: number) {
  // Use DISTINCT ON for PostgreSQL efficiency
  const latestReadings = await db.execute(sql`
    SELECT DISTINCT ON (s.id)
      s.id as site_id,
      s.name as site_name,
      t.timestamp,
      t.battery_charge_level,
      t.battery_voltage,
      t.solar_power_kw,
      t.grid_power_kw,
      t.load_power_kw
    FROM sites s
    LEFT JOIN telemetry_readings t ON s.id = t.site_id
    WHERE s.organization_id = ${organizationId}
    ORDER BY s.id, t.timestamp DESC NULLS LAST
  `)

  return latestReadings.rows
}
```

---

## Telemetry Queries

### Get Time-Range Data with Aggregation

```typescript
import { telemetryHourly } from '@/db/schema'
import { between, eq } from 'drizzle-orm'

async function getHourlyDataForSite(
  siteId: number,
  startDate: Date,
  endDate: Date
) {
  const hourlyData = await db
    .select()
    .from(telemetryHourly)
    .where(
      and(
        eq(telemetryHourly.siteId, siteId),
        between(telemetryHourly.timestamp, startDate, endDate)
      )
    )
    .orderBy(telemetryHourly.timestamp)

  return hourlyData
}
```

### Calculate Daily Energy Totals

```typescript
async function getDailyEnergyTotals(siteId: number, date: Date) {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)

  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const energyTotals = await db
    .select({
      totalSolarGeneration: sql<number>`SUM(${telemetryReadings.solarEnergyKwh})`,
      totalGridImport: sql<number>`SUM(CASE WHEN ${telemetryReadings.gridPowerKw} > 0 THEN ${telemetryReadings.gridEnergyKwh} ELSE 0 END)`,
      totalGridExport: sql<number>`SUM(CASE WHEN ${telemetryReadings.gridPowerKw} < 0 THEN ABS(${telemetryReadings.gridEnergyKwh}) ELSE 0 END)`,
      totalConsumption: sql<number>`SUM(${telemetryReadings.loadEnergyKwh})`,
      avgBatteryCharge: sql<number>`AVG(${telemetryReadings.batteryChargeLevel})`,
      readingCount: sql<number>`COUNT(*)`,
    })
    .from(telemetryReadings)
    .where(
      and(
        eq(telemetryReadings.siteId, siteId),
        between(telemetryReadings.timestamp, dayStart, dayEnd)
      )
    )

  return energyTotals[0]
}
```

### Get Battery Health Trend

```typescript
async function getBatteryHealthTrend(siteId: number, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const healthTrend = await db
    .select({
      date: sql<string>`DATE(${telemetryReadings.timestamp})`,
      avgSOH: sql<number>`AVG(${telemetryReadings.batteryStateOfHealth})`,
      minSOH: sql<number>`MIN(${telemetryReadings.batteryStateOfHealth})`,
      maxSOH: sql<number>`MAX(${telemetryReadings.batteryStateOfHealth})`,
      avgTemperature: sql<number>`AVG(${telemetryReadings.batteryTemperature})`,
      maxTemperature: sql<number>`MAX(${telemetryReadings.batteryTemperature})`,
    })
    .from(telemetryReadings)
    .where(
      and(
        eq(telemetryReadings.siteId, siteId),
        sql`${telemetryReadings.timestamp} >= ${startDate}`
      )
    )
    .groupBy(sql`DATE(${telemetryReadings.timestamp})`)
    .orderBy(sql`DATE(${telemetryReadings.timestamp})`)

  return healthTrend
}
```

---

## Alert Management

### Get Active Alerts with Context

```typescript
import { alerts, sites, equipment } from '@/db/schema'
import { inArray } from 'drizzle-orm'

async function getActiveAlerts(organizationId: number) {
  const activeAlerts = await db
    .select({
      alertId: alerts.id,
      severity: alerts.severity,
      category: alerts.category,
      code: alerts.code,
      title: alerts.title,
      message: alerts.message,
      context: alerts.context,
      createdAt: alerts.createdAt,

      // Site details
      siteId: sites.id,
      siteName: sites.name,

      // Equipment details (if applicable)
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      equipmentType: equipment.type,
    })
    .from(alerts)
    .innerJoin(sites, eq(alerts.siteId, sites.id))
    .leftJoin(equipment, eq(alerts.equipmentId, equipment.id))
    .where(
      and(
        eq(sites.organizationId, organizationId),
        eq(alerts.status, 'active')
      )
    )
    .orderBy(
      // Critical first, then by creation time
      sql`CASE ${alerts.severity}
        WHEN 'critical' THEN 1
        WHEN 'error' THEN 2
        WHEN 'warning' THEN 3
        WHEN 'info' THEN 4
      END`,
      desc(alerts.createdAt)
    )

  return activeAlerts
}
```

### Create Alert with Notification

```typescript
async function createAlert(
  siteId: number,
  alertData: {
    severity: 'info' | 'warning' | 'error' | 'critical'
    category: string
    code: string
    title: string
    message: string
    context?: any
    equipmentId?: number
  }
) {
  const [newAlert] = await db
    .insert(alerts)
    .values({
      siteId,
      ...alertData,
      status: 'active',
    })
    .returning()

  // TODO: Trigger notification based on severity
  // - Critical: Immediate SMS + Email
  // - Error: Email
  // - Warning: Dashboard notification
  // - Info: Dashboard notification only

  return newAlert
}
```

### Acknowledge Alert

```typescript
async function acknowledgeAlert(alertId: number, userId: string) {
  const [updatedAlert] = await db
    .update(alerts)
    .set({
      status: 'acknowledged',
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(alerts.id, alertId))
    .returning()

  return updatedAlert
}
```

---

## Site Management

### Get Site Details with Equipment

```typescript
import { equipment } from '@/db/schema'

async function getSiteDetails(siteId: number) {
  const siteDetails = await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
    with: {
      equipment: {
        orderBy: [equipment.type, equipment.name],
      },
    },
  })

  return siteDetails
}
```

### Get Equipment by Type

```typescript
async function getEquipmentByType(siteId: number, type: string) {
  const equipmentList = await db
    .select()
    .from(equipment)
    .where(
      and(
        eq(equipment.siteId, siteId),
        eq(equipment.type, type)
      )
    )
    .orderBy(equipment.name)

  return equipmentList
}
```

### Update Site Last Seen

```typescript
async function updateSiteLastSeen(siteId: number) {
  await db
    .update(sites)
    .set({
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sites.id, siteId))
}
```

---

## Reporting Queries

### Monthly Energy Report

```typescript
import { telemetryDaily } from '@/db/schema'

async function getMonthlyEnergyReport(siteId: number, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // Last day of month

  const monthlyData = await db
    .select({
      date: telemetryDaily.date,
      solarGeneration: telemetryDaily.totalSolarEnergyKwh,
      gridImport: sql<number>`CASE WHEN ${telemetryDaily.totalGridEnergyKwh} > 0 THEN ${telemetryDaily.totalGridEnergyKwh} ELSE 0 END`,
      gridExport: sql<number>`CASE WHEN ${telemetryDaily.totalGridEnergyKwh} < 0 THEN ABS(${telemetryDaily.totalGridEnergyKwh}) ELSE 0 END`,
      consumption: telemetryDaily.totalLoadEnergyKwh,
    })
    .from(telemetryDaily)
    .where(
      and(
        eq(telemetryDaily.siteId, siteId),
        between(telemetryDaily.date, startDate, endDate)
      )
    )
    .orderBy(telemetryDaily.date)

  // Calculate totals
  const totals = monthlyData.reduce((acc, day) => ({
    totalSolar: acc.totalSolar + (day.solarGeneration || 0),
    totalGridImport: acc.totalGridImport + (day.gridImport || 0),
    totalGridExport: acc.totalGridExport + (day.gridExport || 0),
    totalConsumption: acc.totalConsumption + (day.consumption || 0),
  }), {
    totalSolar: 0,
    totalGridImport: 0,
    totalGridExport: 0,
    totalConsumption: 0,
  })

  return { dailyData: monthlyData, totals }
}
```

### System Performance Summary

```typescript
async function getSystemPerformanceSummary(organizationId: number) {
  const summary = await db.execute(sql`
    WITH latest_readings AS (
      SELECT DISTINCT ON (s.id)
        s.id as site_id,
        s.name as site_name,
        t.battery_charge_level,
        t.battery_soh,
        t.solar_power_kw,
        t.load_power_kw,
        t.timestamp
      FROM sites s
      LEFT JOIN telemetry_readings t ON s.id = t.site_id
      WHERE s.organization_id = ${organizationId}
        AND s.status = 'active'
      ORDER BY s.id, t.timestamp DESC
    ),
    active_alerts AS (
      SELECT
        s.id as site_id,
        COUNT(*) FILTER (WHERE a.severity = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE a.severity = 'error') as error_count,
        COUNT(*) FILTER (WHERE a.severity = 'warning') as warning_count
      FROM sites s
      LEFT JOIN alerts a ON s.id = a.site_id
      WHERE s.organization_id = ${organizationId}
        AND a.status = 'active'
      GROUP BY s.id
    )
    SELECT
      lr.site_id,
      lr.site_name,
      lr.battery_charge_level,
      lr.battery_soh,
      lr.solar_power_kw,
      lr.load_power_kw,
      lr.timestamp as last_reading,
      COALESCE(aa.critical_count, 0) as critical_alerts,
      COALESCE(aa.error_count, 0) as error_alerts,
      COALESCE(aa.warning_count, 0) as warning_alerts
    FROM latest_readings lr
    LEFT JOIN active_alerts aa ON lr.site_id = aa.site_id
    ORDER BY lr.site_name
  `)

  return summary.rows
}
```

### Equipment Health Report

```typescript
async function getEquipmentHealthReport(siteId: number) {
  const equipmentHealth = await db
    .select({
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      equipmentType: equipment.type,
      status: equipment.status,
      healthScore: equipment.healthScore,
      lastMaintenance: equipment.lastMaintenanceAt,
      nextMaintenance: equipment.nextMaintenanceAt,
      warrantyExpires: equipment.warrantyExpiresAt,

      // Count related alerts
      activeAlerts: sql<number>`COUNT(CASE WHEN ${alerts.status} = 'active' THEN 1 END)`,
    })
    .from(equipment)
    .leftJoin(alerts, eq(equipment.id, alerts.equipmentId))
    .where(eq(equipment.siteId, siteId))
    .groupBy(
      equipment.id,
      equipment.name,
      equipment.type,
      equipment.status,
      equipment.healthScore,
      equipment.lastMaintenanceAt,
      equipment.nextMaintenanceAt,
      equipment.warrantyExpiresAt
    )
    .orderBy(equipment.type, equipment.name)

  return equipmentHealth
}
```

---

## Performance Tips

1. **Use indexed columns in WHERE clauses**:
   ```typescript
   // Good: Uses index
   where(eq(sites.organizationId, orgId))

   // Bad: Function on indexed column prevents index use
   where(sql`LOWER(${sites.name}) = 'site-alpha'`)
   ```

2. **Limit result sets**:
   ```typescript
   .limit(100)
   .offset(page * 100)
   ```

3. **Use aggregation tables for dashboards**:
   ```typescript
   // Fast: Query hourly aggregations
   .from(telemetryHourly)

   // Slow: Aggregate raw telemetry on-the-fly
   .select({ avg: sql`AVG(${telemetryReadings.solarPowerKw})` })
   ```

4. **Batch inserts for telemetry**:
   ```typescript
   // Good: Single batch insert
   await db.insert(telemetryReadings).values(batchOfReadings)

   // Bad: Individual inserts
   for (const reading of readings) {
     await db.insert(telemetryReadings).values(reading)
   }
   ```

5. **Use prepared statements for repeated queries**:
   ```typescript
   const preparedQuery = db
     .select()
     .from(telemetryReadings)
     .where(eq(telemetryReadings.siteId, sql.placeholder('siteId')))
     .prepare('get_readings_by_site')

   const results = await preparedQuery.execute({ siteId: 123 })
   ```
