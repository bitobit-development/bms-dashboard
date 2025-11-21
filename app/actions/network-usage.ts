'use server'

import { db } from '@/src/db'
import {
  sites,
  networkTelemetry,
  networkDailyAggregates,
  networkMonthlyAggregates,
  organizationUsers,
} from '@/src/db/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { stackServerApp } from '@/app/stack'
import { format } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  start: Date
  end: Date
}

export interface SiteNetworkSummary {
  siteId: number
  siteName: string
  avgUploadSpeed: number
  avgDownloadSpeed: number
  allocatedBandwidth: number
  utilizationPct: number
  totalDataConsumed: number
  consumptionPct: number
  avgLatency: number
  status: 'good' | 'warning' | 'critical'
}

export interface SiteNetworkDetail {
  site: {
    id: number
    name: string
    allocatedBandwidth: number
  }
  speedData: Array<{
    date: string
    upload: number
    download: number
    allocated: number
  }>
  latencyData: Array<{
    date: string
    avg: number
    min: number
    max: number
  }>
  consumptionData: Array<{
    date: string
    consumed: number
    allowance: number
  }>
  summary: {
    avgUploadSpeed: number
    avgDownloadSpeed: number
    peakUploadSpeed: number
    peakDownloadSpeed: number
    avgLatency: number
    minLatency: number
    maxLatency: number
    totalDataConsumed: number
    utilizationPct: number
    consumptionPct: number
  }
}

export interface MonthlyComparisonData {
  month: string
  sites: Array<{
    siteId: number
    siteName: string
    avgUploadSpeed: number
    avgDownloadSpeed: number
    utilizationPct: number
    totalDataConsumed: number
    consumptionPct: number
    avgLatency: number
  }>
  totals: {
    avgUploadSpeed: number
    avgDownloadSpeed: number
    avgUtilizationPct: number
    totalDataConsumed: number
    avgConsumptionPct: number
    avgLatency: number
  }
}

export interface ExportOptions {
  format: 'csv' | 'json'
  dateRange: DateRange
  siteIds?: number[]
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get allocated bandwidth for a site based on its name
 * Pholela School has 100 Mbps, all others have 15 Mbps
 */
function getBandwidthForSite(siteName: string): number {
  return siteName === 'Pholela School' ? 100 : 15
}

/**
 * Format date to YYYY-MM for month comparisons
 */
function formatMonth(date: Date): string {
  return format(date, 'yyyy-MM')
}

/**
 * Calculate status based on utilization percentage
 */
function calculateStatus(utilization: number): 'good' | 'warning' | 'critical' {
  if (utilization >= 90) return 'critical'
  if (utilization >= 70) return 'warning'
  return 'good'
}

/**
 * Convert bytes to gigabytes
 */
function bytesToGB(bytes: number): number {
  return bytes / (1024 * 1024 * 1024)
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get network overview for all sites within a date range
 * Returns summary data with utilization and consumption metrics
 */
export async function getNetworkOverview(dateRange: DateRange): Promise<
  { success: true; data: SiteNetworkSummary[] } | { success: false; error: string }
> {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's organization
    const dbUser = await db.query.organizationUsers.findFirst({
      where: eq(organizationUsers.stackUserId, user.id),
    })

    if (!dbUser) {
      return { success: false, error: 'User not found in database' }
    }

    const startMonth = formatMonth(dateRange.start)
    const endMonth = formatMonth(dateRange.end)

    // Query monthly aggregates joined with sites, filtered by organization
    const monthlyData = await db
      .select({
        siteId: networkMonthlyAggregates.siteId,
        siteName: sites.name,
        avgUploadSpeed: networkMonthlyAggregates.avgUploadSpeed,
        avgDownloadSpeed: networkMonthlyAggregates.avgDownloadSpeed,
        allocatedBandwidth: networkMonthlyAggregates.allocatedBandwidth,
        utilizationPct: networkMonthlyAggregates.utilizationPct,
        totalDataConsumed: networkMonthlyAggregates.totalDataConsumed,
        consumptionPct: networkMonthlyAggregates.consumptionPct,
        avgLatency: networkMonthlyAggregates.avgLatency,
        month: networkMonthlyAggregates.month,
      })
      .from(networkMonthlyAggregates)
      .innerJoin(sites, eq(networkMonthlyAggregates.siteId, sites.id))
      .where(
        and(
          eq(sites.organizationId, dbUser.organizationId),
          gte(networkMonthlyAggregates.month, startMonth),
          lte(networkMonthlyAggregates.month, endMonth)
        )
      )
      .orderBy(sites.name)

    // Aggregate data by site (in case date range spans multiple months)
    const siteAggregates = new Map<number, {
      siteName: string
      uploadSpeeds: number[]
      downloadSpeeds: number[]
      allocatedBandwidth: number
      utilizations: number[]
      dataConsumed: number
      consumptions: number[]
      latencies: number[]
    }>()

    for (const row of monthlyData) {
      if (!siteAggregates.has(row.siteId)) {
        siteAggregates.set(row.siteId, {
          siteName: row.siteName,
          uploadSpeeds: [],
          downloadSpeeds: [],
          allocatedBandwidth: row.allocatedBandwidth,
          utilizations: [],
          dataConsumed: 0,
          consumptions: [],
          latencies: [],
        })
      }

      const aggregate = siteAggregates.get(row.siteId)!
      aggregate.uploadSpeeds.push(row.avgUploadSpeed)
      aggregate.downloadSpeeds.push(row.avgDownloadSpeed)
      aggregate.utilizations.push(row.utilizationPct)
      aggregate.dataConsumed += row.totalDataConsumed
      aggregate.consumptions.push(row.consumptionPct)
      aggregate.latencies.push(row.avgLatency)
    }

    // Calculate final summaries
    const summaries: SiteNetworkSummary[] = []

    for (const [siteId, data] of siteAggregates) {
      const avgUploadSpeed = data.uploadSpeeds.reduce((a, b) => a + b, 0) / data.uploadSpeeds.length
      const avgDownloadSpeed = data.downloadSpeeds.reduce((a, b) => a + b, 0) / data.downloadSpeeds.length
      const avgUtilization = data.utilizations.reduce((a, b) => a + b, 0) / data.utilizations.length
      const avgConsumption = data.consumptions.reduce((a, b) => a + b, 0) / data.consumptions.length
      const avgLatency = data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length

      summaries.push({
        siteId,
        siteName: data.siteName,
        avgUploadSpeed: Math.round(avgUploadSpeed * 100) / 100,
        avgDownloadSpeed: Math.round(avgDownloadSpeed * 100) / 100,
        allocatedBandwidth: data.allocatedBandwidth,
        utilizationPct: Math.round(avgUtilization * 100) / 100,
        totalDataConsumed: Math.round(bytesToGB(data.dataConsumed) * 1000) / 1000,
        consumptionPct: Math.round(avgConsumption * 100) / 100,
        avgLatency: Math.round(avgLatency * 100) / 100,
        status: calculateStatus(avgUtilization),
      })
    }

    // Sort by site name
    summaries.sort((a, b) => a.siteName.localeCompare(b.siteName))

    return { success: true, data: summaries }
  } catch (error) {
    console.error('Error fetching network overview:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch network overview',
    }
  }
}

/**
 * Get detailed network metrics for a single site
 * Returns chart data and summary statistics
 */
export async function getSiteNetworkMetrics(
  siteId: number,
  dateRange: DateRange
): Promise<
  { success: true; data: SiteNetworkDetail } | { success: false; error: string }
> {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get site info
    const [siteInfo] = await db
      .select({
        id: sites.id,
        name: sites.name,
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (!siteInfo) {
      return { success: false, error: 'Site not found' }
    }

    const allocatedBandwidth = getBandwidthForSite(siteInfo.name)

    // Format dates for query
    const startDate = format(dateRange.start, 'yyyy-MM-dd')
    const endDate = format(dateRange.end, 'yyyy-MM-dd')

    // Get daily aggregates for charts
    const dailyData = await db
      .select({
        date: networkDailyAggregates.date,
        avgUploadSpeed: networkDailyAggregates.avgUploadSpeed,
        avgDownloadSpeed: networkDailyAggregates.avgDownloadSpeed,
        maxUploadSpeed: networkDailyAggregates.maxUploadSpeed,
        maxDownloadSpeed: networkDailyAggregates.maxDownloadSpeed,
        allocatedBandwidth: networkDailyAggregates.allocatedBandwidth,
        avgLatency: networkDailyAggregates.avgLatency,
        minLatency: networkDailyAggregates.minLatency,
        maxLatency: networkDailyAggregates.maxLatency,
        totalDataConsumed: networkDailyAggregates.totalDataConsumed,
        dataAllowance: networkDailyAggregates.dataAllowance,
      })
      .from(networkDailyAggregates)
      .where(
        and(
          eq(networkDailyAggregates.siteId, siteId),
          gte(networkDailyAggregates.date, startDate),
          lte(networkDailyAggregates.date, endDate)
        )
      )
      .orderBy(networkDailyAggregates.date)

    // Transform data for charts
    const speedData = dailyData.map((row) => ({
      date: row.date,
      upload: Math.round(row.avgUploadSpeed * 100) / 100,
      download: Math.round(row.avgDownloadSpeed * 100) / 100,
      allocated: row.allocatedBandwidth,
    }))

    const latencyData = dailyData.map((row) => ({
      date: row.date,
      avg: Math.round(row.avgLatency * 100) / 100,
      min: Math.round(row.minLatency * 100) / 100,
      max: Math.round(row.maxLatency * 100) / 100,
    }))

    const consumptionData = dailyData.map((row) => ({
      date: row.date,
      consumed: Math.round(bytesToGB(row.totalDataConsumed) * 1000) / 1000,
      allowance: Math.round(bytesToGB(row.dataAllowance) * 1000) / 1000,
    }))

    // Calculate summary statistics
    if (dailyData.length === 0) {
      return {
        success: true,
        data: {
          site: {
            id: siteInfo.id,
            name: siteInfo.name,
            allocatedBandwidth,
          },
          speedData: [],
          latencyData: [],
          consumptionData: [],
          summary: {
            avgUploadSpeed: 0,
            avgDownloadSpeed: 0,
            peakUploadSpeed: 0,
            peakDownloadSpeed: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
            totalDataConsumed: 0,
            utilizationPct: 0,
            consumptionPct: 0,
          },
        },
      }
    }

    const avgUploadSpeed =
      dailyData.reduce((sum, row) => sum + row.avgUploadSpeed, 0) / dailyData.length
    const avgDownloadSpeed =
      dailyData.reduce((sum, row) => sum + row.avgDownloadSpeed, 0) / dailyData.length
    const peakUploadSpeed = Math.max(...dailyData.map((row) => row.maxUploadSpeed))
    const peakDownloadSpeed = Math.max(...dailyData.map((row) => row.maxDownloadSpeed))
    const avgLatency =
      dailyData.reduce((sum, row) => sum + row.avgLatency, 0) / dailyData.length
    const minLatency = Math.min(...dailyData.map((row) => row.minLatency))
    const maxLatency = Math.max(...dailyData.map((row) => row.maxLatency))
    const totalDataConsumed = dailyData.reduce(
      (sum, row) => sum + row.totalDataConsumed,
      0
    )
    const totalAllowance = dailyData.reduce((sum, row) => sum + row.dataAllowance, 0)

    // Calculate utilization (max of upload/download as % of allocated)
    const maxAvgSpeed = Math.max(avgUploadSpeed, avgDownloadSpeed)
    const utilizationPct = (maxAvgSpeed / allocatedBandwidth) * 100

    // Calculate consumption percentage
    const consumptionPct = totalAllowance > 0 ? (totalDataConsumed / totalAllowance) * 100 : 0

    return {
      success: true,
      data: {
        site: {
          id: siteInfo.id,
          name: siteInfo.name,
          allocatedBandwidth,
        },
        speedData,
        latencyData,
        consumptionData,
        summary: {
          avgUploadSpeed: Math.round(avgUploadSpeed * 100) / 100,
          avgDownloadSpeed: Math.round(avgDownloadSpeed * 100) / 100,
          peakUploadSpeed: Math.round(peakUploadSpeed * 100) / 100,
          peakDownloadSpeed: Math.round(peakDownloadSpeed * 100) / 100,
          avgLatency: Math.round(avgLatency * 100) / 100,
          minLatency: Math.round(minLatency * 100) / 100,
          maxLatency: Math.round(maxLatency * 100) / 100,
          totalDataConsumed: Math.round(bytesToGB(totalDataConsumed) * 1000) / 1000,
          utilizationPct: Math.round(utilizationPct * 100) / 100,
          consumptionPct: Math.round(consumptionPct * 100) / 100,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching site network metrics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch site network metrics',
    }
  }
}

/**
 * Get monthly aggregates for comparison view
 * Allows comparing metrics across different months
 */
export async function getMonthlyComparison(
  months: string[]
): Promise<
  { success: true; data: MonthlyComparisonData[] } | { success: false; error: string }
> {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (months.length === 0) {
      return { success: false, error: 'At least one month must be specified' }
    }

    const comparisonData: MonthlyComparisonData[] = []

    for (const month of months) {
      // Get all site data for this month
      const monthlyData = await db
        .select({
          siteId: networkMonthlyAggregates.siteId,
          siteName: sites.name,
          avgUploadSpeed: networkMonthlyAggregates.avgUploadSpeed,
          avgDownloadSpeed: networkMonthlyAggregates.avgDownloadSpeed,
          utilizationPct: networkMonthlyAggregates.utilizationPct,
          totalDataConsumed: networkMonthlyAggregates.totalDataConsumed,
          consumptionPct: networkMonthlyAggregates.consumptionPct,
          avgLatency: networkMonthlyAggregates.avgLatency,
        })
        .from(networkMonthlyAggregates)
        .innerJoin(sites, eq(networkMonthlyAggregates.siteId, sites.id))
        .where(eq(networkMonthlyAggregates.month, month))
        .orderBy(sites.name)

      if (monthlyData.length === 0) {
        continue
      }

      // Transform site data
      const sitesData = monthlyData.map((row) => ({
        siteId: row.siteId,
        siteName: row.siteName,
        avgUploadSpeed: Math.round(row.avgUploadSpeed * 100) / 100,
        avgDownloadSpeed: Math.round(row.avgDownloadSpeed * 100) / 100,
        utilizationPct: Math.round(row.utilizationPct * 100) / 100,
        totalDataConsumed: row.totalDataConsumed,
        consumptionPct: Math.round(row.consumptionPct * 100) / 100,
        avgLatency: Math.round(row.avgLatency * 100) / 100,
      }))

      // Calculate totals/averages
      const count = sitesData.length
      const totals = {
        avgUploadSpeed:
          Math.round(
            (sitesData.reduce((sum, s) => sum + s.avgUploadSpeed, 0) / count) * 100
          ) / 100,
        avgDownloadSpeed:
          Math.round(
            (sitesData.reduce((sum, s) => sum + s.avgDownloadSpeed, 0) / count) * 100
          ) / 100,
        avgUtilizationPct:
          Math.round(
            (sitesData.reduce((sum, s) => sum + s.utilizationPct, 0) / count) * 100
          ) / 100,
        totalDataConsumed: sitesData.reduce((sum, s) => sum + s.totalDataConsumed, 0),
        avgConsumptionPct:
          Math.round(
            (sitesData.reduce((sum, s) => sum + s.consumptionPct, 0) / count) * 100
          ) / 100,
        avgLatency:
          Math.round(
            (sitesData.reduce((sum, s) => sum + s.avgLatency, 0) / count) * 100
          ) / 100,
      }

      comparisonData.push({
        month,
        sites: sitesData,
        totals,
      })
    }

    return { success: true, data: comparisonData }
  } catch (error) {
    console.error('Error fetching monthly comparison:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch monthly comparison',
    }
  }
}

/**
 * Export network data in CSV or JSON format
 */
export async function exportNetworkData(options: ExportOptions): Promise<
  { success: true; data: string; filename: string; mimeType: string } | { success: false; error: string }
> {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { format: exportFormat, dateRange, siteIds } = options

    // Format dates for query
    const startDate = format(dateRange.start, 'yyyy-MM-dd')
    const endDate = format(dateRange.end, 'yyyy-MM-dd')

    // Build query
    const query = db
      .select({
        siteId: networkDailyAggregates.siteId,
        siteName: sites.name,
        date: networkDailyAggregates.date,
        avgUploadSpeed: networkDailyAggregates.avgUploadSpeed,
        avgDownloadSpeed: networkDailyAggregates.avgDownloadSpeed,
        maxUploadSpeed: networkDailyAggregates.maxUploadSpeed,
        maxDownloadSpeed: networkDailyAggregates.maxDownloadSpeed,
        allocatedBandwidth: networkDailyAggregates.allocatedBandwidth,
        avgLatency: networkDailyAggregates.avgLatency,
        minLatency: networkDailyAggregates.minLatency,
        maxLatency: networkDailyAggregates.maxLatency,
        totalDataConsumed: networkDailyAggregates.totalDataConsumed,
        dataAllowance: networkDailyAggregates.dataAllowance,
        activeHours: networkDailyAggregates.activeHours,
      })
      .from(networkDailyAggregates)
      .innerJoin(sites, eq(networkDailyAggregates.siteId, sites.id))
      .where(
        and(
          gte(networkDailyAggregates.date, startDate),
          lte(networkDailyAggregates.date, endDate)
        )
      )
      .orderBy(sites.name, networkDailyAggregates.date)

    const dailyData = await query

    // Filter by siteIds if provided
    const filteredData = siteIds && siteIds.length > 0
      ? dailyData.filter((row) => siteIds.includes(row.siteId))
      : dailyData

    if (filteredData.length === 0) {
      return { success: false, error: 'No data found for the specified criteria' }
    }

    // Generate filename
    const dateStr = format(new Date(), 'yyyy-MM-dd')
    const filename = `network-usage-${dateStr}.${exportFormat}`

    if (exportFormat === 'json') {
      // Export as JSON
      const jsonData = filteredData.map((row) => ({
        siteId: row.siteId,
        siteName: row.siteName,
        date: row.date,
        avgUploadSpeedMbps: Math.round(row.avgUploadSpeed * 100) / 100,
        avgDownloadSpeedMbps: Math.round(row.avgDownloadSpeed * 100) / 100,
        maxUploadSpeedMbps: Math.round(row.maxUploadSpeed * 100) / 100,
        maxDownloadSpeedMbps: Math.round(row.maxDownloadSpeed * 100) / 100,
        allocatedBandwidthMbps: row.allocatedBandwidth,
        avgLatencyMs: Math.round(row.avgLatency * 100) / 100,
        minLatencyMs: Math.round(row.minLatency * 100) / 100,
        maxLatencyMs: Math.round(row.maxLatency * 100) / 100,
        totalDataConsumedGB: Math.round(bytesToGB(row.totalDataConsumed) * 1000) / 1000,
        dataAllowanceGB: Math.round(bytesToGB(row.dataAllowance) * 1000) / 1000,
        activeHours: row.activeHours,
      }))

      return {
        success: true,
        data: JSON.stringify(jsonData, null, 2),
        filename,
        mimeType: 'application/json',
      }
    } else {
      // Export as CSV
      const headers = [
        'Site ID',
        'Site Name',
        'Date',
        'Avg Upload Speed (Mbps)',
        'Avg Download Speed (Mbps)',
        'Max Upload Speed (Mbps)',
        'Max Download Speed (Mbps)',
        'Allocated Bandwidth (Mbps)',
        'Avg Latency (ms)',
        'Min Latency (ms)',
        'Max Latency (ms)',
        'Total Data Consumed (GB)',
        'Data Allowance (GB)',
        'Active Hours',
      ]

      const rows = filteredData.map((row) => [
        row.siteId,
        `"${row.siteName}"`,
        row.date,
        Math.round(row.avgUploadSpeed * 100) / 100,
        Math.round(row.avgDownloadSpeed * 100) / 100,
        Math.round(row.maxUploadSpeed * 100) / 100,
        Math.round(row.maxDownloadSpeed * 100) / 100,
        row.allocatedBandwidth,
        Math.round(row.avgLatency * 100) / 100,
        Math.round(row.minLatency * 100) / 100,
        Math.round(row.maxLatency * 100) / 100,
        Math.round(bytesToGB(row.totalDataConsumed) * 1000) / 1000,
        Math.round(bytesToGB(row.dataAllowance) * 1000) / 1000,
        row.activeHours,
      ])

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

      return {
        success: true,
        data: csvContent,
        filename,
        mimeType: 'text/csv',
      }
    }
  } catch (error) {
    console.error('Error exporting network data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export network data',
    }
  }
}

/**
 * Get monthly network metrics for a single site (for PDF export)
 * Returns monthly aggregated data instead of daily
 */
export async function getSiteMonthlyMetrics(
  siteId: number,
  dateRange: DateRange
): Promise<
  { success: true; data: SiteNetworkDetail } | { success: false; error: string }
> {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get site info
    const [siteInfo] = await db
      .select({
        id: sites.id,
        name: sites.name,
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (!siteInfo) {
      return { success: false, error: 'Site not found' }
    }

    const allocatedBandwidth = getBandwidthForSite(siteInfo.name)

    // Format dates for query (YYYY-MM format for monthly)
    const startMonth = formatMonth(dateRange.start)
    const endMonth = formatMonth(dateRange.end)

    // Get monthly aggregates
    const monthlyData = await db
      .select({
        month: networkMonthlyAggregates.month,
        avgUploadSpeed: networkMonthlyAggregates.avgUploadSpeed,
        avgDownloadSpeed: networkMonthlyAggregates.avgDownloadSpeed,
        maxUploadSpeed: networkMonthlyAggregates.peakUploadSpeed,
        maxDownloadSpeed: networkMonthlyAggregates.peakDownloadSpeed,
        allocatedBandwidth: networkMonthlyAggregates.allocatedBandwidth,
        avgLatency: networkMonthlyAggregates.avgLatency,
        p95Latency: networkMonthlyAggregates.p95Latency,
        totalDataConsumed: networkMonthlyAggregates.totalDataConsumed,
        dataAllowance: networkMonthlyAggregates.monthlyAllowance,
      })
      .from(networkMonthlyAggregates)
      .where(
        and(
          eq(networkMonthlyAggregates.siteId, siteId),
          gte(networkMonthlyAggregates.month, startMonth),
          lte(networkMonthlyAggregates.month, endMonth)
        )
      )
      .orderBy(networkMonthlyAggregates.month)

    // Transform data for charts (using month as date)
    const speedData = monthlyData.map((row) => ({
      date: row.month,
      upload: Math.round(row.avgUploadSpeed * 100) / 100,
      download: Math.round(row.avgDownloadSpeed * 100) / 100,
      allocated: row.allocatedBandwidth,
    }))

    const latencyData = monthlyData.map((row) => ({
      date: row.month,
      avg: Math.round(row.avgLatency * 100) / 100,
      min: Math.round(row.avgLatency * 0.7 * 100) / 100, // Estimate min as 70% of avg
      max: Math.round((row.p95Latency || row.avgLatency * 1.5) * 100) / 100, // Use p95 or estimate
    }))

    const consumptionData = monthlyData.map((row) => ({
      date: row.month,
      consumed: Math.round(bytesToGB(row.totalDataConsumed) * 1000) / 1000,
      allowance: Math.round(bytesToGB(row.dataAllowance) * 1000) / 1000,
    }))

    // Calculate summary statistics
    if (monthlyData.length === 0) {
      return {
        success: true,
        data: {
          site: {
            id: siteInfo.id,
            name: siteInfo.name,
            allocatedBandwidth,
          },
          speedData: [],
          latencyData: [],
          consumptionData: [],
          summary: {
            avgUploadSpeed: 0,
            avgDownloadSpeed: 0,
            peakUploadSpeed: 0,
            peakDownloadSpeed: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
            totalDataConsumed: 0,
            utilizationPct: 0,
            consumptionPct: 0,
          },
        },
      }
    }

    const avgUploadSpeed =
      monthlyData.reduce((sum, row) => sum + row.avgUploadSpeed, 0) / monthlyData.length
    const avgDownloadSpeed =
      monthlyData.reduce((sum, row) => sum + row.avgDownloadSpeed, 0) / monthlyData.length
    const peakUploadSpeed = Math.max(...monthlyData.map((row) => row.maxUploadSpeed))
    const peakDownloadSpeed = Math.max(...monthlyData.map((row) => row.maxDownloadSpeed))
    const avgLatency =
      monthlyData.reduce((sum, row) => sum + row.avgLatency, 0) / monthlyData.length
    const minLatency = avgLatency * 0.7 // Estimate min as 70% of avg
    const maxLatency = Math.max(...monthlyData.map((row) => row.p95Latency || row.avgLatency * 1.5))
    const totalDataConsumed = monthlyData.reduce(
      (sum, row) => sum + row.totalDataConsumed,
      0
    )
    const totalAllowance = monthlyData.reduce((sum, row) => sum + row.dataAllowance, 0)

    // Calculate utilization (max of upload/download as % of allocated)
    const maxAvgSpeed = Math.max(avgUploadSpeed, avgDownloadSpeed)
    const utilizationPct = (maxAvgSpeed / allocatedBandwidth) * 100

    // Calculate consumption percentage
    const consumptionPct = totalAllowance > 0 ? (totalDataConsumed / totalAllowance) * 100 : 0

    return {
      success: true,
      data: {
        site: {
          id: siteInfo.id,
          name: siteInfo.name,
          allocatedBandwidth,
        },
        speedData,
        latencyData,
        consumptionData,
        summary: {
          avgUploadSpeed: Math.round(avgUploadSpeed * 100) / 100,
          avgDownloadSpeed: Math.round(avgDownloadSpeed * 100) / 100,
          peakUploadSpeed: Math.round(peakUploadSpeed * 100) / 100,
          peakDownloadSpeed: Math.round(peakDownloadSpeed * 100) / 100,
          avgLatency: Math.round(avgLatency * 100) / 100,
          minLatency: Math.round(minLatency * 100) / 100,
          maxLatency: Math.round(maxLatency * 100) / 100,
          totalDataConsumed: Math.round(bytesToGB(totalDataConsumed) * 1000) / 1000,
          utilizationPct: Math.round(utilizationPct * 100) / 100,
          consumptionPct: Math.round(consumptionPct * 100) / 100,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching site monthly metrics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch site monthly metrics',
    }
  }
}

/**
 * Get raw network telemetry for a site (for debugging/advanced views)
 */
export async function getRawNetworkTelemetry(
  siteId: number,
  dateRange: DateRange,
  limit: number = 100
): Promise<
  { success: true; data: typeof networkTelemetry.$inferSelect[] } | { success: false; error: string }
> {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const rawData = await db
      .select()
      .from(networkTelemetry)
      .where(
        and(
          eq(networkTelemetry.siteId, siteId),
          gte(networkTelemetry.timestamp, dateRange.start),
          lte(networkTelemetry.timestamp, dateRange.end)
        )
      )
      .orderBy(desc(networkTelemetry.timestamp))
      .limit(limit)

    return { success: true, data: rawData }
  } catch (error) {
    console.error('Error fetching raw network telemetry:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch raw network telemetry',
    }
  }
}

/**
 * Get network status summary for dashboard widgets
 * Returns quick summary of overall network health
 */
export async function getNetworkStatusSummary(): Promise<
  {
    success: true;
    data: {
      totalSites: number
      healthySites: number
      warningSites: number
      criticalSites: number
      avgUtilization: number
      avgLatency: number
      totalDataConsumedToday: number
    }
  } | { success: false; error: string }
> {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get current month data
    const currentMonth = formatMonth(new Date())

    const monthlyData = await db
      .select({
        siteId: networkMonthlyAggregates.siteId,
        utilizationPct: networkMonthlyAggregates.utilizationPct,
        avgLatency: networkMonthlyAggregates.avgLatency,
        totalDataConsumed: networkMonthlyAggregates.totalDataConsumed,
      })
      .from(networkMonthlyAggregates)
      .where(eq(networkMonthlyAggregates.month, currentMonth))

    if (monthlyData.length === 0) {
      return {
        success: true,
        data: {
          totalSites: 0,
          healthySites: 0,
          warningSites: 0,
          criticalSites: 0,
          avgUtilization: 0,
          avgLatency: 0,
          totalDataConsumedToday: 0,
        },
      }
    }

    let healthySites = 0
    let warningSites = 0
    let criticalSites = 0

    for (const row of monthlyData) {
      const status = calculateStatus(row.utilizationPct)
      if (status === 'good') healthySites++
      else if (status === 'warning') warningSites++
      else criticalSites++
    }

    const avgUtilization =
      monthlyData.reduce((sum, row) => sum + row.utilizationPct, 0) / monthlyData.length
    const avgLatency =
      monthlyData.reduce((sum, row) => sum + row.avgLatency, 0) / monthlyData.length
    const totalDataConsumed = monthlyData.reduce(
      (sum, row) => sum + row.totalDataConsumed,
      0
    )

    return {
      success: true,
      data: {
        totalSites: monthlyData.length,
        healthySites,
        warningSites,
        criticalSites,
        avgUtilization: Math.round(avgUtilization * 100) / 100,
        avgLatency: Math.round(avgLatency * 100) / 100,
        totalDataConsumedToday: Math.round(bytesToGB(totalDataConsumed) * 1000) / 1000,
      },
    }
  } catch (error) {
    console.error('Error fetching network status summary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch network status summary',
    }
  }
}
