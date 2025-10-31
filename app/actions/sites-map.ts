'use server'

import { db } from '@/src/db'
import { sites, alerts, telemetryReadings } from '@/src/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { subHours } from 'date-fns'

/**
 * Site data optimized for map display
 */
export interface MapSiteData {
  id: number
  name: string
  latitude: number
  longitude: number
  city: string | null
  state: string | null
  status: 'active' | 'inactive' | 'maintenance' | 'offline'

  // Telemetry metadata
  lastTelemetryAt: Date | null

  // Alert counts
  criticalAlerts: number
  warningAlerts: number
  infoAlerts: number

  // Computed status for marker color
  markerStatus: 'operational' | 'warning' | 'critical' | 'offline'
}

/**
 * Fetch all sites with location data for map display
 * Includes alert counts and telemetry timestamps
 */
export async function getSitesForMap(): Promise<MapSiteData[]> {
  try {
    // 1. Get all active sites with location data
    const allSites = await db
      .select({
        id: sites.id,
        name: sites.name,
        latitude: sites.latitude,
        longitude: sites.longitude,
        city: sites.city,
        state: sites.state,
        status: sites.status,
        lastSeenAt: sites.lastSeenAt,
      })
      .from(sites)
      .where(
        and(
          eq(sites.status, 'active'),
          sql`${sites.latitude} IS NOT NULL`,
          sql`${sites.longitude} IS NOT NULL`
        )
      )

    // 2. Get alert counts for each site (active alerts only)
    const alertCounts = await db
      .select({
        siteId: alerts.siteId,
        severity: alerts.severity,
        count: sql<number>`count(*)::int`,
      })
      .from(alerts)
      .where(eq(alerts.status, 'active'))
      .groupBy(alerts.siteId, alerts.severity)

    // 3. Get latest telemetry timestamp for each site
    const latestTelemetry = await db
      .select({
        siteId: telemetryReadings.siteId,
        timestamp: sql<Date>`MAX(${telemetryReadings.timestamp})`,
      })
      .from(telemetryReadings)
      .groupBy(telemetryReadings.siteId)

    // 4. Combine data and calculate marker status
    const mapSites: MapSiteData[] = allSites
      .filter((site) => site.latitude !== null && site.longitude !== null)
      .map((site) => {
        // Get alert counts for this site
        const siteAlerts = alertCounts.filter((a) => a.siteId === site.id)
        const criticalAlerts = siteAlerts.find((a) => a.severity === 'critical')?.count || 0
        const warningAlerts = siteAlerts.find((a) => a.severity === 'warning')?.count || 0
        const errorAlerts = siteAlerts.find((a) => a.severity === 'error')?.count || 0
        const infoAlerts = siteAlerts.find((a) => a.severity === 'info')?.count || 0

        // Get latest telemetry timestamp
        const telemetry = latestTelemetry.find((t) => t.siteId === site.id)
        const lastTelemetryAt = telemetry?.timestamp || site.lastSeenAt

        // Calculate marker status
        const markerStatus = calculateMarkerStatus({
          criticalAlerts,
          warningAlerts: warningAlerts + errorAlerts,
          lastTelemetryAt,
        })

        return {
          id: site.id,
          name: site.name,
          latitude: site.latitude!,
          longitude: site.longitude!,
          city: site.city,
          state: site.state,
          status: site.status,
          lastTelemetryAt,
          criticalAlerts,
          warningAlerts: warningAlerts + errorAlerts,
          infoAlerts,
          markerStatus,
        }
      })

    return mapSites
  } catch (error) {
    console.error('Error fetching sites for map:', error)
    throw new Error('Failed to load map data')
  }
}

/**
 * Calculate marker status based on alerts and telemetry
 */
function calculateMarkerStatus(params: {
  criticalAlerts: number
  warningAlerts: number
  lastTelemetryAt: Date | null
}): 'operational' | 'warning' | 'critical' | 'offline' {
  const { criticalAlerts, warningAlerts, lastTelemetryAt } = params

  // Check if site is offline (no telemetry in last hour)
  if (!lastTelemetryAt) {
    return 'offline'
  }

  const oneHourAgo = subHours(new Date(), 1)
  if (lastTelemetryAt < oneHourAgo) {
    return 'offline'
  }

  // Check alert severity
  if (criticalAlerts > 0) {
    return 'critical'
  }

  if (warningAlerts > 0) {
    return 'warning'
  }

  return 'operational'
}
