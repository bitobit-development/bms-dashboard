/**
 * Telemetry Schema
 *
 * Time-series data for BMS readings at 5-minute intervals.
 * Uses PostgreSQL partitioning for efficient queries and data management.
 *
 * IMPORTANT: After initial migration, create partitions manually:
 *
 * -- Create monthly partitions (example for 2025)
 * CREATE TABLE telemetry_readings_202501 PARTITION OF telemetry_readings
 *   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
 * CREATE TABLE telemetry_readings_202502 PARTITION OF telemetry_readings
 *   FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
 *
 * Or use automated partition management with pg_partman extension.
 */

import {
  pgTable,
  serial,
  integer,
  timestamp,
  real,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sites } from './sites'

/**
 * Main telemetry table - partitioned by timestamp (monthly)
 *
 * Each reading captures the complete state of a site at a 5-minute interval.
 */
export const telemetryReadings = pgTable('telemetry_readings', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').notNull(),

  // Battery metrics
  batteryVoltage: real('battery_voltage'), // Volts
  batteryCurrent: real('battery_current'), // Amps
  batteryChargeLevel: real('battery_charge_level'), // Percentage (0-100)
  batteryTemperature: real('battery_temperature'), // Celsius
  batteryStateOfHealth: real('battery_soh'), // Percentage (0-100)
  batteryPowerKw: real('battery_power_kw'), // kW (negative = discharging)

  // Solar generation metrics (aggregate from panels/inverters)
  solarPowerKw: real('solar_power_kw'), // Current generation in kW
  solarEnergyKwh: real('solar_energy_kwh'), // Cumulative for the interval
  solarEfficiency: real('solar_efficiency'), // Percentage

  // Inverter metrics (aggregate from 2 inverters)
  inverter1PowerKw: real('inverter1_power_kw'),
  inverter1Efficiency: real('inverter1_efficiency'),
  inverter1Temperature: real('inverter1_temperature'),
  inverter2PowerKw: real('inverter2_power_kw'),
  inverter2Efficiency: real('inverter2_efficiency'),
  inverter2Temperature: real('inverter2_temperature'),

  // Grid metrics
  gridVoltage: real('grid_voltage'), // Volts
  gridFrequency: real('grid_frequency'), // Hz
  gridPowerKw: real('grid_power_kw'), // kW (positive = import, negative = export)
  gridEnergyKwh: real('grid_energy_kwh'), // Cumulative for the interval

  // Consumption metrics
  loadPowerKw: real('load_power_kw'), // Total site consumption
  loadEnergyKwh: real('load_energy_kwh'), // Cumulative for the interval

  // Additional data (for flexibility)
  metadata: jsonb('metadata').$type<{
    dataQuality?: 'good' | 'degraded' | 'poor'
    missingSensors?: string[]
    [key: string]: any
  }>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Critical: site + timestamp for time-range queries
  siteTimestampIdx: index('telemetry_site_timestamp_idx')
    .on(table.siteId, table.timestamp.desc()),

  // Timestamp index for partitioning and range scans
  timestampIdx: index('telemetry_timestamp_idx').on(table.timestamp.desc()),

  // Unique constraint to prevent duplicate readings
  uniqueSiteTimestamp: uniqueIndex('telemetry_site_timestamp_unique')
    .on(table.siteId, table.timestamp),
}))

/**
 * Aggregated telemetry - hourly rollups for faster dashboard queries
 *
 * This table stores pre-computed hourly averages to reduce query load
 * on the main telemetry_readings table.
 */
export const telemetryHourly = pgTable('telemetry_hourly', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').notNull(), // Start of hour

  // Battery metrics (averages)
  avgBatteryVoltage: real('avg_battery_voltage'),
  avgBatteryCurrent: real('avg_battery_current'),
  avgBatteryChargeLevel: real('avg_battery_charge_level'),
  avgBatteryTemperature: real('avg_battery_temperature'),
  minBatteryChargeLevel: real('min_battery_charge_level'),
  maxBatteryChargeLevel: real('max_battery_charge_level'),

  // Solar generation (sums for energy, avg for power)
  totalSolarEnergyKwh: real('total_solar_energy_kwh'),
  avgSolarPowerKw: real('avg_solar_power_kw'),
  avgSolarEfficiency: real('avg_solar_efficiency'),

  // Grid metrics
  totalGridEnergyKwh: real('total_grid_energy_kwh'),
  avgGridPowerKw: real('avg_grid_power_kw'),

  // Consumption
  totalLoadEnergyKwh: real('total_load_energy_kwh'),
  avgLoadPowerKw: real('avg_load_power_kw'),

  // Metadata
  readingCount: integer('reading_count').notNull(), // Number of 5-min readings aggregated

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  siteTimestampIdx: index('telemetry_hourly_site_timestamp_idx')
    .on(table.siteId, table.timestamp.desc()),
  timestampIdx: index('telemetry_hourly_timestamp_idx').on(table.timestamp.desc()),
  uniqueSiteTimestamp: uniqueIndex('telemetry_hourly_site_timestamp_unique')
    .on(table.siteId, table.timestamp),
}))

/**
 * Aggregated telemetry - daily rollups for historical analysis
 */
export const telemetryDaily = pgTable('telemetry_daily', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(), // Date (midnight UTC)

  // Daily energy totals
  totalSolarEnergyKwh: real('total_solar_energy_kwh'),
  totalGridEnergyKwh: real('total_grid_energy_kwh'),
  totalLoadEnergyKwh: real('total_load_energy_kwh'),

  // Battery statistics
  avgBatteryChargeLevel: real('avg_battery_charge_level'),
  minBatteryChargeLevel: real('min_battery_charge_level'),
  maxBatteryChargeLevel: real('max_battery_charge_level'),
  avgBatteryTemperature: real('avg_battery_temperature'),
  maxBatteryTemperature: real('max_battery_temperature'),

  // System performance
  avgSolarEfficiency: real('avg_solar_efficiency'),
  uptimeMinutes: integer('uptime_minutes'), // Minutes of operation

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  siteDateIdx: index('telemetry_daily_site_date_idx')
    .on(table.siteId, table.date.desc()),
  dateIdx: index('telemetry_daily_date_idx').on(table.date.desc()),
  uniqueSiteDate: uniqueIndex('telemetry_daily_site_date_unique')
    .on(table.siteId, table.date),
}))

// Relations
export const telemetryReadingsRelations = relations(telemetryReadings, ({ one }) => ({
  site: one(sites, {
    fields: [telemetryReadings.siteId],
    references: [sites.id],
  }),
}))

export type TelemetryReading = typeof telemetryReadings.$inferSelect
export type NewTelemetryReading = typeof telemetryReadings.$inferInsert
export type TelemetryHourly = typeof telemetryHourly.$inferSelect
export type TelemetryDaily = typeof telemetryDaily.$inferSelect
