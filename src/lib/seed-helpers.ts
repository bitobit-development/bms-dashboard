/**
 * Seed Helper Functions
 *
 * Utility functions for weather-aware data seeding including validation,
 * calculations, and data integrity checks.
 */

import type { BatteryState } from './battery-simulator'
import type { SolarConfig } from './solar-calculator'
import type { TelemetryReading } from '../db/schema/telemetry'

/**
 * Calculates average of an array of numbers
 *
 * @param values - Array of numbers
 * @returns Average value, or 0 if array is empty
 */
export const avg = (values: number[]): number => {
  if (values.length === 0) return 0
  return sum(values) / values.length
}

/**
 * Calculates sum of an array of numbers
 *
 * @param values - Array of numbers
 * @returns Sum of all values
 */
export const sum = (values: number[]): number => {
  return values.reduce((total, value) => total + value, 0)
}

/**
 * Calculates minimum value in array
 *
 * @param values - Array of numbers
 * @returns Minimum value, or 0 if array is empty
 */
export const min = (values: number[]): number => {
  if (values.length === 0) return 0
  return Math.min(...values)
}

/**
 * Calculates maximum value in array
 *
 * @param values - Array of numbers
 * @returns Maximum value, or 0 if array is empty
 */
export const max = (values: number[]): number => {
  if (values.length === 0) return 0
  return Math.max(...values)
}

/**
 * Calculates solar voltage (simplified DC voltage model)
 *
 * Voltage varies with temperature and load.
 *
 * @param powerKw - Current power output in kW
 * @param config - Solar system configuration
 * @param temperature - Ambient temperature in °C
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
  if (voltage <= 0) return 0

  // Convert kW to W, then calculate current
  const powerW = powerKw * 1000
  return powerW / voltage
}

/**
 * Determines system status based on battery and solar state
 *
 * @param batteryState - Current battery state
 * @param solarPowerKw - Current solar production
 * @returns System status
 */
export const determineSystemStatus = (
  batteryState: BatteryState,
  solarPowerKw: number
): 'operational' | 'warning' | 'degraded' | 'error' => {
  // Error conditions
  if (batteryState.health < 80) return 'error'
  if (batteryState.soc < 0.15) return 'error'
  if (batteryState.temperature > 50 || batteryState.temperature < 0) return 'error'

  // Warning conditions
  if (batteryState.health < 90) return 'warning'
  if (batteryState.soc < 0.25) return 'warning'
  if (batteryState.temperature > 45) return 'warning'

  // Degraded conditions
  if (batteryState.soc < 0.35) return 'degraded'

  return 'operational'
}

/**
 * Determines inverter status based on power output
 *
 * @param powerKw - Inverter power output
 * @param temperature - Inverter temperature
 * @returns Inverter status
 */
export const determineInverterStatus = (
  powerKw: number,
  temperature: number
): 'operational' | 'warning' | 'degraded' | 'offline' => {
  // Offline if no power and low temperature
  if (powerKw < 0.1 && temperature < 30) return 'offline'

  // Warning if overheating
  if (temperature > 65) return 'warning'

  // Degraded if running hot
  if (temperature > 55) return 'degraded'

  return 'operational'
}

/**
 * Validates energy balance for telemetry readings
 *
 * Energy conservation: Solar + Grid Import = Load + Grid Export + Battery Change
 *
 * @param readings - Array of telemetry readings (typically 5-min intervals)
 * @returns Validation result with energy balance details
 */
export const validateEnergyBalance = (
  readings: TelemetryReading[]
): {
  isValid: boolean
  lossPercent: number
  details: {
    solarKwh: number
    gridImportKwh: number
    gridExportKwh: number
    loadKwh: number
    batteryChangeKwh: number
    inputKwh: number
    outputKwh: number
  }
} => {
  if (readings.length === 0) {
    return {
      isValid: false,
      lossPercent: 0,
      details: {
        solarKwh: 0,
        gridImportKwh: 0,
        gridExportKwh: 0,
        loadKwh: 0,
        batteryChangeKwh: 0,
        inputKwh: 0,
        outputKwh: 0,
      },
    }
  }

  // Calculate total energy for each component
  // Note: Each reading represents energy over 5 minutes
  const solarKwh = sum(readings.map((r) => r.solarPowerKw || 0)) * (5 / 60)
  const gridImportKwh = sum(
    readings.map((r) => Math.max(0, r.gridPowerKw || 0))
  ) * (5 / 60)
  const gridExportKwh = sum(
    readings.map((r) => Math.max(0, -(r.gridPowerKw || 0)))
  ) * (5 / 60)
  const loadKwh = sum(readings.map((r) => r.loadPowerKw || 0)) * (5 / 60)

  // Calculate battery energy change from charge level
  const firstReading = readings[0]
  const lastReading = readings[readings.length - 1]

  // Estimate battery capacity (rough estimation)
  const estimatedCapacityKwh = 50 // Default assumption

  const batteryChangeKwh =
    ((lastReading.batteryChargeLevel || 0) - (firstReading.batteryChargeLevel || 0)) *
    estimatedCapacityKwh / 100

  // Energy balance: Input vs Output
  const inputKwh = solarKwh + gridImportKwh
  const outputKwh = loadKwh + gridExportKwh + batteryChangeKwh

  // Calculate losses (accounting for system inefficiencies)
  const lossKwh = inputKwh - outputKwh
  const lossPercent = inputKwh > 0 ? Math.abs(lossKwh / inputKwh) * 100 : 0

  // Valid if losses are within expected range (5-20% is typical)
  const isValid = lossPercent >= 5 && lossPercent <= 20

  return {
    isValid,
    lossPercent,
    details: {
      solarKwh,
      gridImportKwh,
      gridExportKwh,
      loadKwh,
      batteryChangeKwh,
      inputKwh,
      outputKwh,
    },
  }
}

/**
 * Adds realistic noise to a value
 *
 * @param value - Base value
 * @param percent - Noise as percentage (e.g., 5 for ±5%)
 * @returns Value with noise applied
 */
export const addNoise = (value: number, percent: number): number => {
  const variation = percent / 100
  const noiseFactor = 1 + (Math.random() * 2 - 1) * variation
  return value * noiseFactor
}

/**
 * Clamps a value between min and max
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value))
}

/**
 * Rounds a number to specified decimal places
 *
 * @param value - Value to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded value
 */
export const roundTo = (value: number, decimals: number = 2): number => {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}

/**
 * Formats a duration in minutes to human-readable string
 *
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "2h 30m")
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return `${mins}m`
}

/**
 * Calculates progress percentage
 *
 * @param current - Current value
 * @param total - Total value
 * @returns Progress percentage (0-100)
 */
export const calculateProgress = (current: number, total: number): number => {
  if (total <= 0) return 0
  return Math.min(100, (current / total) * 100)
}

/**
 * Validates that a timestamp is within a reasonable range
 *
 * @param timestamp - Timestamp to validate
 * @param startDate - Start of valid range
 * @param endDate - End of valid range
 * @returns True if timestamp is within range
 */
export const isValidTimestamp = (
  timestamp: Date,
  startDate: Date,
  endDate: Date
): boolean => {
  return timestamp >= startDate && timestamp <= endDate
}

/**
 * Generates array of timestamps at regular intervals
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param intervalMinutes - Interval in minutes (default: 5)
 * @returns Array of timestamps
 */
export const generateTimestamps = (
  startDate: Date,
  endDate: Date,
  intervalMinutes: number = 5
): Date[] => {
  const timestamps: Date[] = []
  const intervalMs = intervalMinutes * 60 * 1000

  let current = new Date(startDate)
  while (current <= endDate) {
    timestamps.push(new Date(current))
    current = new Date(current.getTime() + intervalMs)
  }

  return timestamps
}
