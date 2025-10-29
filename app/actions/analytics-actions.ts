'use server'

import { db } from '@/src/db'
import { telemetryReadings, sites } from '@/src/db/schema'
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm'

export async function getAnalyticsData(
  dateRange: { from: Date; to: Date },
  siteId: string
) {
  try {
    // Build site filter
    const siteFilter = siteId === 'all' ? undefined : eq(telemetryReadings.siteId, parseInt(siteId))

    // Get telemetry data for the date range
    const telemetryData = await db
      .select()
      .from(telemetryReadings)
      .where(
        and(
          gte(telemetryReadings.timestamp, dateRange.from),
          lte(telemetryReadings.timestamp, dateRange.to),
          siteFilter
        )
      )
      .orderBy(telemetryReadings.timestamp)
      .limit(10000) // Limit to prevent memory issues

    // Calculate KPIs
    const totalGenerated = telemetryData.reduce((sum, d) => sum + (d.solarEnergyKwh || 0), 0)
    const totalConsumed = telemetryData.reduce((sum, d) => sum + (d.loadEnergyKwh || 0), 0)
    const totalGridImport = telemetryData.reduce((sum, d) => sum + Math.max(0, d.gridEnergyKwh || 0), 0)
    const totalGridExport = telemetryData.reduce((sum, d) => sum + Math.abs(Math.min(0, d.gridEnergyKwh || 0)), 0)

    const peakDemand = Math.max(...telemetryData.map(d => d.loadPowerKw || 0))
    const avgBatteryLevel = telemetryData.reduce((sum, d) => sum + (d.batteryChargeLevel || 0), 0) / (telemetryData.length || 1)

    // Grid independence calculation
    const gridIndependence = totalConsumed > 0 ? 1 - (totalGridImport / totalConsumed) : 0

    // System efficiency
    const systemEfficiency = totalConsumed > 0 ? totalGenerated / totalConsumed : 0

    // Energy savings (assuming R1.50 per kWh from grid)
    const energySavings = (totalGenerated - totalGridImport) * 1.5

    // Aggregate data by day for daily trends
    const dailyData = new Map<string, {
      date: string
      generated: number
      consumed: number
      gridImport: number
      gridExport: number
      count: number
    }>()

    telemetryData.forEach((reading) => {
      const dateKey = reading.timestamp.toISOString().split('T')[0]
      const existing = dailyData.get(dateKey) || {
        date: dateKey,
        generated: 0,
        consumed: 0,
        gridImport: 0,
        gridExport: 0,
        count: 0,
      }

      dailyData.set(dateKey, {
        date: dateKey,
        generated: existing.generated + (reading.solarEnergyKwh || 0),
        consumed: existing.consumed + (reading.loadEnergyKwh || 0),
        gridImport: existing.gridImport + Math.max(0, reading.gridEnergyKwh || 0),
        gridExport: existing.gridExport + Math.abs(Math.min(0, reading.gridEnergyKwh || 0)),
        count: existing.count + 1,
      })
    })

    const dailyTrends = Array.from(dailyData.values()).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Aggregate data by hour for hourly trends
    const hourlyData = new Map<string, {
      hour: string
      solarPower: number
      loadPower: number
      batteryPower: number
      gridPower: number
      count: number
    }>()

    telemetryData.forEach((reading) => {
      const hourKey = reading.timestamp.toISOString().slice(0, 13) + ':00:00'
      const existing = hourlyData.get(hourKey) || {
        hour: hourKey,
        solarPower: 0,
        loadPower: 0,
        batteryPower: 0,
        gridPower: 0,
        count: 0,
      }

      hourlyData.set(hourKey, {
        hour: hourKey,
        solarPower: existing.solarPower + (reading.solarPowerKw || 0),
        loadPower: existing.loadPower + (reading.loadPowerKw || 0),
        batteryPower: existing.batteryPower + (reading.batteryPowerKw || 0),
        gridPower: existing.gridPower + (reading.gridPowerKw || 0),
        count: existing.count + 1,
      })
    })

    // Calculate averages for hourly data
    const hourlyTrends = Array.from(hourlyData.values())
      .map(h => ({
        hour: h.hour,
        solarPower: h.solarPower / h.count,
        loadPower: h.loadPower / h.count,
        batteryPower: h.batteryPower / h.count,
        gridPower: h.gridPower / h.count,
      }))
      .sort((a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime())
      .slice(-168) // Last 7 days of hourly data

    // Battery charge/discharge patterns by hour of day (0-23)
    const batteryPatterns = Array.from({ length: 24 }, (_, hour) => {
      const hourData = telemetryData.filter(
        d => new Date(d.timestamp).getHours() === hour
      )

      const avgCharged = hourData
        .filter(d => (d.batteryPowerKw || 0) < 0)
        .reduce((sum, d) => sum + Math.abs(d.batteryPowerKw || 0), 0) / (hourData.length || 1)

      const avgDischarged = hourData
        .filter(d => (d.batteryPowerKw || 0) > 0)
        .reduce((sum, d) => sum + (d.batteryPowerKw || 0), 0) / (hourData.length || 1)

      return {
        hour,
        charged: avgCharged,
        discharged: avgDischarged,
      }
    })

    // Energy distribution
    const energyDistribution = [
      { name: 'Solar Generated', value: totalGenerated },
      { name: 'Grid Import', value: totalGridImport },
      { name: 'Grid Export', value: totalGridExport },
    ].filter(e => e.value > 0)

    return {
      success: true,
      kpis: {
        totalGenerated,
        totalConsumed,
        peakDemand,
        avgBatteryCycles: 0, // Would need to calculate from charge/discharge data
        solarCapacityFactor: 0.25, // Placeholder - would need capacity data
        gridIndependence,
        systemEfficiency,
        energySavings,
        generationTrend: 0, // Would need previous period data
        consumptionTrend: 0,
        independenceTrend: 0,
        savingsTrend: 0,
      },
      dailyTrends,
      hourlyTrends,
      batteryPatterns,
      energyDistribution,
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return {
      success: false,
      error: 'Failed to fetch analytics data',
      kpis: {
        totalGenerated: 0,
        totalConsumed: 0,
        peakDemand: 0,
        avgBatteryCycles: 0,
        solarCapacityFactor: 0,
        gridIndependence: 0,
        systemEfficiency: 0,
        energySavings: 0,
        generationTrend: 0,
        consumptionTrend: 0,
        independenceTrend: 0,
        savingsTrend: 0,
      },
      dailyTrends: [],
      hourlyTrends: [],
      batteryPatterns: [],
      energyDistribution: [],
    }
  }
}

export async function getSitesForAnalytics() {
  try {
    const sitesList = await db
      .select({
        id: sites.id,
        name: sites.name,
      })
      .from(sites)
      .orderBy(sites.name)

    return {
      success: true,
      sites: sitesList,
    }
  } catch (error) {
    console.error('Error fetching sites:', error)
    return {
      success: false,
      sites: [],
    }
  }
}
