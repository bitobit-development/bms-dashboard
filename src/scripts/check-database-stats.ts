/**
 * Database Statistics Checker
 * Shows comprehensive stats about telemetry data
 */

import { db } from '../db'
import { telemetryReadings, telemetryHourly, telemetryDaily, sites } from '../db/schema'
import { sql } from 'drizzle-orm'

async function checkDatabaseStats() {
  console.log('📊 BMS Database Statistics\n')
  console.log('═'.repeat(60))

  try {
    // Count all readings
    const readingsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryReadings)

    console.log('\n📈 Telemetry Readings:')
    console.log(`   Total: ${readingsCount[0].count} readings`)

    // Count by site
    const readingsBySite = await db
      .select({
        siteId: telemetryReadings.siteId,
        count: sql<number>`count(*)`,
      })
      .from(telemetryReadings)
      .groupBy(telemetryReadings.siteId)

    console.log('\n   By Site:')
    for (const row of readingsBySite) {
      // Get site name
      const siteData = await db
        .select({ name: sites.name })
        .from(sites)
        .where(sql`${sites.id} = ${row.siteId}`)
        .limit(1)

      console.log(`   • Site ${row.siteId} (${siteData[0]?.name}): ${row.count} readings`)
    }

    // Date range
    const dateRange = await db
      .select({
        earliest: sql<Date>`min(${telemetryReadings.timestamp})`,
        latest: sql<Date>`max(${telemetryReadings.timestamp})`,
      })
      .from(telemetryReadings)

    if (dateRange[0]?.earliest && dateRange[0]?.latest) {
      console.log('\n   Date Range:')
      console.log(`   • Earliest: ${new Date(dateRange[0].earliest).toLocaleString()}`)
      console.log(`   • Latest: ${new Date(dateRange[0].latest).toLocaleString()}`)

      const duration = new Date(dateRange[0].latest).getTime() - new Date(dateRange[0].earliest).getTime()
      const minutes = Math.floor(duration / 60000)
      console.log(`   • Duration: ${minutes} minutes`)
    }

    // Hourly aggregations
    const hourlyCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryHourly)

    console.log('\n⏰ Hourly Aggregations:')
    console.log(`   Total: ${hourlyCount[0].count} hourly records`)

    // Daily summaries
    const dailyCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(telemetryDaily)

    console.log('\n📅 Daily Summaries:')
    console.log(`   Total: ${dailyCount[0].count} daily records`)

    // Latest reading details
    console.log('\n📊 Latest Reading Sample:')
    const latestReadings = await db
      .select()
      .from(telemetryReadings)
      .orderBy(sql`${telemetryReadings.timestamp} DESC`)
      .limit(1)

    if (latestReadings.length > 0) {
      const reading = latestReadings[0]
      console.log(`   Timestamp: ${new Date(reading.timestamp).toLocaleString()}`)
      console.log(`   Site ID: ${reading.siteId}`)
      console.log(`   Battery: ${reading.batteryChargeLevel?.toFixed(1)}% @ ${reading.batteryTemperature?.toFixed(1)}°C`)
      console.log(`   Solar: ${reading.solarPowerKw?.toFixed(2)}kW (${reading.solarEfficiency?.toFixed(1)}% efficient)`)
      console.log(`   Load: ${reading.loadPowerKw?.toFixed(2)}kW`)
      console.log(`   Grid: ${reading.gridPowerKw?.toFixed(2)}kW (+ = import, - = export)`)
      console.log(`   System Status: ${reading.systemStatus}`)
    }

    console.log('\n' + '═'.repeat(60))
    console.log('✅ Database check complete!\n')

  } catch (error) {
    console.error('❌ Error checking database:', error)
    process.exit(1)
  }

  process.exit(0)
}

checkDatabaseStats()
