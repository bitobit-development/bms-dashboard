'use server'

/**
 * PDF Export Server Actions
 *
 * Handles asynchronous PDF generation for multi-site network usage reports.
 * Phase 2: Server Actions with job tracking and Vercel Blob storage.
 * Phase 3 will implement actual react-pdf generation.
 */

import { db } from '@/src/db'
import {
  pdfExportJobs,
  sites,
  organizationUsers,
} from '@/src/db/schema'
import { eq, and, desc, lt, inArray } from 'drizzle-orm'
import { stackServerApp } from '@/app/stack'
import { put, del } from '@vercel/blob'
import { randomUUID, randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  start: Date
  end: Date
}

export interface PdfExportParams {
  dateRange: DateRange
  siteIds?: number[] | null
}

export interface PdfExportJobStatus {
  id: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  progress: number
  processedSites: number
  totalSites: number
  downloadUrl?: string
  error?: string
  createdAt: Date
  completedAt?: Date
  expiresAt?: Date
}

export interface PdfExportHistoryItem {
  id: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  dateRangeStart: Date
  dateRangeEnd: Date
  totalSites: number
  downloadUrl?: string
  fileSize?: number
  createdAt: Date
  completedAt?: Date
  expiresAt?: Date
}

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get authenticated user and verify database sync
 */
async function getAuthenticatedUser() {
  const user = await stackServerApp.getUser()
  if (!user) {
    return { user: null, dbUser: null, error: 'Not authenticated' }
  }

  const dbUser = await db.query.organizationUsers.findFirst({
    where: eq(organizationUsers.stackUserId, user.id),
  })

  if (!dbUser) {
    return { user, dbUser: null, error: 'User not found in database' }
  }

  if (dbUser.status !== 'active') {
    return { user, dbUser, error: 'Account is not active' }
  }

  return { user, dbUser, error: null }
}

/**
 * Verify job ownership
 */
async function verifyJobOwnership(jobId: string, userId: string) {
  const job = await db.query.pdfExportJobs.findFirst({
    where: eq(pdfExportJobs.id, jobId),
  })

  if (!job) {
    return { job: null, error: 'Job not found' }
  }

  if (job.userId !== userId) {
    return { job: null, error: 'Not authorized to access this job' }
  }

  return { job, error: null }
}

/**
 * Get user's sites based on organization
 */
async function getUserSites(organizationId: number, siteIds?: number[] | null) {
  // If specific site IDs provided, query those directly (regardless of status)
  // This allows exporting sites that have network data even if not marked 'active'
  if (siteIds && siteIds.length > 0) {
    const specificSites = await db
      .select({
        id: sites.id,
        name: sites.name,
        city: sites.city,
        state: sites.state,
      })
      .from(sites)
      .where(
        and(
          eq(sites.organizationId, organizationId),
          inArray(sites.id, siteIds)
        )
      )
      .orderBy(sites.name)

    return specificSites
  }

  // Otherwise get all sites for the organization (include all statuses for complete data report)
  const allSites = await db
    .select({
      id: sites.id,
      name: sites.name,
      city: sites.city,
      state: sites.state,
    })
    .from(sites)
    .where(
      eq(sites.organizationId, organizationId
      )
    )
    .orderBy(sites.name)

  return allSites
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Start a new PDF export job
 *
 * Creates a job record and returns the job ID for polling.
 * The actual PDF generation will be triggered by a background worker.
 */
export async function startPdfExport(
  params: PdfExportParams
): Promise<ActionResult<{ jobId: string }>> {
  try {
    const { user, dbUser, error } = await getAuthenticatedUser()
    if (error || !user || !dbUser) {
      return { success: false, error: error || 'Authentication failed' }
    }

    // Validate date range
    if (params.dateRange.start >= params.dateRange.end) {
      return { success: false, error: 'Invalid date range' }
    }

    // Get sites for this export
    console.log('PDF Export - Org ID:', dbUser.organizationId, 'Site IDs:', params.siteIds)
    const userSites = await getUserSites(dbUser.organizationId, params.siteIds)
    console.log('PDF Export - User sites found:', userSites.length, userSites.map(s => s.id))

    if (userSites.length === 0) {
      return { success: false, error: 'No sites available for export' }
    }

    // Create job record
    const jobId = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    await db.insert(pdfExportJobs).values({
      id: jobId,
      userId: user.id,
      organizationId: dbUser.organizationId,
      status: 'pending',
      progress: 0,
      totalSites: userSites.length,
      processedSites: 0,
      dateRangeStart: params.dateRange.start,
      dateRangeEnd: params.dateRange.end,
      siteIds: params.siteIds,
      expiresAt,
    })

    // Trigger background processing (in Phase 3, this will call a queue or worker)
    // For Phase 2, we'll process immediately in a non-blocking way
    processJob(jobId).catch(console.error)

    revalidatePath('/dashboard/reports/network-usage')

    return {
      success: true,
      data: { jobId },
    }
  } catch (error) {
    console.error('Error starting PDF export:', error)
    return {
      success: false,
      error: 'Failed to start PDF export',
    }
  }
}

/**
 * Check PDF export job progress
 *
 * Returns current job status, progress, and download URL if complete.
 */
export async function checkPdfProgress(
  jobId: string
): Promise<ActionResult<PdfExportJobStatus>> {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return { success: false, error: authError || 'Authentication failed' }
    }

    const { job, error } = await verifyJobOwnership(jobId, user.id)
    if (error || !job) {
      return { success: false, error: error || 'Job not found' }
    }

    return {
      success: true,
      data: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        processedSites: job.processedSites,
        totalSites: job.totalSites,
        downloadUrl: job.downloadUrl || undefined,
        error: job.error || undefined,
        createdAt: job.createdAt,
        completedAt: job.completedAt || undefined,
        expiresAt: job.expiresAt || undefined,
      },
    }
  } catch (error) {
    console.error('Error checking PDF progress:', error)
    return {
      success: false,
      error: 'Failed to check job status',
    }
  }
}

/**
 * Cancel a running PDF export job
 *
 * Sets job status to failed with cancellation message.
 */
export async function cancelPdfExport(
  jobId: string
): Promise<ActionResult> {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return { success: false, error: authError || 'Authentication failed' }
    }

    const { job, error } = await verifyJobOwnership(jobId, user.id)
    if (error || !job) {
      return { success: false, error: error || 'Job not found' }
    }

    // Only allow cancelling pending or processing jobs
    if (job.status === 'complete' || job.status === 'failed') {
      return { success: false, error: 'Cannot cancel completed or failed job' }
    }

    await db
      .update(pdfExportJobs)
      .set({
        status: 'failed',
        error: 'Cancelled by user',
        completedAt: new Date(),
      })
      .where(eq(pdfExportJobs.id, jobId))

    revalidatePath('/dashboard/reports/network-usage')

    return { success: true }
  } catch (error) {
    console.error('Error cancelling PDF export:', error)
    return {
      success: false,
      error: 'Failed to cancel job',
    }
  }
}

/**
 * Get user's PDF export history
 *
 * Returns last 10 exports with status and download links.
 */
export async function getPdfExportHistory(): Promise<
  ActionResult<PdfExportHistoryItem[]>
> {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return { success: false, error: authError || 'Authentication failed' }
    }

    const history = await db.query.pdfExportJobs.findMany({
      where: eq(pdfExportJobs.userId, user.id),
      orderBy: [desc(pdfExportJobs.createdAt)],
      limit: 10,
    })

    const historyItems: PdfExportHistoryItem[] = history.map(job => ({
      id: job.id,
      status: job.status,
      dateRangeStart: job.dateRangeStart,
      dateRangeEnd: job.dateRangeEnd,
      totalSites: job.totalSites,
      downloadUrl: job.downloadUrl || undefined,
      fileSize: job.fileSize || undefined,
      createdAt: job.createdAt,
      completedAt: job.completedAt || undefined,
      expiresAt: job.expiresAt || undefined,
    }))

    return {
      success: true,
      data: historyItems,
    }
  } catch (error) {
    console.error('Error fetching export history:', error)
    return {
      success: false,
      error: 'Failed to fetch export history',
    }
  }
}

/**
 * Delete a PDF export record
 *
 * Removes the PDF from Vercel Blob storage and deletes the database record.
 */
export async function deletePdfExport(jobId: string): Promise<ActionResult> {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return { success: false, error: authError || 'Authentication failed' }
    }

    const { job, error } = await verifyJobOwnership(jobId, user.id)
    if (error || !job) {
      return { success: false, error: error || 'Job not found' }
    }

    // Delete from Vercel Blob if there's a download URL
    if (job.downloadUrl) {
      try {
        await del(job.downloadUrl)
      } catch (blobError) {
        console.error('Failed to delete blob:', blobError)
        // Continue with DB deletion even if blob deletion fails
      }
    }

    // Delete from database
    await db.delete(pdfExportJobs).where(eq(pdfExportJobs.id, jobId))

    revalidatePath('/dashboard/data-usage')

    return { success: true }
  } catch (error) {
    console.error('Error deleting PDF export:', error)
    return {
      success: false,
      error: 'Failed to delete export',
    }
  }
}

/**
 * Clean up expired PDF exports
 *
 * Cron job that deletes expired exports from Vercel Blob and database.
 * Should be called from /api/cron/cleanup-exports route.
 */
export async function cleanupExpiredExports(): Promise<ActionResult<{
  deletedCount: number
  errors: string[]
}>> {
  try {
    // Find expired jobs with download URLs
    const expiredJobs = await db.query.pdfExportJobs.findMany({
      where: and(
        eq(pdfExportJobs.status, 'complete'),
        lt(pdfExportJobs.expiresAt, new Date())
      ),
    })

    const errors: string[] = []
    let deletedCount = 0

    // Delete blobs and update records
    for (const job of expiredJobs) {
      try {
        if (job.downloadUrl) {
          // Delete from Vercel Blob
          await del(job.downloadUrl)
        }

        // Delete job record
        await db.delete(pdfExportJobs).where(eq(pdfExportJobs.id, job.id))

        deletedCount++
      } catch (error) {
        const errorMsg = `Failed to delete job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    console.log(`Cleanup completed: ${deletedCount} jobs deleted, ${errors.length} errors`)

    return {
      success: true,
      data: {
        deletedCount,
        errors,
      },
    }
  } catch (error) {
    console.error('Error during cleanup:', error)
    return {
      success: false,
      error: 'Failed to run cleanup job',
    }
  }
}

// ============================================================================
// Internal Processing Functions
// ============================================================================

/**
 * Process a PDF export job
 *
 * This is called asynchronously from startPdfExport.
 * In Phase 3, this will be replaced by a proper queue worker.
 */
async function processJob(jobId: string): Promise<void> {
  const startTime = Date.now()
  const PDF_GENERATION_TIMEOUT = 50000 // 50s, leaving 10s buffer for Vercel 60s limit

  try {
    console.log(`[PDF] Job ${jobId} started at ${new Date().toISOString()}`)

    // Check for required environment variable
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not configured. Please add it to your environment variables.')
    }

    // Update status to processing
    await db
      .update(pdfExportJobs)
      .set({
        status: 'processing',
        progress: 0,
      })
      .where(eq(pdfExportJobs.id, jobId))

    // Get job details
    const job = await db.query.pdfExportJobs.findFirst({
      where: eq(pdfExportJobs.id, jobId),
    })

    if (!job) {
      throw new Error('Job not found')
    }

    console.log(`[PDF] Job config: ${job.totalSites} sites, date range: ${job.dateRangeStart.toISOString()} to ${job.dateRangeEnd.toISOString()}`)

    // Get sites
    const userSites = await getUserSites(job.organizationId, job.siteIds)
    console.log(`[PDF] Found ${userSites.length} sites for export`)

    // Wrap PDF generation in timeout guard
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`PDF generation timeout after ${PDF_GENERATION_TIMEOUT/1000}s. The file may be too large (${job.totalSites} sites). Try reducing the date range or site count.`))
      }, PDF_GENERATION_TIMEOUT)
    })

    // Generate PDF with timeout protection
    const pdfBuffer = await Promise.race([
      generatePdf(
        jobId,
        userSites,
        {
          start: job.dateRangeStart,
          end: job.dateRangeEnd,
        }
      ),
      timeoutPromise
    ])

    console.log(`[PDF] PDF generated in ${Date.now() - startTime}ms, size: ${pdfBuffer.length} bytes (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB)`)

    // Check blob size before upload
    const MAX_BLOB_SIZE = 50 * 1024 * 1024 // 50MB safety limit
    if (pdfBuffer.length > MAX_BLOB_SIZE) {
      throw new Error(`PDF too large (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB). Maximum: 50MB. Reduce date range or site count.`)
    }

    // Generate filename: {startDate}-{endDate}_{siteCount}sites_{randomId}.pdf
    const startStr = format(job.dateRangeStart, 'yyyy-MM-dd')
    const endStr = format(job.dateRangeEnd, 'yyyy-MM-dd')
    const randomSuffix = randomBytes(4).toString('hex')
    const filename = `${startStr}_${endStr}_${userSites.length}sites_${randomSuffix}.pdf`

    console.log(`[PDF] Starting Blob upload: ${filename}`)

    // Upload to Vercel Blob
    const blob = await put(`exports/${filename}`, pdfBuffer, {
      access: 'public',
      addRandomSuffix: false,
    })

    console.log(`[PDF] Upload complete in ${Date.now() - startTime}ms, URL: ${blob.url}`)

    // Update job with completion details
    await db
      .update(pdfExportJobs)
      .set({
        status: 'complete',
        progress: 100,
        processedSites: job.totalSites,
        downloadUrl: blob.url,
        fileSize: pdfBuffer.length,
        completedAt: new Date(),
      })
      .where(eq(pdfExportJobs.id, jobId))

    console.log(`[PDF] Job ${jobId} completed successfully in ${Date.now() - startTime}ms`)

    // Note: revalidatePath removed - cannot be called during background processing
  } catch (error) {
    console.error(`[PDF] Job ${jobId} failed after ${Date.now() - startTime}ms:`, error)
    console.error(`[PDF] Stack trace:`, error instanceof Error ? error.stack : 'No stack trace')

    // Update job with error
    await db
      .update(pdfExportJobs)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      })
      .where(eq(pdfExportJobs.id, jobId))

    // Note: revalidatePath removed - cannot be called during background processing
  }
}

/**
 * Generate PDF document
 *
 * Phase 3: Implements actual react-pdf generation with site data.
 * Fetches network metrics for each site and generates a professional PDF report.
 */
async function generatePdf(
  jobId: string,
  userSites: Array<{ id: number; name: string; city: string | null; state: string | null }>,
  dateRange: DateRange
): Promise<Buffer> {
  const { pdf } = await import('@react-pdf/renderer')
  const { getSiteMonthlyMetrics } = await import('@/app/actions/network-usage')
  const { NetworkUsageDocument } = await import('@/lib/pdf/NetworkUsageDocument')
  const {
    transformSiteData,
    calculateAggregateData,
    generateInsights,
  } = await import('@/lib/pdf/utils/dataTransform')

  // Batch size for processing sites (increased from 10 to 20 for better performance)
  const BATCH_SIZE = 20
  const pdfSitesData = []
  let processedCount = 0

  console.log(`[PDF] Starting data fetch for ${userSites.length} sites in batches of ${BATCH_SIZE}`)
  console.time('[PDF] data-fetch-total')

  // Process sites in batches to provide progress updates
  for (let i = 0; i < userSites.length; i += BATCH_SIZE) {
    const batch = userSites.slice(i, i + BATCH_SIZE)

    // Fetch metrics for all sites in this batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(async (site) => {
        try {
          const metricsResult = await getSiteMonthlyMetrics(site.id, dateRange)

          if (metricsResult.success) {
            return transformSiteData(
              metricsResult.data,
              site.city,
              site.state
            )
          } else {
            console.error(`Failed to fetch metrics for site ${site.id}:`, metricsResult.error)
            return null
          }
        } catch (error) {
          console.error(`Error fetching metrics for site ${site.id}:`, error)
          return null
        }
      })
    )

    // Collect successful results
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        pdfSitesData.push(result.value)
      }
    }

    processedCount += batch.length

    // Update progress (0-90% for data fetching, 90-100% for PDF generation)
    const progress = Math.round((processedCount / userSites.length) * 90)
    await db
      .update(pdfExportJobs)
      .set({
        progress,
        processedSites: processedCount,
      })
      .where(eq(pdfExportJobs.id, jobId))
  }

  console.timeEnd('[PDF] data-fetch-total')

  // If no sites have data, create a minimal report
  if (pdfSitesData.length === 0) {
    console.warn('[PDF] No site data available for PDF generation')
    // We'll still generate a PDF with empty data
  }

  // Calculate aggregate data and insights
  console.time('[PDF] data-transform')
  const aggregateData = calculateAggregateData(pdfSitesData, dateRange)
  const insights = generateInsights(aggregateData)
  console.timeEnd('[PDF] data-transform')

  // Update progress to 90% (data fetching complete)
  console.log(`[PDF] Data fetching complete, starting PDF generation`)
  await db
    .update(pdfExportJobs)
    .set({ progress: 90 })
    .where(eq(pdfExportJobs.id, jobId))

  // Generate PDF using react-pdf
  const React = await import('react')

  // Create the PDF document element
  console.time('[PDF] doc-create')
  console.log(`[PDF] Creating PDF document with ${pdfSitesData.length} sites`)
  const pdfDoc = React.createElement(NetworkUsageDocument, {
    aggregateData,
    sites: pdfSitesData,
    insights,
    generatedAt: new Date(),
  })
  console.timeEnd('[PDF] doc-create')

  // Update progress to 92% (document created)
  await db
    .update(pdfExportJobs)
    .set({ progress: 92 })
    .where(eq(pdfExportJobs.id, jobId))

  // Render to buffer using react-pdf
  console.time('[PDF] pdf-render')
  console.log(`[PDF] Rendering PDF with ${pdfSitesData.length} pages...`)
  // @ts-expect-error - react-pdf types don't perfectly match our component structure
  const pdfInstance = pdf(pdfDoc)
  const pdfBlob = await pdfInstance.toBlob()
  console.timeEnd('[PDF] pdf-render')

  // Update progress to 95% (rendering complete)
  await db
    .update(pdfExportJobs)
    .set({ progress: 95 })
    .where(eq(pdfExportJobs.id, jobId))

  // Convert Blob to Buffer
  console.time('[PDF] blob-convert')
  console.log(`[PDF] Converting to buffer...`)
  const arrayBuffer = await pdfBlob.arrayBuffer()
  const pdfBuffer = Buffer.from(arrayBuffer)
  console.timeEnd('[PDF] blob-convert')

  console.log(`[PDF] PDF generation complete, buffer size: ${pdfBuffer.length} bytes (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB)`)

  return pdfBuffer
}
