'use server'

import { db } from '@/src/db'
import { sites, telemetryReadings, alerts, equipment, weather } from '@/src/db/schema'
import { eq, desc, and, like, sql, count, gte } from 'drizzle-orm'

export async function getSitesWithStats(filters: {
  search: string
  status: string
  sortBy: string
}) {
  try {
    // Build where conditions
    const conditions = []

    if (filters.search) {
      conditions.push(
        sql`${sites.name} ILIKE ${'%' + filters.search + '%'}`
      )
    }

    if (filters.status !== 'all') {
      conditions.push(eq(sites.status, filters.status))
    }

    // Get sites with latest telemetry
    const sitesWithStats = await db
      .select({
        id: sites.id,
        name: sites.name,
        slug: sites.slug,
        city: sites.city,
        state: sites.state,
        status: sites.status,
        batteryCapacityKwh: sites.batteryCapacityKwh,
        solarCapacityKw: sites.solarCapacityKw,
        lastSeenAt: sites.lastSeenAt,
      })
      .from(sites)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    // Get latest telemetry for each site
    const sitesWithTelemetry = await Promise.all(
      sitesWithStats.map(async (site) => {
        const [latestTelemetry] = await db
          .select()
          .from(telemetryReadings)
          .where(eq(telemetryReadings.siteId, site.id))
          .orderBy(desc(telemetryReadings.timestamp))
          .limit(1)

        const [activeAlertsCount] = await db
          .select({ count: count() })
          .from(alerts)
          .where(
            and(
              eq(alerts.siteId, site.id),
              eq(alerts.status, 'active')
            )
          )

        return {
          ...site,
          currentChargeLevel: latestTelemetry?.batteryChargeLevel || 0,
          currentPowerKw: latestTelemetry?.batteryPowerKw || 0,
          activeAlerts: activeAlertsCount?.count || 0,
        }
      })
    )

    // Sort
    let sortedSites = [...sitesWithTelemetry]
    switch (filters.sortBy) {
      case 'name':
        sortedSites.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'capacity':
        sortedSites.sort((a, b) => (b.batteryCapacityKwh || 0) - (a.batteryCapacityKwh || 0))
        break
      case 'lastSeen':
        sortedSites.sort((a, b) => {
          if (!a.lastSeenAt) return 1
          if (!b.lastSeenAt) return -1
          return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
        })
        break
      case 'status':
        sortedSites.sort((a, b) => a.status.localeCompare(b.status))
        break
    }

    return {
      success: true,
      sites: sortedSites,
    }
  } catch (error) {
    console.error('Error fetching sites:', error)
    return {
      success: false,
      error: 'Failed to fetch sites',
      sites: [],
    }
  }
}

export async function getSiteById(siteId: number) {
  try {
    const [site] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (!site) {
      return { success: false, error: 'Site not found' }
    }

    // Get latest telemetry
    const [latestTelemetry] = await db
      .select()
      .from(telemetryReadings)
      .where(eq(telemetryReadings.siteId, siteId))
      .orderBy(desc(telemetryReadings.timestamp))
      .limit(1)

    // Get active alerts
    const activeAlerts = await db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.siteId, siteId),
          eq(alerts.status, 'active')
        )
      )
      .orderBy(desc(alerts.createdAt))
      .limit(5)

    // Get equipment
    const siteEquipment = await db
      .select()
      .from(equipment)
      .where(eq(equipment.siteId, siteId))

    // Get 7 days of hourly data for charts
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const historicalData = await db
      .select()
      .from(telemetryReadings)
      .where(
        and(
          eq(telemetryReadings.siteId, siteId),
          gte(telemetryReadings.timestamp, sevenDaysAgo)
        )
      )
      .orderBy(telemetryReadings.timestamp)
      .limit(2016) // 7 days * 24 hours * 12 (5-min intervals)

    // Get weather data
    const [weatherData] = await db
      .select()
      .from(weather)
      .where(eq(weather.siteId, siteId))
      .orderBy(desc(weather.timestamp))
      .limit(1)

    return {
      success: true,
      site,
      latestTelemetry,
      activeAlerts,
      equipment: siteEquipment,
      historicalData,
      weather: weatherData,
    }
  } catch (error) {
    console.error('Error fetching site details:', error)
    return { success: false, error: 'Failed to fetch site details' }
  }
}
