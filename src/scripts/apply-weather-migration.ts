/**
 * Apply Weather Table Migration
 *
 * Manually applies the weather table migration to the database.
 */

import { db } from '../db/index'
import { sql } from 'drizzle-orm'

const weatherTableSQL = sql`
CREATE TABLE IF NOT EXISTS "weather" (
  "id" serial PRIMARY KEY NOT NULL,
  "site_id" integer NOT NULL,
  "timestamp" timestamp DEFAULT now() NOT NULL,
  "temperature" real NOT NULL,
  "feels_like" real,
  "temp_min" real,
  "temp_max" real,
  "condition" varchar(100) NOT NULL,
  "condition_code" integer,
  "description" text,
  "humidity" integer,
  "pressure" integer,
  "cloud_cover" integer,
  "uv_index" real,
  "wind_speed" real,
  "wind_direction" integer,
  "sunrise" timestamp,
  "sunset" timestamp,
  "solar_radiation" real,
  "data_source" varchar(50) DEFAULT 'open-meteo',
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "weather" DROP CONSTRAINT IF EXISTS "weather_site_id_sites_id_fk";
ALTER TABLE "weather" ADD CONSTRAINT "weather_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;

DROP INDEX IF EXISTS "weather_site_id_idx";
CREATE INDEX "weather_site_id_idx" ON "weather" USING btree ("site_id");

DROP INDEX IF EXISTS "weather_timestamp_idx";
CREATE INDEX "weather_timestamp_idx" ON "weather" USING btree ("timestamp");

DROP INDEX IF EXISTS "weather_site_timestamp_idx";
CREATE INDEX "weather_site_timestamp_idx" ON "weather" USING btree ("site_id","timestamp");
`

const main = async () => {
  console.log('📦 Applying weather table migration...\n')

  try {
    await db.execute(weatherTableSQL)
    console.log('✅ Weather table created successfully!\n')
    console.log('You can now run: pnpm db:seed:harry-gwala')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
