/**
 * Check Battery SOC History
 */

import { db } from '../db'
import { telemetryReadings } from '../db/schema/telemetry'
import { desc, eq } from 'drizzle-orm'

const main = async () => {
  const siteId = 16 // Umzimkhulu Hospital Energy System

  const readings = await db
    .select({
      timestamp: telemetryReadings.timestamp,
      soc: telemetryReadings.batteryChargeLevel,
      batteryPower: telemetryReadings.batteryPowerKw,
      solar: telemetryReadings.solarPowerKw,
      load: telemetryReadings.loadPowerKw,
      grid: telemetryReadings.gridPowerKw,
    })
    .from(telemetryReadings)
    .where(eq(telemetryReadings.siteId, siteId))
    .orderBy(desc(telemetryReadings.timestamp))
    .limit(30)

  console.log(`\n📊 Last 30 readings for Site ${siteId}:\n`)
  console.log('Time     | SOC    | Battery  | Solar  | Load   | Grid')
  console.log('---------|--------|----------|--------|--------|--------')

  readings.forEach((r) => {
    const time = r.timestamp.toISOString().substring(11, 19)
    const soc = r.soc?.toFixed(1).padStart(5) || 'N/A'
    const batt = r.batteryPower?.toFixed(2).padStart(7) || 'N/A'
    const solar = r.solar?.toFixed(1).padStart(5) || 'N/A'
    const load = r.load?.toFixed(1).padStart(5) || 'N/A'
    const grid = r.grid?.toFixed(2).padStart(6) || 'N/A'
    console.log(`${time} | ${soc}% | ${batt}kW | ${solar}kW | ${load}kW | ${grid}kW`)
  })

  console.log('\n')
  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
