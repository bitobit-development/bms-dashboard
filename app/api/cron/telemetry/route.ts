/**
 * Vercel Cron Job: Telemetry Generator
 *
 * This API route is triggered by Vercel Cron every 5 minutes to generate
 * telemetry data for all active sites.
 *
 * Schedule: Every 5 minutes (cron: star-slash-5 * * * *)
 *
 * Security: Uses CRON_SECRET environment variable for authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { sites, telemetryReadings, equipment } from '@/src/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Site, NewTelemetryReading } from '@/src/db/schema'
import { BatterySimulator } from '@/src/lib/battery-simulator'
import { getDefaultSolarConfig, calculateSolarProduction } from '@/src/lib/solar-calculator'
import { getLoadProfile, calculateLoadPower } from '@/src/lib/load-simulator'
import { fetchHistoricalWeather, getWeatherAtTimestamp } from '@/src/lib/weather'
import { subHours, addHours } from 'date-fns'

// This route runs on every request (no caching)
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Maximum execution time in seconds (Vercel Pro)

/**
 * GET /api/cron/telemetry
 *
 * Triggered by Vercel Cron to generate telemetry data
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET) {
    console.error('❌ CRON_SECRET environment variable not set')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedAuth) {
    console.error('❌ Unauthorized cron request')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  const timestamp = new Date()

  try {
    console.log(`[${timestamp.toISOString()}] 🔄 Cron: Generating telemetry...`)

    // Load all active sites
    const allSites = await db.query.sites.findMany({
      where: eq(sites.status, 'active'),
    })

    if (allSites.length === 0) {
      console.log('⚠️  No active sites found')
      return NextResponse.json({
        success: true,
        message: 'No active sites to process',
        sitesProcessed: 0,
        duration: Date.now() - startTime,
      })
    }

    console.log(`   Found ${allSites.length} active sites`)

    // Fetch weather data once for all sites (last 24 hours)
    let currentWeather: Awaited<ReturnType<typeof getWeatherAtTimestamp>>
    try {
      const weatherStartDate = subHours(timestamp, 24)
      const weatherEndDate = addHours(timestamp, 1)
      const weatherData = await fetchHistoricalWeather(weatherStartDate, weatherEndDate)
      currentWeather = await getWeatherAtTimestamp(timestamp, weatherData)
      console.log(`   Weather: ${currentWeather.temperature}°C, ${currentWeather.weatherCondition}`)
    } catch (error) {
      console.log(`   ⚠️  Weather fetch failed, using default nighttime weather`)
      // Use default nighttime weather
      const defaultDate = new Date(timestamp)
      const sunrise = new Date(defaultDate)
      sunrise.setHours(6, 0, 0, 0) // 6:00 AM
      const sunset = new Date(defaultDate)
      sunset.setHours(18, 0, 0, 0) // 6:00 PM

      currentWeather = {
        timestamp,
        temperature: 18,
        humidity: 70,
        cloudCover: 30,
        windSpeed: 5,
        precipitation: 0,
        solarIrradiance: 0,
        uvIndex: 0,
        sunrise,
        sunset,
        weatherCondition: 'clear' as const,
      }
    }

    // Generate telemetry for each site
    let successCount = 0
    let errorCount = 0

    for (const site of allSites) {
      try {
        await generateTelemetryForSite(site, timestamp, currentWeather)
        successCount++
      } catch (error) {
        console.error(`   ❌ Failed for site ${site.id}:`, error)
        errorCount++
      }
    }

    const duration = Date.now() - startTime

    console.log(`   ✅ Completed: ${successCount} success, ${errorCount} errors in ${duration}ms\n`)

    return NextResponse.json({
      success: true,
      sitesProcessed: successCount,
      errors: errorCount,
      totalSites: allSites.length,
      duration,
      timestamp: timestamp.toISOString(),
    })
  } catch (error) {
    console.error('❌ Cron job failed:', error)
    return NextResponse.json(
      {
        error: 'Telemetry generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate telemetry for a single site
 */
async function generateTelemetryForSite(
  site: Site,
  timestamp: Date,
  weather: Awaited<ReturnType<typeof getWeatherAtTimestamp>>
) {
  // Load equipment for this site
  const siteEquipment = await db.query.equipment.findMany({
    where: eq(equipment.siteId, site.id),
  })

  // Group equipment by type
  const batteries = siteEquipment.filter(e => e.type === 'battery')
  const inverters = siteEquipment.filter(e => e.type === 'inverter')
  const solarPanels = siteEquipment.filter(e => e.type === 'solar_panel')

  // Calculate total capacities
  const totalBatteryCapacity = batteries.length > 0
    ? batteries
        .filter(b => b.status !== 'failed' && b.status !== 'offline')
        .reduce((sum, b) => sum + (b.capacity || 0), 0)
    : site.batteryCapacityKwh

  const totalSolarCapacity = solarPanels.length > 0
    ? solarPanels
        .filter(s => s.status !== 'failed' && s.status !== 'offline')
        .reduce((sum, s) => sum + (s.capacity || 0), 0)
    : site.solarCapacityKw

  // Load last telemetry to restore battery state
  const lastReading = await db.query.telemetryReadings.findFirst({
    where: eq(telemetryReadings.siteId, site.id),
    orderBy: [desc(telemetryReadings.timestamp)],
  })

  // Initialize battery simulator with previous state
  const initialState = lastReading
    ? {
        soc: (lastReading.batteryChargeLevel || 50) / 100,
        voltage: lastReading.batteryVoltage || site.nominalVoltage || 500,
        current: lastReading.batteryCurrent || 0,
        temperature: lastReading.batteryTemperature || 25,
        health: lastReading.batteryStateOfHealth || 98,
      }
    : undefined

  const batterySimulator = new BatterySimulator(
    { ...site, batteryCapacityKwh: totalBatteryCapacity || site.batteryCapacityKwh },
    initialState
  )

  // Calculate solar production
  const solarConfig = getDefaultSolarConfig({
    ...site,
    solarCapacityKw: totalSolarCapacity || site.solarCapacityKw,
  })
  const solarPowerKw = calculateSolarProduction(weather, solarConfig, timestamp)

  // Calculate load consumption
  const loadProfile = getLoadProfile(site)
  const loadPowerKw = calculateLoadPower(timestamp, weather, loadProfile)

  // Simulate battery (5 minute interval)
  const simulation = batterySimulator.simulate(
    5, // 5 minute interval
    solarPowerKw,
    loadPowerKw,
    weather.temperature,
    true // Grid available
  )

  const batteryState = simulation.batteryState

  // Calculate grid power and battery power
  const gridPowerKw = simulation.gridImportKw - simulation.gridExportKw
  const batteryPowerKw = loadPowerKw + simulation.gridExportKw - solarPowerKw - simulation.gridImportKw

  // Calculate energy for 5-minute interval
  const durationHours = 5 / 60
  const solarEnergyKwh = solarPowerKw * durationHours
  const loadEnergyKwh = loadPowerKw * durationHours
  const gridEnergyKwh = gridPowerKw * durationHours

  // Distribute inverter power
  const inverterPowerDistribution = distributeInverterPower(solarPowerKw, inverters)
  const inverterEfficiency = solarConfig.inverterEfficiency * 100
  const inverterTemp = weather.temperature + 15

  // Grid metrics
  const gridVoltage = 230 + (Math.random() * 10 - 5)
  const gridFrequency = 50 + (Math.random() * 0.2 - 0.1)

  // Create telemetry reading
  const telemetry: NewTelemetryReading = {
    siteId: site.id,
    timestamp,

    // Battery metrics
    batteryVoltage: batteryState.voltage,
    batteryCurrent: batteryState.current,
    batteryChargeLevel: batteryState.soc * 100,
    batteryTemperature: batteryState.temperature,
    batteryStateOfHealth: batteryState.health,
    batteryPowerKw,

    // Solar metrics
    solarPowerKw,
    solarEnergyKwh,
    solarEfficiency: (solarPowerKw / (solarConfig.panelCapacityKw || 1)) * 100,

    // Inverter metrics
    ...(inverters.length >= 1 && {
      inverter1PowerKw: inverterPowerDistribution.get(inverters[0].id) || 0,
      inverter1Efficiency: inverterEfficiency,
      inverter1Temperature: inverterTemp,
    }),
    ...(inverters.length >= 2 && {
      inverter2PowerKw: inverterPowerDistribution.get(inverters[1].id) || 0,
      inverter2Efficiency: inverterEfficiency,
      inverter2Temperature: inverterTemp + (Math.random() * 2 - 1),
    }),

    // Grid metrics
    gridVoltage,
    gridFrequency,
    gridPowerKw,
    gridEnergyKwh,

    // Load metrics
    loadPowerKw,
    loadEnergyKwh,

    // Metadata
    metadata: {
      dataQuality: 'good',
      weatherCondition: weather.weatherCondition,
      generatedBy: 'vercel-cron',
    },
  }

  // Insert telemetry reading
  await db.insert(telemetryReadings).values(telemetry)

  // Update site's lastSeenAt timestamp
  await db
    .update(sites)
    .set({ lastSeenAt: timestamp })
    .where(eq(sites.id, site.id))
}

/**
 * Distribute power across inverters proportionally by capacity
 */
function distributeInverterPower(
  totalPowerKw: number,
  inverters: Array<{ id: number; capacity: number | null; status: string }>
): Map<number, number> {
  const activeInverters = inverters.filter(
    i => i.status !== 'failed' && i.status !== 'offline'
  )

  if (activeInverters.length === 0) return new Map()

  const totalCapacity = activeInverters.reduce((sum, inv) => sum + (inv.capacity || 1), 0)
  const powerDistribution = new Map<number, number>()

  activeInverters.forEach(inv => {
    const proportion = (inv.capacity || 1) / totalCapacity
    powerDistribution.set(inv.id, totalPowerKw * proportion)
  })

  return powerDistribution
}
