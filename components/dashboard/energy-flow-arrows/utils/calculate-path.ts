import { Position } from '../types'

/**
 * Calculate a straight line path between two points
 * @param from Starting position
 * @param to Ending position
 * @returns SVG path string for straight arrow
 */
export function calculateArrowPath(from: Position, to: Position): string {
  // Create SVG path with straight line
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
}

/**
 * Calculate midpoint along a straight line
 * Used for positioning power labels
 */
export function calculateCurveMidpoint(from: Position, to: Position): Position {
  // Simple midpoint calculation for straight line
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  }
}
