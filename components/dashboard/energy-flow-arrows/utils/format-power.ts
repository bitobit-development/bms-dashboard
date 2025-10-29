/**
 * Format power value for display
 * @param powerKw Power in kilowatts
 * @returns Formatted string (e.g., "1.2 kW")
 */
export function formatPower(powerKw: number): string {
  if (powerKw === 0) return '0.0 kW'

  if (powerKw < 0.1) {
    return `${(powerKw * 1000).toFixed(0)} W`
  }

  if (powerKw < 10) {
    return `${powerKw.toFixed(1)} kW`
  }

  return `${powerKw.toFixed(1)} kW`
}
