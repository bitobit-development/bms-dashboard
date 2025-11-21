/**
 * Create pdf_export_jobs table manually
 * Bypasses interactive drizzle-kit push
 */

import { sql } from 'drizzle-orm'
import { db } from '../src/db'

async function main() {
  console.log('Creating pdf_export_jobs table...\n')

  try {
    // Create table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pdf_export_jobs" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "status" text DEFAULT 'pending' NOT NULL,
        "progress" integer DEFAULT 0 NOT NULL,
        "total_sites" integer NOT NULL,
        "processed_sites" integer DEFAULT 0 NOT NULL,
        "date_range_start" timestamp NOT NULL,
        "date_range_end" timestamp NOT NULL,
        "site_ids" jsonb,
        "download_url" text,
        "file_size" bigint,
        "error" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "completed_at" timestamp,
        "expires_at" timestamp
      )
    `)
    console.log('✅ Table created')

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "pdf_exports_user_created_idx"
      ON "pdf_export_jobs" ("user_id", "created_at" DESC)
    `)
    console.log('✅ Index: pdf_exports_user_created_idx')

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "pdf_exports_org_created_idx"
      ON "pdf_export_jobs" ("organization_id", "created_at" DESC)
    `)
    console.log('✅ Index: pdf_exports_org_created_idx')

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "pdf_exports_expires_at_idx"
      ON "pdf_export_jobs" ("expires_at")
    `)
    console.log('✅ Index: pdf_exports_expires_at_idx')

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "pdf_exports_status_idx"
      ON "pdf_export_jobs" ("status")
    `)
    console.log('✅ Index: pdf_exports_status_idx')

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "pdf_exports_user_status_idx"
      ON "pdf_export_jobs" ("user_id", "status")
    `)
    console.log('✅ Index: pdf_exports_user_status_idx')

    console.log('\n✅ pdf_export_jobs table created successfully!')
  } catch (error) {
    console.error('❌ Error creating table:', error)
    process.exit(1)
  }

  process.exit(0)
}

main()
