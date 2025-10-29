/**
 * Check Latest Telemetry Readings
 *
 * Quick script to verify the latest telemetry readings in the database.
 */

import { db } from '../db'
import { telemetryReadings } from '../db/schema/telemetry'
import { desc } from 'drizzle-orm'

const main = async () => {
  console.log('\n📊 Checking Latest Telemetry Readings...\n')

  const latest = await db
    .select()
    .from(telemetryReadings)
    .orderBy(desc(telemetryReadings.timestamp))
    .limit(5)

  if (latest.length === 0) {
    console.log('❌ No telemetry readings found in database')
    console.log('Run: pnpm db:seed')
    process.exit(1)
  }

  console.log(`Found ${latest.length} recent readings:\n`)

  latest.forEach((reading, index) => {
    console.log(`${index + 1}. Site ID: ${reading.siteId}`)
    console.log(`   Timestamp: ${reading.timestamp.toISOString()}`)
    console.log(
      `   Battery: ${reading.batteryChargeLevel?.toFixed(1)}% at ${reading.batteryTemperature?.toFixed(1)}°C`
    )
    console.log(`   Solar: ${reading.solarPowerKw?.toFixed(2)}kW`)
    console.log(`   Load: ${reading.loadPowerKw?.toFixed(2)}kW`)
    console.log(`   Grid: ${reading.gridPowerKw?.toFixed(2)}kW`)
    console.log()
  })

  console.log('✅ Telemetry data looks good!\n')
  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
