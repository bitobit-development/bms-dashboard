/**
 * PDF Export Jobs Schema
 *
 * Tracks PDF export job lifecycle for multi-site reports.
 * Jobs are processed asynchronously, with progress tracking and file storage.
 */

import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  bigint,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'
import { sql } from 'drizzle-orm'

/**
 * PDF Export Jobs
 *
 * Lifecycle:
 * 1. User requests export → job created with status='pending'
 * 2. Background worker picks up job → status='processing'
 * 3. Worker generates PDF → status='complete', downloadUrl set
 * 4. On error → status='failed', error message stored
 * 5. Cleanup job deletes expired files based on expiresAt
 */
export const pdfExportJobs = pgTable('pdf_export_jobs', {
  // Primary key - using text with UUID/nanoid for URL-safe IDs
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // User and organization context
  userId: text('user_id').notNull(), // Stack Auth user ID
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Job status tracking
  status: text('status', {
    enum: ['pending', 'processing', 'complete', 'failed']
  }).notNull().default('pending'),

  // Progress tracking (0-100)
  progress: integer('progress').notNull().default(0),

  // Site processing counts
  totalSites: integer('total_sites').notNull(),
  processedSites: integer('processed_sites').notNull().default(0),

  // Date range for export
  dateRangeStart: timestamp('date_range_start', { mode: 'date' }).notNull(),
  dateRangeEnd: timestamp('date_range_end', { mode: 'date' }).notNull(),

  // Site selection (null = all sites)
  siteIds: jsonb('site_ids').$type<number[] | null>(),

  // Export output
  downloadUrl: text('download_url'), // Vercel Blob URL or S3 URL
  fileSize: bigint('file_size', { mode: 'number' }), // bytes

  // Error tracking
  error: text('error'), // Error message if status='failed'

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'), // Download URL expiration (e.g., +7 days)
}, (table) => ({
  // Index for user's export history (most recent first)
  userCreatedIdx: index('pdf_exports_user_created_idx')
    .on(table.userId, table.createdAt.desc()),

  // Index for organization's export history
  orgCreatedIdx: index('pdf_exports_org_created_idx')
    .on(table.organizationId, table.createdAt.desc()),

  // Index for cleanup jobs (find expired exports)
  expiresAtIdx: index('pdf_exports_expires_at_idx')
    .on(table.expiresAt),

  // Index for job processing queue (find pending jobs)
  statusIdx: index('pdf_exports_status_idx')
    .on(table.status),

  // Composite index for user + status (find user's active jobs)
  userStatusIdx: index('pdf_exports_user_status_idx')
    .on(table.userId, table.status),
}))

// Relations
export const pdfExportJobsRelations = relations(pdfExportJobs, ({ one }) => ({
  organization: one(organizations, {
    fields: [pdfExportJobs.organizationId],
    references: [organizations.id],
  }),
}))

// Type exports
export type PdfExportJob = typeof pdfExportJobs.$inferSelect
export type NewPdfExportJob = typeof pdfExportJobs.$inferInsert

/**
 * Job Status Flow:
 *
 * pending → processing → complete
 *                     ↓
 *                   failed
 *
 * Job Lifecycle:
 * 1. User initiates export via UI
 * 2. Server Action creates job record (status='pending')
 * 3. Background worker (Vercel Cron or Queue) picks up job
 * 4. Worker updates status='processing', sets progress
 * 5. Worker generates PDF chunks for each site
 * 6. Worker uploads PDF to Vercel Blob
 * 7. Worker updates status='complete', sets downloadUrl, fileSize, completedAt, expiresAt
 * 8. User downloads PDF from downloadUrl
 * 9. Cleanup job deletes expired blobs (expiresAt < now)
 *
 * Progress Calculation:
 * progress = Math.round((processedSites / totalSites) * 100)
 *
 * Expiration Policy:
 * - Files expire 7 days after completion
 * - Cleanup job runs daily to delete expired blobs and update records
 *
 * Error Handling:
 * - Transient errors: Retry with exponential backoff
 * - Permanent errors: Set status='failed', store error message
 * - Users can retry failed jobs (creates new job record)
 */
