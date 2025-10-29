/**
 * Telemetry API Types
 *
 * Type definitions for telemetry data ingestion API.
 */

import { z } from 'zod'

/**
 * Validation schema for a single telemetry reading
 */
export const telemetryReadingSchema = z.object({
  timestamp: z.string().datetime(),

  // Battery metrics
  battery_voltage: z.number().min(0).max(1000).optional().nullable(),
  battery_current: z.number().min(-500).max(500).optional().nullable(),
  battery_charge_level: z.number().min(0).max(100).optional().nullable(),
  battery_temperature: z.number().min(-40).max(100).optional().nullable(),
  battery_health: z.number().min(0).max(100).optional().nullable(),

  // Solar metrics
  solar_power_kw: z.number().min(0).max(1000).optional().nullable(),
  solar_voltage: z.number().min(0).max(1000).optional().nullable(),
  solar_current: z.number().min(0).max(500).optional().nullable(),
  solar_efficiency: z.number().min(0).max(100).optional().nullable(),

  // Inverter 1 metrics
  inverter_1_power_kw: z.number().min(0).max(500).optional().nullable(),
  inverter_1_status: z.enum(['operational', 'degraded', 'maintenance', 'failed', 'offline']).optional().nullable(),
  inverter_1_temperature: z.number().min(-40).max(100).optional().nullable(),
  inverter_1_efficiency: z.number().min(0).max(100).optional().nullable(),

  // Inverter 2 metrics
  inverter_2_power_kw: z.number().min(0).max(500).optional().nullable(),
  inverter_2_status: z.enum(['operational', 'degraded', 'maintenance', 'failed', 'offline']).optional().nullable(),
  inverter_2_temperature: z.number().min(-40).max(100).optional().nullable(),
  inverter_2_efficiency: z.number().min(0).max(100).optional().nullable(),

  // Grid metrics
  grid_status: z.enum(['connected', 'disconnected', 'unstable']).optional().nullable(),
  grid_frequency: z.number().min(0).max(100).optional().nullable(),
  grid_voltage: z.number().min(0).max(1000).optional().nullable(),
  grid_import_kw: z.number().min(0).max(1000).optional().nullable(),
  grid_export_kw: z.number().min(0).max(1000).optional().nullable(),

  // Load metrics
  load_power_kw: z.number().min(0).max(1000).optional().nullable(),

  // System metrics
  system_status: z.enum(['normal', 'warning', 'error', 'offline']).optional().nullable(),
  ambient_temperature: z.number().min(-40).max(60).optional().nullable(),
})

/**
 * Validation schema for telemetry ingestion request
 */
export const telemetryRequestSchema = z.object({
  site_id: z.number().int().positive(),
  readings: z.array(telemetryReadingSchema).min(1).max(100),
})

/**
 * Inferred types from schemas
 */
export type TelemetryReading = z.infer<typeof telemetryReadingSchema>
export type TelemetryRequest = z.infer<typeof telemetryRequestSchema>

/**
 * API response types
 */
export type TelemetryResponse = {
  success: true
  data: {
    inserted: number
    site_id: number
    site_updated: boolean
  }
} | {
  success: false
  error: string
  details?: unknown
}
