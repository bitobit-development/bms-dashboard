/**
 * Solar Production Calculator
 *
 * Physics-based solar power production calculations using real weather data.
 * Accounts for solar irradiance, sun angle, temperature effects, and cloud cover.
 */

import type { WeatherData } from '../types/weather'
import type { Site } from '../db/schema/sites'

/**
 * Solar panel configuration parameters
 */
export interface SolarConfig {
  /** Total panel capacity in kW */
  panelCapacityKw: number
  /** Panel efficiency (0.15-0.22 for 15-22%) */
  panelEfficiency: number
  /** Total panel area in square meters */
  panelArea: number
  /** Temperature coefficient (typically -0.005 for -0.5%/°C) */
  temperatureCoefficient: number
  /** Inverter efficiency (0.95-0.98) */
  inverterEfficiency: number
  /** System losses from wiring, soiling, shading (0.14 for 14%) */
  systemLosses: number
}

/**
 * Default solar configuration values
 */
const DEFAULT_CONFIG: Omit<SolarConfig, 'panelCapacityKw' | 'panelArea'> = {
  panelEfficiency: 0.20, // 20% efficient panels
  temperatureCoefficient: -0.005, // -0.5%/°C above 25°C
  inverterEfficiency: 0.97, // 97% efficient inverter
  systemLosses: 0.14, // 14% total system losses
}

/**
 * Calculates solar power production for a specific timestamp
 *
 * Formula:
 * P = Capacity × (Irradiance/1000) × SunAngle × TempFactor × CloudFactor × InverterEff × (1 - Losses) × Noise
 *
 * @param weather - Current weather conditions
 * @param config - Solar system configuration
 * @param timestamp - Current timestamp
 * @returns Solar power output in kW (0 if before sunrise or after sunset)
 */
export const calculateSolarProduction = (
  weather: WeatherData,
  config: SolarConfig,
  timestamp: Date
): number => {
  // No solar production at night
  if (timestamp < weather.sunrise || timestamp > weather.sunset) {
    return 0
  }

  // No solar production without irradiance
  if (weather.solarIrradiance <= 0) {
    return 0
  }

  // 1. Base production from irradiance (normalized to 1000 W/m²)
  const irradianceFactor = weather.solarIrradiance / 1000

  // 2. Sun angle factor (peaks at solar noon)
  const sunAngleFactor = calculateSunAngleFactor(
    timestamp,
    weather.sunrise,
    weather.sunset
  )

  // 3. Temperature effect on panel efficiency
  const temperatureFactor = calculateTemperatureFactor(
    weather.temperature,
    config.temperatureCoefficient
  )

  // 4. Cloud cover impact (up to 30% additional reduction)
  const cloudFactor = calculateCloudFactor(weather.cloudCover)

  // 5. Realistic noise (±5% variation)
  const noiseFactor = 1 + (Math.random() * 0.1 - 0.05)

  // Calculate total power
  const power =
    config.panelCapacityKw *
    irradianceFactor *
    sunAngleFactor *
    temperatureFactor *
    cloudFactor *
    config.inverterEfficiency *
    (1 - config.systemLosses) *
    noiseFactor

  // Return non-negative power
  return Math.max(0, power)
}

/**
 * Calculates sun angle factor based on time of day
 *
 * Uses sine curve to model sun's path from sunrise to sunset.
 * Factor is 0 at sunrise/sunset and 1 at solar noon.
 *
 * @param timestamp - Current time
 * @param sunrise - Sunrise time
 * @param sunset - Sunset time
 * @returns Sun angle factor (0-1)
 */
export const calculateSunAngleFactor = (
  timestamp: Date,
  sunrise: Date,
  sunset: Date
): number => {
  const sunriseTime = sunrise.getTime()
  const sunsetTime = sunset.getTime()
  const currentTime = timestamp.getTime()

  // Calculate day fraction (0 at sunrise, 1 at sunset)
  const dayLength = sunsetTime - sunriseTime
  const timeSinceSunrise = currentTime - sunriseTime
  const dayFraction = timeSinceSunrise / dayLength

  // Use sine curve to model sun angle (peaks at 0.5 = solar noon)
  const sunAngle = Math.sin(Math.PI * dayFraction)

  return Math.max(0, Math.min(1, sunAngle))
}

/**
 * Calculates temperature effect on panel efficiency
 *
 * Solar panels lose efficiency at higher temperatures.
 * Typically -0.5%/°C above 25°C.
 *
 * @param temperature - Ambient temperature in °C
 * @param coefficient - Temperature coefficient (negative)
 * @returns Temperature factor (typically 0.9-1.05)
 */
export const calculateTemperatureFactor = (
  temperature: number,
  coefficient: number
): number => {
  const referenceTemp = 25 // Standard Test Conditions
  const tempDifference = temperature - referenceTemp
  const factor = 1 + coefficient * tempDifference

  // Ensure factor stays within reasonable bounds
  return Math.max(0.5, Math.min(1.2, factor))
}

/**
 * Calculates cloud cover impact on solar production
 *
 * Heavy cloud cover can reduce solar production by up to 30% beyond
 * the irradiance reduction already captured.
 *
 * @param cloudCover - Cloud cover percentage (0-100)
 * @returns Cloud factor (0.7-1.0)
 */
export const calculateCloudFactor = (cloudCover: number): number => {
  // Additional loss beyond irradiance reduction
  const additionalLoss = (cloudCover / 100) * 0.3

  return 1 - additionalLoss
}

/**
 * Calculates solar efficiency percentage
 *
 * Efficiency = (Actual Production / Theoretical Max Production) × 100
 *
 * @param actualProduction - Actual power output in kW
 * @param weather - Current weather conditions
 * @param config - Solar system configuration
 * @returns Efficiency percentage (0-100)
 */
export const calculateSolarEfficiency = (
  actualProduction: number,
  weather: WeatherData,
  config: SolarConfig
): number => {
  if (weather.solarIrradiance <= 0) {
    return 0
  }

  // Theoretical maximum at current irradiance (no losses)
  const theoreticalMax =
    config.panelCapacityKw * (weather.solarIrradiance / 1000)

  if (theoreticalMax <= 0) {
    return 0
  }

  const efficiency = (actualProduction / theoreticalMax) * 100

  return Math.max(0, Math.min(100, efficiency))
}

/**
 * Calculates solar voltage (simplified DC voltage model)
 *
 * Voltage varies with temperature and load.
 * This is a simplified model for realistic-looking data.
 *
 * @param powerKw - Current power output in kW
 * @param config - Solar system configuration
 * @param temperature - Panel temperature in °C
 * @returns DC voltage in volts
 */
export const calculateSolarVoltage = (
  powerKw: number,
  config: SolarConfig,
  temperature: number
): number => {
  // Base voltage (slightly higher than nominal)
  const baseVoltage = 520

  // Temperature coefficient for voltage (typically -0.3%/°C)
  const tempCoeff = -0.003
  const tempFactor = 1 + tempCoeff * (temperature - 25)

  // Voltage drop under load (simplified)
  const loadFactor = powerKw > 0 ? 0.98 : 1.0

  const voltage = baseVoltage * tempFactor * loadFactor

  // Add small noise
  const noise = 1 + (Math.random() * 0.02 - 0.01)

  return voltage * noise
}

/**
 * Calculates solar current (I = P / V)
 *
 * @param powerKw - Current power output in kW
 * @param voltage - DC voltage in volts
 * @returns DC current in amps
 */
export const calculateSolarCurrent = (powerKw: number, voltage: number): number => {
  if (voltage <= 0) {
    return 0
  }

  // Convert kW to W, then calculate current
  const powerW = powerKw * 1000
  const current = powerW / voltage

  return current
}

/**
 * Creates default solar configuration from site data
 *
 * @param site - Site with solar capacity
 * @returns Solar configuration object
 */
export const getDefaultSolarConfig = (site: Site): SolarConfig => {
  const capacityKw = site.solarCapacityKw || 0

  // Estimate panel area from capacity and efficiency
  // Assuming 1000 W/m² standard irradiance
  const panelArea = (capacityKw * 1000) / (1000 * DEFAULT_CONFIG.panelEfficiency)

  return {
    panelCapacityKw: capacityKw,
    panelArea,
    ...DEFAULT_CONFIG,
  }
}
