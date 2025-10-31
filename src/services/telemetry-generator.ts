/**
 * Real-Time Telemetry Generator
 *
 * Background service that continuously generates BMS telemetry data
 * by simulating battery operations, solar production, and load consumption
 * using real weather data.
 *
 * This service:
 * - Runs continuously at configurable intervals (1 or 5 minutes)
 * - Maintains battery state between readings (stateful simulation)
 * - Uses current/recent weather data
 * - Generates realistic telemetry for all active sites
 * - Automatically inserts data into the database
 */

import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { sites, telemetryReadings, equipment } from '../db/schema'
import type { Site, NewTelemetryReading, Equipment } from '../db/schema'
import { BatterySimulator } from '../lib/battery-simulator'
import { getDefaultSolarConfig, calculateSolarProduction } from '../lib/solar-calculator'
import { getLoadProfile, calculateLoadPower } from '../lib/load-simulator'
import { fetchHistoricalWeather, getWeatherAtTimestamp } from '../lib/weather'
import type { WeatherData } from '../types/weather'
import { addHours, subHours } from 'date-fns'

/**
 * Generator configuration
 */
export interface GeneratorConfig {
  /** Interval in minutes (1 or 5) */
  intervalMinutes: number
  /** Specific site IDs to generate for (defaults to all active sites) */
  sites?: number[]
  /** Enable verbose console logging */
  verbose: boolean
}

/**
 * Site simulator state
 */
interface SiteSimulator {
  site: Site
  equipment: {
    batteries: Equipment[]
    inverters: Equipment[]
    solarPanels: Equipment[]
    chargeControllers: Equipment[]
    gridMeters: Equipment[]
  }
  batterySimulator: BatterySimulator
  solarConfig: ReturnType<typeof getDefaultSolarConfig>
  loadProfile: ReturnType<typeof getLoadProfile>
}

/**
 * TelemetryGenerator Class
 *
 * Manages continuous generation of telemetry data for all active sites.
 */
export class TelemetryGenerator {
  private config: GeneratorConfig
  private running: boolean = false
  private intervalId: NodeJS.Timeout | null = null
  private siteSimulators: Map<number, SiteSimulator> = new Map()
  private weatherCache: WeatherData[] = []
  private weatherCacheExpiry: Date = new Date(0)

  constructor(config: GeneratorConfig) {
    this.config = config
  }

  /**
   * Starts the telemetry generator
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Generator is already running')
    }

    this.log('🚀 Starting Real-Time Telemetry Generator')
    this.log(`⏱️  Interval: ${this.config.intervalMinutes} minute(s)`)

    try {
      // Initialize site simulators
      await this.initializeSites()

      // Run first generation immediately
      await this.generateRound()

      // Set up interval for subsequent generations
      const intervalMs = this.config.intervalMinutes * 60 * 1000
      this.intervalId = setInterval(() => {
        this.generateRound().catch((error) => {
          console.error('❌ Generation round failed:', error)
        })
      }, intervalMs)

      this.running = true
      this.log('✅ Generator started successfully')
      this.log('Press Ctrl+C to stop\n')
    } catch (error) {
      console.error('❌ Failed to start generator:', error)
      throw error
    }
  }

  /**
   * Stops the telemetry generator
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return
    }

    this.log('\n🛑 Stopping generator...')

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.running = false
    this.siteSimulators.clear()

    this.log('✅ Generator stopped')
  }

  /**
   * Checks if generator is running
   */
  isRunning(): boolean {
    return this.running
  }

  /**
   * Gets current configuration
   */
  getConfig(): GeneratorConfig {
    return { ...this.config }
  }

  /**
   * Initializes site simulators
   *
   * Loads all active sites, creates battery simulators, and restores
   * battery state from last telemetry reading.
   */
  private async initializeSites(): Promise<void> {
    this.log('📍 Initializing sites...')

    // Load sites from database
    const allSites = await db.query.sites.findMany({
      where: eq(sites.status, 'active'),
    })

    // Filter by config.sites if specified
    const targetSites = this.config.sites
      ? allSites.filter((site) => this.config.sites!.includes(site.id))
      : allSites

    if (targetSites.length === 0) {
      throw new Error('No active sites found')
    }

    this.log(`   Found ${targetSites.length} active site(s)`)

    // Initialize simulator for each site
    for (const site of targetSites) {
      await this.initializeSiteSimulator(site)
    }

    this.log(`✅ Initialized ${this.siteSimulators.size} site simulators\n`)
  }

  /**
   * Initializes a single site simulator
   */
  private async initializeSiteSimulator(site: Site): Promise<void> {
    // Query equipment for this site
    const siteEquipment = await db.query.equipment.findMany({
      where: eq(equipment.siteId, site.id),
    })

    // Group equipment by type
    const batteries = siteEquipment.filter(e => e.type === 'battery')
    const inverters = siteEquipment.filter(e => e.type === 'inverter')
    const solarPanels = siteEquipment.filter(e => e.type === 'solar_panel')
    const chargeControllers = siteEquipment.filter(e => e.type === 'charge_controller')
    const gridMeters = siteEquipment.filter(e => e.type === 'grid_meter')

    // Calculate total capacities from equipment
    const totalBatteryCapacity = batteries.length > 0
      ? calculateTotalBatteryCapacity(batteries)
      : site.batteryCapacityKwh

    const totalSolarCapacity = solarPanels.length > 0
      ? calculateTotalSolarCapacity(solarPanels)
      : site.solarCapacityKw

    // Load last telemetry reading to restore battery state
    const lastReading = await db.query.telemetryReadings.findFirst({
      where: eq(telemetryReadings.siteId, site.id),
      orderBy: [desc(telemetryReadings.timestamp)],
    })

    // Create battery simulator with restored state
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

    // Get solar and load configurations with equipment-derived capacities
    const solarConfig = getDefaultSolarConfig({
      ...site,
      solarCapacityKw: totalSolarCapacity || site.solarCapacityKw,
    })
    const loadProfile = getLoadProfile(site)

    this.siteSimulators.set(site.id, {
      site,
      equipment: {
        batteries,
        inverters,
        solarPanels,
        chargeControllers,
        gridMeters,
      },
      batterySimulator,
      solarConfig,
      loadProfile,
    })

    this.log(`   ✓ ${site.name}:`)
    this.log(`      Batteries: ${batteries.length} (${(totalBatteryCapacity || site.batteryCapacityKwh || 0).toFixed(1)}kWh)`)
    this.log(`      Solar Panels: ${solarPanels.length} (${(totalSolarCapacity || site.solarCapacityKw || 0).toFixed(1)}kW)`)
    this.log(`      Inverters: ${inverters.length}`)
    this.log(`      Battery SOC: ${(batterySimulator.getState().soc * 100).toFixed(1)}%`)
  }

  /**
   * Generates one round of telemetry data for all sites
   */
  private async generateRound(): Promise<void> {
    const timestamp = new Date()
    this.log(`[${this.formatTime(timestamp)}] 🔄 Generating telemetry...`)

    try {
      // Get current weather
      const weather = await this.getCurrentWeather(timestamp)

      // Generate telemetry for each site
      let successCount = 0
      for (const [siteId, simulator] of this.siteSimulators) {
        try {
          await this.generateForSite(simulator, timestamp, weather)
          successCount++
        } catch (error) {
          console.error(`   ❌ Failed to generate for site ${siteId}:`, error)
        }
      }

      this.log(`   📊 Inserted ${successCount} reading(s)\n`)
    } catch (error) {
      console.error('   ❌ Weather fetch failed:', error)
      throw error
    }
  }

  /**
   * Generates telemetry for a single site
   */
  private async generateForSite(
    simulator: SiteSimulator,
    timestamp: Date,
    weather: WeatherData
  ): Promise<void> {
    const { site, equipment, batterySimulator, solarConfig, loadProfile } = simulator
    const { inverters } = equipment

    // Calculate solar production
    const solarPowerKw = calculateSolarProduction(weather, solarConfig, timestamp)

    // Calculate load consumption
    const loadPowerKw = calculateLoadPower(timestamp, weather, loadProfile)

    // Simulate battery (maintains state)
    const simulation = batterySimulator.simulate(
      this.config.intervalMinutes,
      solarPowerKw,
      loadPowerKw,
      weather.temperature,
      true // Grid available
    )

    const batteryState = simulation.batteryState

    // Calculate grid power (positive = import, negative = export)
    const gridPowerKw = simulation.gridImportKw - simulation.gridExportKw

    // Calculate battery power from energy balance
    // Positive = discharging, Negative = charging
    // Energy balance: Solar + Battery Discharge = Load + Grid Export
    // Therefore: Battery Power = Load + Grid Export - Solar - Grid Import
    const batteryPowerKw = loadPowerKw + simulation.gridExportKw - solarPowerKw - simulation.gridImportKw

    // Calculate energy for the interval
    const durationHours = this.config.intervalMinutes / 60
    const solarEnergyKwh = solarPowerKw * durationHours
    const loadEnergyKwh = loadPowerKw * durationHours
    const gridEnergyKwh = gridPowerKw * durationHours

    // Distribute inverter power based on equipment configuration
    const inverterPowerDistribution = distributeInverterPower(solarPowerKw, inverters)
    const inverterEfficiency = solarConfig.inverterEfficiency * 100
    const inverterTemp = weather.temperature + 15 // Inverters run warmer

    // Grid metrics
    const gridVoltage = 230 + (Math.random() * 10 - 5) // 230V ±5V
    const gridFrequency = 50 + (Math.random() * 0.2 - 0.1) // 50Hz ±0.1Hz

    // Create telemetry reading with dynamic inverter fields
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

      // Dynamic inverter metrics (supports up to 2 inverters in current schema)
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
      },
    }

    // Insert into database
    await db.insert(telemetryReadings).values(telemetry)

    // Update site's lastSeenAt timestamp to track when data was last received
    await db
      .update(sites)
      .set({ lastSeenAt: timestamp })
      .where(eq(sites.id, site.id))

    // Log summary
    this.log(
      `   ✅ ${site.name}: Solar ${solarPowerKw.toFixed(1)}kW, ` +
        `Battery ${(batteryState.soc * 100).toFixed(0)}%, ` +
        `Load ${loadPowerKw.toFixed(1)}kW` +
        (gridPowerKw > 0.1 ? `, Grid Import ${gridPowerKw.toFixed(1)}kW` : '') +
        (gridPowerKw < -0.1 ? `, Grid Export ${Math.abs(gridPowerKw).toFixed(1)}kW` : '')
    )
  }

  /**
   * Gets current weather data with caching
   *
   * For the current timestamp, fetches the last hour's historical weather
   * or uses cached data if available.
   */
  private async getCurrentWeather(timestamp: Date): Promise<WeatherData> {
    // Check if cache is still valid (1 hour)
    if (timestamp < this.weatherCacheExpiry && this.weatherCache.length > 0) {
      return getWeatherAtTimestamp(timestamp, this.weatherCache)
    }

    // Fetch new weather data (last 24 hours)
    const startDate = subHours(timestamp, 24)
    const endDate = addHours(timestamp, 1)

    try {
      this.weatherCache = await fetchHistoricalWeather(startDate, endDate)
      this.weatherCacheExpiry = addHours(timestamp, 1)

      return getWeatherAtTimestamp(timestamp, this.weatherCache)
    } catch (error) {
      // If fetch fails and we have old cache, use it
      if (this.weatherCache.length > 0) {
        console.warn('   ⚠️  Weather fetch failed, using cached data')
        return getWeatherAtTimestamp(timestamp, this.weatherCache)
      }
      throw error
    }
  }

  /**
   * Logs message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(message)
    }
  }

  /**
   * Formats time for console output
   */
  private formatTime(date: Date): string {
    return date.toTimeString().split(' ')[0] // HH:MM:SS
  }
}

/**
 * Creates a telemetry generator with default configuration
 */
export const createTelemetryGenerator = (
  intervalMinutes: number = 5,
  siteIds?: number[]
): TelemetryGenerator => {
  if (![1, 5].includes(intervalMinutes)) {
    throw new Error('Interval must be 1 or 5 minutes')
  }

  return new TelemetryGenerator({
    intervalMinutes,
    sites: siteIds,
    verbose: true,
  })
}

/**
 * Calculate total battery capacity from equipment records
 *
 * Only counts batteries that are not failed or offline.
 */
function calculateTotalBatteryCapacity(batteries: Equipment[]): number {
  return batteries
    .filter(b => b.status !== 'failed' && b.status !== 'offline')
    .reduce((sum, b) => sum + (b.capacity || 0), 0)
}

/**
 * Calculate total solar capacity from equipment records
 *
 * Only counts solar panels that are not failed or offline.
 */
function calculateTotalSolarCapacity(solarPanels: Equipment[]): number {
  return solarPanels
    .filter(s => s.status !== 'failed' && s.status !== 'offline')
    .reduce((sum, s) => sum + (s.capacity || 0), 0)
}

/**
 * Distribute power across inverters proportionally by capacity
 *
 * Active inverters receive power proportional to their capacity rating.
 * Inactive inverters (failed/offline) are excluded from distribution.
 *
 * @param totalPowerKw - Total power to distribute
 * @param inverters - Array of inverter equipment
 * @returns Map of inverter ID to assigned power (kW)
 */
function distributeInverterPower(totalPowerKw: number, inverters: Equipment[]): Map<number, number> {
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
