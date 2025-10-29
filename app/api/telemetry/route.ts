/**
 * Telemetry Ingestion API
 *
 * POST /api/telemetry
 *
 * Accepts telemetry data from remote BMS sites and stores it in the database.
 *
 * Features:
 * - Batch insertion support (up to 100 readings per request)
 * - Data validation with Zod schemas
 * - Duplicate timestamp handling (upsert)
 * - Updates site last_seen_at timestamp
 * - Type-safe responses
 *
 * Request body:
 * {
 *   "site_id": 1,
 *   "readings": [
 *     {
 *       "timestamp": "2025-10-29T08:00:00Z",
 *       "battery_voltage": 495.5,
 *       "battery_current": 12.3,
 *       ...
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/src/db'
import { telemetryReadings, sites } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import {
  telemetryRequestSchema,
  type TelemetryResponse,
} from '@/src/types/telemetry'
import { ZodError } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/telemetry
 *
 * Ingests telemetry data from BMS sites.
 */
export const POST = async (request: NextRequest): Promise<NextResponse<TelemetryResponse>> => {
  try {
    // Parse request body
    const body = await request.json()

    // Validate request schema
    const validatedData = telemetryRequestSchema.parse(body)
    const { site_id, readings } = validatedData

    // Verify site exists
    const [site] = await db
      .select({ id: sites.id, name: sites.name })
      .from(sites)
      .where(eq(sites.id, site_id))
      .limit(1)

    if (!site) {
      return NextResponse.json(
        {
          success: false,
          error: 'Site not found',
          details: { site_id },
        },
        { status: 404 }
      )
    }

    // Transform and insert readings
    const transformedReadings = readings.map((reading) => ({
      siteId: site_id,
      timestamp: new Date(reading.timestamp),
      batteryVoltage: reading.battery_voltage ?? null,
      batteryCurrent: reading.battery_current ?? null,
      batteryChargeLevel: reading.battery_charge_level ?? null,
      batteryTemperature: reading.battery_temperature ?? null,
      batteryStateOfHealth: reading.battery_health ?? null,
      solarPowerKw: reading.solar_power_kw ?? null,
      solarEfficiency: reading.solar_efficiency ?? null,
      inverter1PowerKw: reading.inverter_1_power_kw ?? null,
      inverter1Efficiency: reading.inverter_1_efficiency ?? null,
      inverter1Temperature: reading.inverter_1_temperature ?? null,
      inverter2PowerKw: reading.inverter_2_power_kw ?? null,
      inverter2Efficiency: reading.inverter_2_efficiency ?? null,
      inverter2Temperature: reading.inverter_2_temperature ?? null,
      gridVoltage: reading.grid_voltage ?? null,
      gridFrequency: reading.grid_frequency ?? null,
      gridPowerKw:
        reading.grid_import_kw !== undefined && reading.grid_import_kw !== null
          ? reading.grid_import_kw -
            (reading.grid_export_kw !== undefined && reading.grid_export_kw !== null
              ? reading.grid_export_kw
              : 0)
          : null,
      loadPowerKw: reading.load_power_kw ?? null,
      metadata: {
        dataQuality: 'good' as 'good' | 'degraded' | 'poor',
        receivedAt: new Date().toISOString(),
      },
    }))

    // Insert readings (handle duplicates with upsert)
    await db
      .insert(telemetryReadings)
      .values(transformedReadings)
      .onConflictDoNothing({
        target: [telemetryReadings.siteId, telemetryReadings.timestamp],
      })

    // Update site's last_seen_at timestamp
    await db
      .update(sites)
      .set({
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sites.id, site_id))

    // Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          inserted: readings.length,
          site_id,
          site_updated: true,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    // Validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    // Database or other errors
    console.error('Telemetry ingestion error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/telemetry (health check)
 */
export const GET = async (): Promise<NextResponse> => {
  return NextResponse.json({
    service: 'Telemetry Ingestion API',
    status: 'operational',
    version: '1.0.0',
    endpoints: {
      POST: '/api/telemetry - Ingest telemetry data',
    },
  })
}
