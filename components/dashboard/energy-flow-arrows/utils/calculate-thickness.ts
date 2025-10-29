import { MIN_STROKE_WIDTH, MAX_STROKE_WIDTH, POWER_RANGE_MAX } from '../constants'

/**
 * Calculate arrow stroke width based on power magnitude
 * @param powerKw Power in kilowatts
 * @returns Stroke width in pixels
 */
export function calculateStrokeWidth(powerKw: number): number {
  // Linear mapping from power range to stroke width range
  const normalized = Math.min(powerKw / POWER_RANGE_MAX, 1)
  const width = MIN_STROKE_WIDTH + normalized * (MAX_STROKE_WIDTH - MIN_STROKE_WIDTH)

  return Math.round(width * 10) / 10 // Round to 1 decimal
}
