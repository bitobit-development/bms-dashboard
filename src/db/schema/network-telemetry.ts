/**
 * Network Telemetry Schema
 *
 * Data usage and network performance metrics for sites.
 * Tracks bandwidth utilization, latency, and data consumption.
 */

import {
  pgTable,
  uuid,
  integer,
  timestamp,
  real,
  bigint,
  varchar,
  date,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sites } from './sites'

/**
 * Raw network telemetry - collected during operating hours (10:00-18:00)
 */
export const networkTelemetry = pgTable('network_telemetry', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').notNull(),

  // Speed metrics (Mbps)
  uploadSpeed: real('upload_speed').notNull(),
  downloadSpeed: real('download_speed').notNull(),
  allocatedBandwidth: real('allocated_bandwidth').notNull(), // 15 or 100 Mbps

  // Latency metrics (ms)
  latency: real('latency').notNull(),
  jitter: real('jitter'),
  packetLoss: real('packet_loss'), // percentage

  // Data consumption (bytes)
  dataConsumed: bigint('data_consumed', { mode: 'number' }).notNull(),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  siteTimestampIdx: index('network_telemetry_site_timestamp_idx')
    .on(table.siteId, table.timestamp),
  timestampIdx: index('network_telemetry_timestamp_idx')
    .on(table.timestamp),
}))

/**
 * Daily aggregates - pre-computed summaries for fast dashboard queries
 */
export const networkDailyAggregates = pgTable('network_daily_aggregates', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),

  // Speed aggregates (Mbps)
  avgUploadSpeed: real('avg_upload_speed').notNull(),
  avgDownloadSpeed: real('avg_download_speed').notNull(),
  maxUploadSpeed: real('max_upload_speed').notNull(),
  maxDownloadSpeed: real('max_download_speed').notNull(),
  allocatedBandwidth: real('allocated_bandwidth').notNull(),

  // Latency aggregates (ms)
  avgLatency: real('avg_latency').notNull(),
  minLatency: real('min_latency').notNull(),
  maxLatency: real('max_latency').notNull(),
  avgJitter: real('avg_jitter'),

  // Consumption totals (bytes)
  totalDataConsumed: bigint('total_data_consumed', { mode: 'number' }).notNull(),
  dataAllowance: bigint('data_allowance', { mode: 'number' }).notNull(), // 1GB in bytes

  // Operating hours
  activeHours: integer('active_hours').notNull(), // Should be 8

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  siteDateIdx: uniqueIndex('network_daily_site_date_idx')
    .on(table.siteId, table.date),
}))

/**
 * Monthly aggregates - rollups for trend analysis and reporting
 */
export const networkMonthlyAggregates = pgTable('network_monthly_aggregates', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),
  month: varchar('month', { length: 7 }).notNull(), // 'YYYY-MM'

  // Speed aggregates (Mbps)
  avgUploadSpeed: real('avg_upload_speed').notNull(),
  avgDownloadSpeed: real('avg_download_speed').notNull(),
  peakUploadSpeed: real('peak_upload_speed').notNull(),
  peakDownloadSpeed: real('peak_download_speed').notNull(),
  allocatedBandwidth: real('allocated_bandwidth').notNull(),
  utilizationPct: real('utilization_pct').notNull(),

  // Latency aggregates (ms)
  avgLatency: real('avg_latency').notNull(),
  p95Latency: real('p95_latency'), // 95th percentile
  avgJitter: real('avg_jitter'),

  // Consumption totals (bytes)
  totalDataConsumed: bigint('total_data_consumed', { mode: 'number' }).notNull(),
  monthlyAllowance: bigint('monthly_allowance', { mode: 'number' }).notNull(),
  consumptionPct: real('consumption_pct').notNull(),

  // Statistics
  activeDays: integer('active_days').notNull(),
  totalActiveHours: integer('total_active_hours').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  siteMonthIdx: uniqueIndex('network_monthly_site_month_idx')
    .on(table.siteId, table.month),
}))

// Relations
export const networkTelemetryRelations = relations(networkTelemetry, ({ one }) => ({
  site: one(sites, {
    fields: [networkTelemetry.siteId],
    references: [sites.id],
  }),
}))

export const networkDailyAggregatesRelations = relations(networkDailyAggregates, ({ one }) => ({
  site: one(sites, {
    fields: [networkDailyAggregates.siteId],
    references: [sites.id],
  }),
}))

export const networkMonthlyAggregatesRelations = relations(networkMonthlyAggregates, ({ one }) => ({
  site: one(sites, {
    fields: [networkMonthlyAggregates.siteId],
    references: [sites.id],
  }),
}))

// Type exports
export type NetworkTelemetry = typeof networkTelemetry.$inferSelect
export type NewNetworkTelemetry = typeof networkTelemetry.$inferInsert
export type NetworkDailyAggregate = typeof networkDailyAggregates.$inferSelect
export type NetworkMonthlyAggregate = typeof networkMonthlyAggregates.$inferSelect
