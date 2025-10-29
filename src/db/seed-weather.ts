/**
 * Weather-Aware Data Seeding Script
 *
 * Generates realistic BMS telemetry data using real historical weather data.
 * Integrates solar production, battery simulation, and load patterns for
 * physics-based data generation.
 *
 * Usage:
 *   pnpm db:seed:weather
 */

import { db } from './index'
import { sites, telemetryReadings, telemetryHourly, telemetryDaily } from './schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { addDays, addMinutes, startOfDay, startOfHour, format } from 'date-fns'

import { fetchHistoricalWeather, interpolateWeatherData } from '../lib/weather'
import type { WeatherData } from '../types/weather'
import type { Site } from './schema/sites'

import { BatterySimulator } from '../lib/battery-simulator'
import {
  calculateSolarProduction,
  getDefaultSolarConfig,
  calculateSolarEfficiency,
} from '../lib/solar-calculator'
import {
  getLoadProfile,
  calculateLoadPower,
  inferSiteType,
} from '../lib/load-simulator'
import {
  avg,
  sum,
  min,
  max,
  calculateSolarVoltage,
  calculateSolarCurrent,
  determineSystemStatus,
  determineInverterStatus,
  addNoise,
  roundTo,
  formatDuration,
  calculateProgress,
  generateTimestamps,
} from '../lib/seed-helpers'

/**
 * Seeding options
 */
interface SeedOptions {
  /** Number of days to generate (default: 30) */
  daysToGenerate: number
  /** Batch size for insertions (default: 500) */
  batchSize: number
  /** Verbose console output (default: true) */
  verbose: boolean
}

const DEFAULT_OPTIONS: SeedOptions = {
  daysToGenerate: 30,
  batchSize: 500,
  verbose: true,
}

/**
 * Main seeding function
 *
 * Generates weather-aware telemetry data for all sites.
 */
const seedWeatherAwareData = async (
  options: Partial<SeedOptions> = {}
): Promise<void> => {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  console.log('🌦️  Starting Weather-Aware Data Seeding')
  console.log(`📅 Generating ${opts.daysToGenerate} days of data\n`)

  // Step 1: Fetch all sites
  const allSites = await db.query.sites.findMany({
    where: eq(sites.status, 'active'),
  })

  if (allSites.length === 0) {
    console.log('⚠️  No active sites found. Please run `pnpm db:seed` first.')
    return
  }

  console.log(`📍 Found ${allSites.length} sites\n`)

  // Step 2: Calculate date range
  const endDate = new Date()
  const startDate = addDays(endDate, -opts.daysToGenerate)

  console.log(`📆 Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}\n`)

  // Step 3: Fetch historical weather data
  console.log('🌤️  Fetching historical weather data...')
  const weatherData = await fetchHistoricalWeather(startDate, endDate)
  console.log(`✅ Fetched ${weatherData.length} hourly weather records\n`)

  // Step 4: Process each site
  for (const site of allSites) {
    await seedSiteData(site, startDate, endDate, weatherData, opts)
  }

  console.log('\n✨ Weather-aware seeding completed!\n')
  console.log('Summary:')
  console.log(`  • ${allSites.length} sites processed`)
  console.log(`  • ${opts.daysToGenerate} days of data`)
  console.log(`  • 5-minute interval telemetry`)
  console.log(`  • Hourly and daily aggregations\n`)
}

/**
 * Seeds telemetry data for a single site
 */
const seedSiteData = async (
  site: Site,
  startDate: Date,
  endDate: Date,
  weatherData: WeatherData[],
  options: SeedOptions
): Promise<void> => {
  const siteType = inferSiteType(site.dailyConsumptionKwh || 65)

  console.log(`🔋 Processing site: ${site.name} (${siteType})`)

  // Delete existing telemetry for this site
  await db.delete(telemetryReadings).where(eq(telemetryReadings.siteId, site.id))
  await db.delete(telemetryHourly).where(eq(telemetryHourly.siteId, site.id))
  await db.delete(telemetryDaily).where(eq(telemetryDaily.siteId, site.id))

  // Initialize simulators and configs
  const solarConfig = getDefaultSolarConfig(site)
  const loadProfile = getLoadProfile(site, siteType)
  const batterySimulator = new BatterySimulator(site, {
    soc: 0.85, // Start at 85%
    temperature: 25,
    health: 98,
  })

  // Generate timestamps (5-minute intervals)
  const timestamps = generateTimestamps(startDate, endDate, 5)

  const readings = []
  let totalReadings = 0

  // Process each timestamp
  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i]

    // Get interpolated weather for this timestamp
    const weather = interpolateWeatherData(weatherData, timestamp)

    // 1. Calculate solar production
    const solarPowerKw = calculateSolarProduction(weather, solarConfig, timestamp)
    const solarVoltage = calculateSolarVoltage(
      solarPowerKw,
      solarConfig,
      weather.temperature
    )
    const solarCurrent = calculateSolarCurrent(solarPowerKw, solarVoltage)
    const solarEfficiency =
      solarPowerKw > 0
        ? calculateSolarEfficiency(solarPowerKw, weather, solarConfig)
        : null

    // 2. Calculate load consumption
    const loadPowerKw = calculateLoadPower(timestamp, weather, loadProfile)

    // 3. Simulate battery (returns grid import/export)
    const simulation = batterySimulator.simulate(
      5, // 5 minutes
      solarPowerKw,
      loadPowerKw,
      weather.temperature,
      true // grid available
    )

    const batteryState = simulation.batteryState

    // 4. Calculate inverter distribution (split solar 50/50)
    const inverter1PowerKw = solarPowerKw * 0.5
    const inverter2PowerKw = solarPowerKw * 0.5

    // Inverter efficiency and temperature
    const inverter1Efficiency =
      inverter1PowerKw > 0 ? addNoise(97, 1) : null
    const inverter2Efficiency =
      inverter2PowerKw > 0 ? addNoise(97, 1) : null

    const inverter1Temperature =
      inverter1PowerKw > 0 ? addNoise(40, 15) : addNoise(25, 5)
    const inverter2Temperature =
      inverter2PowerKw > 0 ? addNoise(40, 15) : addNoise(25, 5)

    // 5. Grid metrics
    const gridVoltage = addNoise(230, 2) // 230V ±2%
    const gridFrequency = addNoise(50, 0.5) // 50Hz ±0.5%

    // Grid power is net of import/export
    const gridPowerKw = simulation.gridImportKw - simulation.gridExportKw

    // 6. Determine system status
    const systemStatus = determineSystemStatus(batteryState, solarPowerKw)
    const inverter1Status = determineInverterStatus(
      inverter1PowerKw,
      inverter1Temperature
    )
    const inverter2Status = determineInverterStatus(
      inverter2PowerKw,
      inverter2Temperature
    )

    // Create telemetry reading
    readings.push({
      siteId: site.id,
      timestamp,
      // Battery
      batteryVoltage: roundTo(batteryState.voltage, 2),
      batteryCurrent: roundTo(batteryState.current, 2),
      batteryChargeLevel: roundTo(batteryState.soc * 100, 2),
      batteryTemperature: roundTo(batteryState.temperature, 2),
      batteryStateOfHealth: roundTo(batteryState.health, 2),
      batteryPowerKw: roundTo(
        -batteryState.current * batteryState.voltage / 1000,
        3
      ),
      // Solar
      solarPowerKw: roundTo(solarPowerKw, 3),
      solarEnergyKwh: roundTo(solarPowerKw * (5 / 60), 4),
      solarEfficiency: solarEfficiency ? roundTo(solarEfficiency, 2) : null,
      // Inverters
      inverter1PowerKw: roundTo(inverter1PowerKw, 3),
      inverter1Efficiency: inverter1Efficiency ? roundTo(inverter1Efficiency, 2) : null,
      inverter1Temperature: roundTo(inverter1Temperature, 2),
      inverter2PowerKw: roundTo(inverter2PowerKw, 3),
      inverter2Efficiency: inverter2Efficiency ? roundTo(inverter2Efficiency, 2) : null,
      inverter2Temperature: roundTo(inverter2Temperature, 2),
      // Grid
      gridVoltage: roundTo(gridVoltage, 2),
      gridFrequency: roundTo(gridFrequency, 2),
      gridPowerKw: roundTo(gridPowerKw, 3),
      gridEnergyKwh: roundTo(Math.abs(gridPowerKw) * (5 / 60), 4),
      // Load
      loadPowerKw: roundTo(loadPowerKw, 3),
      loadEnergyKwh: roundTo(loadPowerKw * (5 / 60), 4),
      // Metadata
      metadata: {
        dataQuality: 'good' as const,
        weatherCondition: weather.weatherCondition,
        systemStatus,
        inverter1Status,
        inverter2Status,
      },
    })

    // Batch insert
    if (readings.length >= options.batchSize) {
      await db.insert(telemetryReadings).values(readings)
      totalReadings += readings.length

      if (options.verbose) {
        const progress = calculateProgress(i + 1, timestamps.length)
        console.log(`  📊 Inserted ${options.batchSize} readings (total: ${totalReadings}, ${roundTo(progress, 1)}%)`)
      }

      readings.length = 0 // Clear array
    }
  }

  // Insert remaining readings
  if (readings.length > 0) {
    await db.insert(telemetryReadings).values(readings)
    totalReadings += readings.length
  }

  console.log(`  ✅ Generated ${totalReadings} telemetry readings`)

  // Generate aggregations
  console.log('  📈 Generating hourly aggregations...')
  await generateHourlyAggregations(site.id, startDate, endDate)

  console.log('  📅 Generating daily summaries...')
  await generateDailySummaries(site.id, startDate, endDate)

  // Update site's last_seen_at
  await db
    .update(sites)
    .set({ lastSeenAt: endDate })
    .where(eq(sites.id, site.id))

  console.log(`✅ Completed site: ${site.name}\n`)
}

/**
 * Generates hourly aggregations from 5-minute readings
 */
const generateHourlyAggregations = async (
  siteId: number,
  startDate: Date,
  endDate: Date
): Promise<void> => {
  let currentHour = startOfHour(startDate)
  const endHour = startOfHour(endDate)

  const hourlyRecords = []

  while (currentHour <= endHour) {
    const nextHour = addMinutes(currentHour, 60)

    // Fetch 5-minute readings for this hour
    const readings = await db.query.telemetryReadings.findMany({
      where: and(
        eq(telemetryReadings.siteId, siteId),
        gte(telemetryReadings.timestamp, currentHour),
        lte(telemetryReadings.timestamp, nextHour)
      ),
    })

    if (readings.length > 0) {
      // Calculate aggregations
      hourlyRecords.push({
        siteId,
        timestamp: currentHour,
        // Battery (averages)
        avgBatteryVoltage: roundTo(avg(readings.map((r) => r.batteryVoltage || 0)), 2),
        avgBatteryCurrent: roundTo(avg(readings.map((r) => r.batteryCurrent || 0)), 2),
        avgBatteryChargeLevel: roundTo(avg(readings.map((r) => r.batteryChargeLevel || 0)), 2),
        avgBatteryTemperature: roundTo(avg(readings.map((r) => r.batteryTemperature || 0)), 2),
        minBatteryChargeLevel: roundTo(min(readings.map((r) => r.batteryChargeLevel || 0)), 2),
        maxBatteryChargeLevel: roundTo(max(readings.map((r) => r.batteryChargeLevel || 0)), 2),
        // Solar (sum energy, avg power)
        totalSolarEnergyKwh: roundTo(sum(readings.map((r) => r.solarEnergyKwh || 0)), 4),
        avgSolarPowerKw: roundTo(avg(readings.map((r) => r.solarPowerKw || 0)), 3),
        avgSolarEfficiency: roundTo(
          avg(readings.map((r) => r.solarEfficiency || 0).filter((e) => e > 0)),
          2
        ),
        // Grid (sum energy, avg power)
        totalGridEnergyKwh: roundTo(sum(readings.map((r) => r.gridEnergyKwh || 0)), 4),
        avgGridPowerKw: roundTo(avg(readings.map((r) => r.gridPowerKw || 0)), 3),
        // Load (sum energy, avg power)
        totalLoadEnergyKwh: roundTo(sum(readings.map((r) => r.loadEnergyKwh || 0)), 4),
        avgLoadPowerKw: roundTo(avg(readings.map((r) => r.loadPowerKw || 0)), 3),
        // Metadata
        readingCount: readings.length,
      })
    }

    currentHour = nextHour
  }

  // Batch insert hourly records
  if (hourlyRecords.length > 0) {
    for (let i = 0; i < hourlyRecords.length; i += 500) {
      const batch = hourlyRecords.slice(i, i + 500)
      await db.insert(telemetryHourly).values(batch)
    }
  }
}

/**
 * Generates daily summaries from hourly aggregations
 */
const generateDailySummaries = async (
  siteId: number,
  startDate: Date,
  endDate: Date
): Promise<void> => {
  let currentDay = startOfDay(startDate)
  const endDay = startOfDay(endDate)

  const dailyRecords = []

  while (currentDay <= endDay) {
    const nextDay = addDays(currentDay, 1)

    // Fetch hourly aggregations for this day
    const hourlyData = await db.query.telemetryHourly.findMany({
      where: and(
        eq(telemetryHourly.siteId, siteId),
        gte(telemetryHourly.timestamp, currentDay),
        lte(telemetryHourly.timestamp, nextDay)
      ),
    })

    if (hourlyData.length > 0) {
      // Calculate daily summaries
      dailyRecords.push({
        siteId,
        date: currentDay,
        // Energy totals
        totalSolarEnergyKwh: roundTo(sum(hourlyData.map((h) => h.totalSolarEnergyKwh || 0)), 4),
        totalGridEnergyKwh: roundTo(sum(hourlyData.map((h) => h.totalGridEnergyKwh || 0)), 4),
        totalLoadEnergyKwh: roundTo(sum(hourlyData.map((h) => h.totalLoadEnergyKwh || 0)), 4),
        // Battery statistics
        avgBatteryChargeLevel: roundTo(avg(hourlyData.map((h) => h.avgBatteryChargeLevel || 0)), 2),
        minBatteryChargeLevel: roundTo(min(hourlyData.map((h) => h.minBatteryChargeLevel || 0)), 2),
        maxBatteryChargeLevel: roundTo(max(hourlyData.map((h) => h.maxBatteryChargeLevel || 0)), 2),
        avgBatteryTemperature: roundTo(avg(hourlyData.map((h) => h.avgBatteryTemperature || 0)), 2),
        maxBatteryTemperature: roundTo(max(hourlyData.map((h) => h.avgBatteryTemperature || 0)), 2),
        // System performance
        avgSolarEfficiency: roundTo(
          avg(hourlyData.map((h) => h.avgSolarEfficiency || 0).filter((e) => e > 0)),
          2
        ),
        uptimeMinutes: hourlyData.length * 60, // Assume full uptime
      })
    }

    currentDay = nextDay
  }

  // Batch insert daily records
  if (dailyRecords.length > 0) {
    await db.insert(telemetryDaily).values(dailyRecords)
  }
}

/**
 * Main execution
 */
const main = async () => {
  try {
    // Get days from command line argument, default to 30
    const daysArg = process.argv[2]
    const daysToGenerate = daysArg ? parseInt(daysArg, 10) : 30

    if (isNaN(daysToGenerate) || daysToGenerate < 1) {
      console.error('❌ Invalid days argument. Please provide a positive number.')
      console.log('Usage: pnpm db:seed:weather [days]')
      console.log('Example: pnpm db:seed:weather 7')
      process.exit(1)
    }

    await seedWeatherAwareData({
      daysToGenerate,
      batchSize: 500,
      verbose: true,
    })

    console.log('🎉 Done! You can now view the data:')
    console.log('   pnpm db:studio\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { seedWeatherAwareData, seedSiteData }
