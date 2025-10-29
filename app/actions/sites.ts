'use server'

import { db } from '@/src/db'
import { sites, equipment, telemetryReadings, telemetryHourly } from '@/src/db/schema'
import { desc, eq, and, gte, sql } from 'drizzle-orm'
import { subDays, startOfDay } from 'date-fns'

export interface SiteWithLatestTelemetry {
  id: number
  name: string
  status: string
  location: {
    city: string | null
    state: string | null
  }
  batteryCapacityKwh: number | null
  solarCapacityKw: number | null
  lastSeenAt: Date | null
  latestReading: {
    timestamp: Date
    batteryChargeLevel: number | null
    batteryVoltage: number | null
    batteryCurrent: number | null
    batteryTemperature: number | null
    batteryPowerKw: number | null
    solarPowerKw: number | null
    loadPowerKw: number | null
    gridPowerKw: number | null
    inverter1PowerKw: number | null
    inverter2PowerKw: number | null
    batteryStateOfHealth: number | null
  } | null
}

/**
 * Get all sites with their latest telemetry reading
 */
export async function getSites(): Promise<SiteWithLatestTelemetry[]> {
  const allSites = await db
    .select({
      id: sites.id,
      name: sites.name,
      status: sites.status,
      city: sites.city,
      state: sites.state,
      batteryCapacityKwh: sites.batteryCapacityKwh,
      solarCapacityKw: sites.solarCapacityKw,
      lastSeenAt: sites.lastSeenAt,
    })
    .from(sites)
    .where(eq(sites.status, 'active'))
    .orderBy(sites.name)

  // Get latest telemetry for each site
  const sitesWithTelemetry = await Promise.all(
    allSites.map(async (site) => {
      const latestReading = await db
        .select({
          timestamp: telemetryReadings.timestamp,
          batteryChargeLevel: telemetryReadings.batteryChargeLevel,
          batteryVoltage: telemetryReadings.batteryVoltage,
          batteryCurrent: telemetryReadings.batteryCurrent,
          batteryTemperature: telemetryReadings.batteryTemperature,
          batteryPowerKw: telemetryReadings.batteryPowerKw,
          solarPowerKw: telemetryReadings.solarPowerKw,
          loadPowerKw: telemetryReadings.loadPowerKw,
          gridPowerKw: telemetryReadings.gridPowerKw,
          inverter1PowerKw: telemetryReadings.inverter1PowerKw,
          inverter2PowerKw: telemetryReadings.inverter2PowerKw,
          batteryStateOfHealth: telemetryReadings.batteryStateOfHealth,
        })
        .from(telemetryReadings)
        .where(eq(telemetryReadings.siteId, site.id))
        .orderBy(desc(telemetryReadings.timestamp))
        .limit(1)

      return {
        ...site,
        location: {
          city: site.city,
          state: site.state,
        },
        latestReading: latestReading[0] || null,
      }
    })
  )

  return sitesWithTelemetry
}

/**
 * Get a single site by ID with equipment
 */
export async function getSiteById(siteId: number) {
  const [site] = await db
    .select()
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1)

  if (!site) {
    return null
  }

  const siteEquipment = await db
    .select()
    .from(equipment)
    .where(eq(equipment.siteId, siteId))
    .orderBy(equipment.type, equipment.name)

  const latestReading = await db
    .select()
    .from(telemetryReadings)
    .where(eq(telemetryReadings.siteId, siteId))
    .orderBy(desc(telemetryReadings.timestamp))
    .limit(1)

  return {
    ...site,
    equipment: siteEquipment,
    latestReading: latestReading[0] || null,
  }
}

/**
 * Get site history for the last N days
 */
export async function getSiteHistory(siteId: number, days: number = 7) {
  const startDate = startOfDay(subDays(new Date(), days))

  const hourlyData = await db
    .select()
    .from(telemetryHourly)
    .where(
      and(
        eq(telemetryHourly.siteId, siteId),
        gte(telemetryHourly.timestamp, startDate)
      )
    )
    .orderBy(telemetryHourly.timestamp)

  return hourlyData
}

/**
 * Get the latest telemetry reading for a site
 */
export async function getLatestTelemetry(siteId: number) {
  const [reading] = await db
    .select()
    .from(telemetryReadings)
    .where(eq(telemetryReadings.siteId, siteId))
    .orderBy(desc(telemetryReadings.timestamp))
    .limit(1)

  return reading || null
}

/**
 * Get system-wide statistics
 */
export async function getSystemStats() {
  const allSites = await getSites()

  const stats = {
    totalSites: allSites.length,
    onlineSites: allSites.filter((s) => s.latestReading).length,
    totalBatteryCapacity: allSites.reduce((sum, s) => sum + (s.batteryCapacityKwh || 0), 0),
    totalSolarCapacity: allSites.reduce((sum, s) => sum + (s.solarCapacityKw || 0), 0),
    averageBatteryLevel:
      allSites.reduce((sum, s) => sum + (s.latestReading?.batteryChargeLevel || 0), 0) /
      (allSites.filter((s) => s.latestReading).length || 1),
    totalSolarGeneration: allSites.reduce(
      (sum, s) => sum + (s.latestReading?.solarPowerKw || 0),
      0
    ),
    totalLoad: allSites.reduce((sum, s) => sum + (s.latestReading?.loadPowerKw || 0), 0),
  }

  return stats
}
