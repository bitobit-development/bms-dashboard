/**
 * Weather Schema
 *
 * Stores current weather data for BMS sites to correlate with
 * battery performance and solar generation.
 */

import {
  pgTable,
  serial,
  integer,
  real,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sites } from './sites'

export const weather = pgTable('weather', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sites.id, { onDelete: 'cascade' }),

  // Timestamp
  timestamp: timestamp('timestamp').notNull().defaultNow(),

  // Temperature data (Celsius)
  temperature: real('temperature').notNull(),
  feelsLike: real('feels_like'),
  tempMin: real('temp_min'),
  tempMax: real('temp_max'),

  // Weather conditions
  condition: varchar('condition', { length: 100 }).notNull(),
  conditionCode: integer('condition_code'),
  description: text('description'),

  // Atmospheric data
  humidity: integer('humidity'),
  pressure: integer('pressure'),
  cloudCover: integer('cloud_cover'),
  uvIndex: real('uv_index'),

  // Wind data
  windSpeed: real('wind_speed'),
  windDirection: integer('wind_direction'),

  // Solar/BMS relevant data
  sunrise: timestamp('sunrise'),
  sunset: timestamp('sunset'),
  solarRadiation: real('solar_radiation'), // W/m² - shortwave radiation

  // Metadata
  dataSource: varchar('data_source', { length: 50 }).default('open-meteo'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Index for weather by site
  siteIdIdx: index('weather_site_id_idx').on(table.siteId),
  // Index for timestamp queries (getting latest weather)
  timestampIdx: index('weather_timestamp_idx').on(table.timestamp),
  // Composite index for site + timestamp (common query pattern)
  siteTimestampIdx: index('weather_site_timestamp_idx').on(table.siteId, table.timestamp),
}))

// Relations
export const weatherRelations = relations(weather, ({ one }) => ({
  site: one(sites, {
    fields: [weather.siteId],
    references: [sites.id],
  }),
}))

export type Weather = typeof weather.$inferSelect
export type NewWeather = typeof weather.$inferInsert
