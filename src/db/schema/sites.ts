/**
 * Sites and Equipment Schema
 *
 * Each site represents a physical location with solar, batteries, and grid connection.
 * Equipment tracks individual components (inverters, batteries, panels).
 */

import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  real,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'

export const sites = pgTable('sites', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Basic information
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),

  // Location
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country').notNull().default('US'),
  postalCode: text('postal_code'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  timezone: text('timezone').notNull().default('UTC'),

  // Site specifications
  nominalVoltage: real('nominal_voltage').notNull().default(500), // 500V
  dailyConsumptionKwh: real('daily_consumption_kwh').default(65), // 60-70 kWh
  batteryCapacityKwh: real('battery_capacity_kwh'),
  solarCapacityKw: real('solar_capacity_kw'),

  // Configuration
  config: jsonb('config').$type<{
    alertThresholds?: {
      batteryLowPercent?: number
      batteryHighTemp?: number
      gridFrequencyMin?: number
      gridFrequencyMax?: number
      voltageMin?: number
      voltageMax?: number
    }
    maintenanceSchedule?: {
      batteryCheck?: string // cron expression
      inverterCheck?: string
    }
  }>().default({}),

  // Status
  status: text('status', { enum: ['active', 'inactive', 'maintenance', 'offline'] })
    .notNull()
    .default('active'),

  // Timestamps
  installedAt: timestamp('installed_at'),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Index for filtering by organization
  orgIdIdx: index('sites_org_id_idx').on(table.organizationId),
  // Index for active sites queries
  statusIdx: index('sites_status_idx').on(table.status),
  // Composite index for org + status (common query pattern)
  orgStatusIdx: index('sites_org_status_idx').on(table.organizationId, table.status),
  // Geospatial queries
  locationIdx: index('sites_location_idx').on(table.latitude, table.longitude),
}))

export const equipmentTypes = {
  INVERTER: 'inverter',
  BATTERY: 'battery',
  SOLAR_PANEL: 'solar_panel',
  CHARGE_CONTROLLER: 'charge_controller',
  GRID_METER: 'grid_meter',
} as const

export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),

  // Equipment identification
  type: text('type', {
    enum: [
      'inverter',
      'battery',
      'solar_panel',
      'charge_controller',
      'grid_meter'
    ]
  }).notNull(),
  name: text('name').notNull(),
  manufacturer: text('manufacturer'),
  model: text('model'),
  serialNumber: text('serial_number'),

  // Specifications
  capacity: real('capacity'), // kW or kWh depending on type
  voltage: real('voltage'), // Nominal voltage
  specs: jsonb('specs').$type<{
    maxPower?: number
    efficiency?: number
    warrantyYears?: number
    [key: string]: any
  }>().default({}),

  // Status and health
  status: text('status', {
    enum: ['operational', 'degraded', 'maintenance', 'failed', 'offline']
  }).notNull().default('operational'),
  healthScore: real('health_score'), // 0-100

  // Timestamps
  installedAt: timestamp('installed_at'),
  lastMaintenanceAt: timestamp('last_maintenance_at'),
  nextMaintenanceAt: timestamp('next_maintenance_at'),
  warrantyExpiresAt: timestamp('warranty_expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Index for equipment by site
  siteIdIdx: index('equipment_site_id_idx').on(table.siteId),
  // Index for equipment type queries
  typeIdx: index('equipment_type_idx').on(table.type),
  // Composite for site + type (common pattern)
  siteTypeIdx: index('equipment_site_type_idx').on(table.siteId, table.type),
  // Index for maintenance scheduling
  maintenanceIdx: index('equipment_maintenance_idx').on(table.nextMaintenanceAt),
}))

// Relations
export const sitesRelations = relations(sites, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [sites.organizationId],
    references: [organizations.id],
  }),
  equipment: many(equipment),
  telemetryReadings: many('telemetryReadings' as any),
  alerts: many('alerts' as any),
}))

export const equipmentRelations = relations(equipment, ({ one }) => ({
  site: one(sites, {
    fields: [equipment.siteId],
    references: [sites.id],
  }),
}))

export type Site = typeof sites.$inferSelect
export type NewSite = typeof sites.$inferInsert
export type Equipment = typeof equipment.$inferSelect
export type NewEquipment = typeof equipment.$inferInsert
