/**
 * Load Pattern Simulator
 *
 * Generates realistic electrical load patterns based on site type,
 * time of day, day of week, and temperature conditions.
 */

import type { WeatherData } from '../types/weather'
import type { Site } from '../db/schema/sites'

/**
 * Site type classifications
 */
export type SiteType = 'residential' | 'commercial' | 'industrial'

/**
 * Load profile configuration for a site type
 */
export interface LoadProfile {
  /** Base load as fraction of average (0.2-0.7) */
  baseLoadKw: number
  /** Peak load as fraction of average (1.5-3.0) */
  peakLoadKw: number
  /** Peak hours (e.g., [7, 8, 18, 19, 20]) */
  peakHours: number[]
  /** Shoulder hours (e.g., [6, 9, 17, 21]) */
  shoulderHours: number[]
  /** Off-peak hours (e.g., [0, 1, 2, 3, 4, 5, 22, 23]) */
  offPeakHours: number[]
  /** Weekend load factor (0.3-1.2, where 1.0 = same as weekday) */
  weekendFactor: number
  /** Temperature sensitivity in kW per °C above 25°C */
  temperatureSensitivity: number
}

/**
 * Load profiles for different site types
 */
const LOAD_PROFILES: Record<SiteType, Omit<LoadProfile, 'baseLoadKw' | 'peakLoadKw'>> = {
  residential: {
    peakHours: [7, 8, 18, 19, 20, 21], // Morning and evening peaks
    shoulderHours: [6, 9, 17, 22],
    offPeakHours: [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 23],
    weekendFactor: 1.2, // 20% more on weekends (people home)
    temperatureSensitivity: 0.15, // 0.15 kW per °C (AC usage)
  },
  commercial: {
    peakHours: [9, 10, 11, 12, 13, 14, 15, 16], // Business hours
    shoulderHours: [8, 17],
    offPeakHours: [0, 1, 2, 3, 4, 5, 6, 7, 18, 19, 20, 21, 22, 23],
    weekendFactor: 0.3, // 70% less on weekends (closed)
    temperatureSensitivity: 0.25, // 0.25 kW per °C (more AC)
  },
  industrial: {
    peakHours: [8, 9, 10, 11, 12, 13, 14, 15, 16], // Day shift
    shoulderHours: [7, 17, 18],
    offPeakHours: [0, 1, 2, 3, 4, 5, 6, 19, 20, 21, 22, 23],
    weekendFactor: 0.5, // 50% on weekends (reduced operations)
    temperatureSensitivity: 0.05, // 0.05 kW per °C (less temperature sensitive)
  },
}

/**
 * Infers site type from daily consumption
 *
 * Simple heuristic based on consumption levels.
 *
 * @param dailyConsumptionKwh - Daily consumption in kWh
 * @returns Inferred site type
 */
export const inferSiteType = (dailyConsumptionKwh: number): SiteType => {
  if (dailyConsumptionKwh < 70) {
    return 'residential'
  } else if (dailyConsumptionKwh < 120) {
    return 'commercial'
  } else {
    return 'industrial'
  }
}

/**
 * Creates a load profile for a site
 *
 * @param site - Site with consumption data
 * @param siteType - Optional explicit site type (inferred if not provided)
 * @returns Complete load profile
 */
export const getLoadProfile = (site: Site, siteType?: SiteType): LoadProfile => {
  const dailyConsumption = site.dailyConsumptionKwh || 65
  const avgLoadKw = dailyConsumption / 24

  // Infer site type if not provided
  const type = siteType || inferSiteType(dailyConsumption)
  const profileTemplate = LOAD_PROFILES[type]

  // Calculate base and peak loads
  let baseLoadFactor: number
  let peakLoadFactor: number

  switch (type) {
    case 'residential':
      baseLoadFactor = 0.3 // 30% base
      peakLoadFactor = 3.0 // 3x peak
      break
    case 'commercial':
      baseLoadFactor = 0.2 // 20% base
      peakLoadFactor = 2.5 // 2.5x peak
      break
    case 'industrial':
      baseLoadFactor = 0.7 // 70% base
      peakLoadFactor = 1.5 // 1.5x peak
      break
  }

  return {
    baseLoadKw: avgLoadKw * baseLoadFactor,
    peakLoadKw: avgLoadKw * peakLoadFactor,
    ...profileTemplate,
  }
}

/**
 * Calculates load power for a specific timestamp
 *
 * @param timestamp - Current timestamp
 * @param weather - Weather conditions (for temperature)
 * @param profile - Load profile for the site
 * @returns Load power in kW
 */
export const calculateLoadPower = (
  timestamp: Date,
  weather: WeatherData,
  profile: LoadProfile
): number => {
  const hour = timestamp.getHours()
  const dayOfWeek = timestamp.getDay() // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // Determine time-of-day factor
  let todFactor: number
  if (profile.peakHours.includes(hour)) {
    todFactor = 1.0 // Peak
  } else if (profile.shoulderHours.includes(hour)) {
    todFactor = 0.7 // Shoulder
  } else {
    todFactor = 0.4 // Off-peak
  }

  // Apply weekend factor
  const weekendFactor = isWeekend ? profile.weekendFactor : 1.0

  // Calculate base load based on time of day
  const baseLoad = profile.baseLoadKw + (profile.peakLoadKw - profile.baseLoadKw) * todFactor

  // Temperature effect (AC usage above 25°C)
  const tempExcess = Math.max(0, weather.temperature - 25)
  const tempLoad = profile.temperatureSensitivity * tempExcess

  // Calculate total load
  const totalLoad = (baseLoad + tempLoad) * weekendFactor

  // Add realistic noise (±10%)
  const noiseFactor = 1 + (Math.random() * 0.2 - 0.1)

  return Math.max(0, totalLoad * noiseFactor)
}

/**
 * Calculates average load for a site
 *
 * Helper function to get the average expected load.
 *
 * @param site - Site with consumption data
 * @returns Average load in kW
 */
export const getAverageLoad = (site: Site): number => {
  const dailyConsumption = site.dailyConsumptionKwh || 65
  return dailyConsumption / 24
}

/**
 * Generates load pattern for a full day (24 hours)
 *
 * Useful for visualization and testing.
 *
 * @param site - Site with consumption data
 * @param date - Date to generate pattern for
 * @param weather - Weather data array (24 hourly readings)
 * @param siteType - Optional explicit site type
 * @returns Array of 24 hourly load values in kW
 */
export const generateDailyLoadPattern = (
  site: Site,
  date: Date,
  weather: WeatherData[],
  siteType?: SiteType
): number[] => {
  const profile = getLoadProfile(site, siteType)
  const loads: number[] = []

  for (let hour = 0; hour < 24; hour++) {
    const timestamp = new Date(date)
    timestamp.setHours(hour, 0, 0, 0)

    // Find closest weather data
    const weatherData =
      weather.find((w) => w.timestamp.getHours() === hour) || weather[0]

    const load = calculateLoadPower(timestamp, weatherData, profile)
    loads.push(load)
  }

  return loads
}

/**
 * Validates that load profile matches expected daily consumption
 *
 * @param site - Site with consumption data
 * @param loads - Array of hourly loads
 * @returns Validation result
 */
export const validateDailyConsumption = (
  site: Site,
  loads: number[]
): {
  isValid: boolean
  expectedKwh: number
  actualKwh: number
  errorPercent: number
} => {
  const expectedKwh = site.dailyConsumptionKwh || 65
  const actualKwh = loads.reduce((sum, load) => sum + load, 0)
  const errorPercent = Math.abs((actualKwh - expectedKwh) / expectedKwh) * 100

  return {
    isValid: errorPercent < 15, // Allow 15% variance
    expectedKwh,
    actualKwh,
    errorPercent,
  }
}
