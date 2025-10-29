/**
 * Alerts and Events Schema
 *
 * Tracks system alerts, notifications, and operational events.
 */

import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sites } from './sites'
import { equipment } from './sites'

export const alertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const

export const alertCategory = {
  BATTERY: 'battery',
  SOLAR: 'solar',
  GRID: 'grid',
  INVERTER: 'inverter',
  SYSTEM: 'system',
  MAINTENANCE: 'maintenance',
} as const

export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  equipmentId: integer('equipment_id')
    .references(() => equipment.id, { onDelete: 'set null' }),

  // Alert classification
  severity: text('severity', {
    enum: ['info', 'warning', 'error', 'critical']
  }).notNull(),
  category: text('category', {
    enum: ['battery', 'solar', 'grid', 'inverter', 'system', 'maintenance']
  }).notNull(),

  // Alert details
  code: text('code').notNull(), // e.g., 'BATTERY_LOW', 'GRID_FREQUENCY_HIGH'
  title: text('title').notNull(),
  message: text('message').notNull(),

  // Context data
  context: jsonb('context').$type<{
    thresholdValue?: number
    actualValue?: number
    unit?: string
    telemetryId?: number
    [key: string]: any
  }>(),

  // Alert lifecycle
  status: text('status', {
    enum: ['active', 'acknowledged', 'resolved', 'dismissed']
  }).notNull().default('active'),
  acknowledgedAt: timestamp('acknowledged_at'),
  acknowledgedBy: text('acknowledged_by'), // User ID or system
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: text('resolved_by'),

  // Notification tracking
  notificationsSent: jsonb('notifications_sent').$type<{
    email?: { sentAt: string; recipients: string[] }[]
    sms?: { sentAt: string; recipients: string[] }[]
    webhook?: { sentAt: string; status: number }[]
  }>(),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Critical: site + status for active alerts dashboard
  siteStatusIdx: index('alerts_site_status_idx')
    .on(table.siteId, table.status),

  // Severity for filtering critical alerts
  severityIdx: index('alerts_severity_idx').on(table.severity),

  // Category for filtering by alert type
  categoryIdx: index('alerts_category_idx').on(table.category),

  // Timestamp for recent alerts
  createdAtIdx: index('alerts_created_at_idx').on(table.createdAt.desc()),

  // Composite for active alerts by site
  siteActiveIdx: index('alerts_site_active_idx')
    .on(table.siteId, table.status, table.severity),
}))

/**
 * Events log - General operational events and audit trail
 */
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .references(() => sites.id, { onDelete: 'cascade' }),

  // Event classification
  type: text('type', {
    enum: [
      'site_online',
      'site_offline',
      'maintenance_started',
      'maintenance_completed',
      'configuration_changed',
      'equipment_installed',
      'equipment_removed',
      'alert_created',
      'alert_resolved',
      'user_action',
      'system_action',
    ]
  }).notNull(),

  // Event details
  title: text('title').notNull(),
  description: text('description'),

  // Context
  context: jsonb('context').$type<{
    userId?: string
    equipmentId?: number
    alertId?: number
    changesBefore?: any
    changesAfter?: any
    [key: string]: any
  }>(),

  // Actor (who/what triggered the event)
  actorType: text('actor_type', { enum: ['user', 'system', 'automation'] }).notNull(),
  actorId: text('actor_id'), // User ID or system identifier

  // Timestamp
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Site events timeline
  siteCreatedIdx: index('events_site_created_idx')
    .on(table.siteId, table.createdAt.desc()),

  // Event type filtering
  typeIdx: index('events_type_idx').on(table.type),

  // Recent events
  createdAtIdx: index('events_created_at_idx').on(table.createdAt.desc()),
}))

/**
 * Maintenance records
 */
export const maintenanceRecords = pgTable('maintenance_records', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  equipmentId: integer('equipment_id')
    .references(() => equipment.id, { onDelete: 'set null' }),

  // Maintenance details
  type: text('type', {
    enum: ['scheduled', 'preventive', 'corrective', 'emergency']
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),

  // Work performed
  workPerformed: text('work_performed'),
  partsReplaced: jsonb('parts_replaced').$type<{
    partName: string
    quantity: number
    serialNumber?: string
  }[]>(),

  // Personnel
  performedBy: text('performed_by'),
  supervisedBy: text('supervised_by'),

  // Status
  status: text('status', {
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled']
  }).notNull().default('scheduled'),

  // Timestamps
  scheduledAt: timestamp('scheduled_at').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdx: index('maintenance_site_idx').on(table.siteId),
  equipmentIdx: index('maintenance_equipment_idx').on(table.equipmentId),
  scheduledIdx: index('maintenance_scheduled_idx').on(table.scheduledAt),
  statusIdx: index('maintenance_status_idx').on(table.status),
}))

// Relations
export const alertsRelations = relations(alerts, ({ one }) => ({
  site: one(sites, {
    fields: [alerts.siteId],
    references: [sites.id],
  }),
  equipment: one(equipment, {
    fields: [alerts.equipmentId],
    references: [equipment.id],
  }),
}))

export const eventsRelations = relations(events, ({ one }) => ({
  site: one(sites, {
    fields: [events.siteId],
    references: [sites.id],
  }),
}))

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one }) => ({
  site: one(sites, {
    fields: [maintenanceRecords.siteId],
    references: [sites.id],
  }),
  equipment: one(equipment, {
    fields: [maintenanceRecords.equipmentId],
    references: [equipment.id],
  }),
}))

export type Alert = typeof alerts.$inferSelect
export type NewAlert = typeof alerts.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect
export type NewMaintenanceRecord = typeof maintenanceRecords.$inferInsert
