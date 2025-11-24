/**
 * Data Transformation Utilities for PDF Generation
 *
 * Transforms network metrics for PDF display and calculates summary statistics.
 */

import type { SiteNetworkDetail } from '@/app/actions/network-usage'

// ============================================================================
// Types
// ============================================================================

export interface PdfSiteData {
  site: {
    id: number
    name: string
    location: string
    allocatedBandwidth: number
  }
  summary: {
    avgUploadSpeed: string
    avgDownloadSpeed: string
    peakUploadSpeed: string
    peakDownloadSpeed: string
    avgLatency: string
    minLatency: string
    maxLatency: string
    totalDataConsumed: string
    utilizationPct: string
    consumptionPct: string
    status: 'good' | 'warning' | 'critical'
  }
  speedData: Array<{
    date: string
    upload: string
    download: string
    allocated: string
  }>
  latencyData: Array<{
    date: string
    avg: string
    min: string
    max: string
  }>
  consumptionData: Array<{
    date: string
    consumed: string
    allowance: string
  }>
}

export interface PdfAggregateData {
  totalSites: number
  dateRange: string
  overallSummary: {
    avgUploadSpeed: string
    avgDownloadSpeed: string
    avgLatency: string
    totalDataConsumed: string
    avgUtilizationPct: string
    healthySites: number
    warningSites: number
    criticalSites: number
  }
}

// ============================================================================
// Data Sampling Functions
// ============================================================================

/**
 * Sample data points to reduce chart complexity
 * Keeps first, last, and evenly distributed points up to maxPoints
 */
export function sampleDataPoints<T>(data: T[], maxPoints: number = 30): T[] {
  if (data.length <= maxPoints) return data

  // Always keep first and last points
  const step = Math.ceil((data.length - 2) / (maxPoints - 2))
  const sampled: T[] = [data[0]] // Start with first point

  // Add evenly distributed middle points
  for (let i = step; i < data.length - 1; i += step) {
    sampled.push(data[i])
  }

  // Always include last point
  sampled.push(data[data.length - 1])

  return sampled
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format speed in Mbps with 2 decimal places
 */
export const formatSpeed = (mbps: number): string => {
  return `${mbps.toFixed(2)} Mbps`
}

/**
 * Format latency in milliseconds with 2 decimal places
 */
export const formatLatency = (ms: number): string => {
  return `${ms.toFixed(2)} ms`
}

/**
 * Format data consumption in GB with 3 decimal places
 */
export const formatDataGB = (gb: number): string => {
  return `${gb.toFixed(3)} GB`
}

/**
 * Format percentage with 2 decimal places
 */
export const formatPercentage = (pct: number): string => {
  return `${pct.toFixed(2)}%`
}

/**
 * Format date as YYYY-MM-DD
 */
export const formatDate = (date: string | Date): string => {
  if (typeof date === 'string') return date
  return date.toISOString().split('T')[0]
}

/**
 * Format date range as "MMM DD, YYYY - MMM DD, YYYY"
 */
export const formatDateRange = (start: Date, end: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  const startStr = start.toLocaleDateString('en-US', options)
  const endStr = end.toLocaleDateString('en-US', options)
  return `${startStr} - ${endStr}`
}

/**
 * Format location from city and state
 */
export const formatLocation = (city: string | null, state: string | null): string => {
  const parts = [city, state].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Unknown Location'
}

// ============================================================================
// Status Calculation
// ============================================================================

/**
 * Calculate status based on utilization percentage
 */
export const calculateStatus = (utilization: number): 'good' | 'warning' | 'critical' => {
  if (utilization >= 90) return 'critical'
  if (utilization >= 70) return 'warning'
  return 'good'
}

/**
 * Get status label for display
 */
export const getStatusLabel = (status: 'good' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'good':
      return 'Healthy'
    case 'warning':
      return 'Warning'
    case 'critical':
      return 'Critical'
    default:
      return 'Unknown'
  }
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Transform site network detail for PDF display
 * Samples data points to reduce PDF rendering time
 */
export const transformSiteData = (
  data: SiteNetworkDetail,
  city: string | null,
  state: string | null
): PdfSiteData => {
  const status = calculateStatus(data.summary.utilizationPct)

  // Use full data (no sampling) - user requested full data in reports
  const sampledSpeedData = data.speedData
  const sampledLatencyData = data.latencyData
  const sampledConsumptionData = data.consumptionData

  return {
    site: {
      id: data.site.id,
      name: data.site.name,
      location: formatLocation(city, state),
      allocatedBandwidth: data.site.allocatedBandwidth,
    },
    summary: {
      avgUploadSpeed: formatSpeed(data.summary.avgUploadSpeed),
      avgDownloadSpeed: formatSpeed(data.summary.avgDownloadSpeed),
      peakUploadSpeed: formatSpeed(data.summary.peakUploadSpeed),
      peakDownloadSpeed: formatSpeed(data.summary.peakDownloadSpeed),
      avgLatency: formatLatency(data.summary.avgLatency),
      minLatency: formatLatency(data.summary.minLatency),
      maxLatency: formatLatency(data.summary.maxLatency),
      totalDataConsumed: formatDataGB(data.summary.totalDataConsumed),
      utilizationPct: formatPercentage(data.summary.utilizationPct),
      consumptionPct: formatPercentage(data.summary.consumptionPct),
      status,
    },
    speedData: sampledSpeedData.map(row => ({
      date: formatDate(row.date),
      upload: row.upload.toFixed(2),
      download: row.download.toFixed(2),
      allocated: row.allocated.toFixed(0),
    })),
    latencyData: sampledLatencyData.map(row => ({
      date: formatDate(row.date),
      avg: row.avg.toFixed(2),
      min: row.min.toFixed(2),
      max: row.max.toFixed(2),
    })),
    consumptionData: sampledConsumptionData.map(row => ({
      date: formatDate(row.date),
      consumed: row.consumed.toFixed(3),
      allowance: row.allowance.toFixed(3),
    })),
  }
}

/**
 * Calculate aggregate statistics across multiple sites
 */
export const calculateAggregateData = (
  sites: PdfSiteData[],
  dateRange: { start: Date; end: Date }
): PdfAggregateData => {
  if (sites.length === 0) {
    return {
      totalSites: 0,
      dateRange: formatDateRange(dateRange.start, dateRange.end),
      overallSummary: {
        avgUploadSpeed: '0.00 Mbps',
        avgDownloadSpeed: '0.00 Mbps',
        avgLatency: '0.00 ms',
        totalDataConsumed: '0.000 GB',
        avgUtilizationPct: '0.00%',
        healthySites: 0,
        warningSites: 0,
        criticalSites: 0,
      },
    }
  }

  // Parse numeric values from formatted strings
  const parseSpeed = (str: string) => parseFloat(str.replace(' Mbps', ''))
  const parseLatency = (str: string) => parseFloat(str.replace(' ms', ''))
  const parseData = (str: string) => parseFloat(str.replace(' GB', ''))
  const parsePercentage = (str: string) => parseFloat(str.replace('%', ''))

  // Calculate averages
  const totalUpload = sites.reduce((sum, site) =>
    sum + parseSpeed(site.summary.avgUploadSpeed), 0)
  const totalDownload = sites.reduce((sum, site) =>
    sum + parseSpeed(site.summary.avgDownloadSpeed), 0)
  const totalLatency = sites.reduce((sum, site) =>
    sum + parseLatency(site.summary.avgLatency), 0)
  const totalData = sites.reduce((sum, site) =>
    sum + parseData(site.summary.totalDataConsumed), 0)
  const totalUtilization = sites.reduce((sum, site) =>
    sum + parsePercentage(site.summary.utilizationPct), 0)

  // Count status distribution
  const healthySites = sites.filter(site => site.summary.status === 'good').length
  const warningSites = sites.filter(site => site.summary.status === 'warning').length
  const criticalSites = sites.filter(site => site.summary.status === 'critical').length

  return {
    totalSites: sites.length,
    dateRange: formatDateRange(dateRange.start, dateRange.end),
    overallSummary: {
      avgUploadSpeed: formatSpeed(totalUpload / sites.length),
      avgDownloadSpeed: formatSpeed(totalDownload / sites.length),
      avgLatency: formatLatency(totalLatency / sites.length),
      totalDataConsumed: formatDataGB(totalData),
      avgUtilizationPct: formatPercentage(totalUtilization / sites.length),
      healthySites,
      warningSites,
      criticalSites,
    },
  }
}

// ============================================================================
// Summary Insights Generation
// ============================================================================

/**
 * Generate textual insights from aggregate data
 */
export const generateInsights = (aggregateData: PdfAggregateData): string[] => {
  const insights: string[] = []
  const { overallSummary } = aggregateData

  // Utilization insight
  const utilization = parseFloat(overallSummary.avgUtilizationPct.replace('%', ''))
  if (utilization >= 90) {
    insights.push('Network utilization is critically high across sites. Consider bandwidth upgrades.')
  } else if (utilization >= 70) {
    insights.push('Network utilization is elevated. Monitor closely for potential congestion.')
  } else if (utilization < 30) {
    insights.push('Network utilization is low. Current bandwidth allocation is sufficient.')
  }

  // Health insight
  if (overallSummary.criticalSites > 0) {
    insights.push(`${overallSummary.criticalSites} site(s) in critical status require immediate attention.`)
  }
  if (overallSummary.warningSites > 0) {
    insights.push(`${overallSummary.warningSites} site(s) showing warning signs. Review performance metrics.`)
  }
  if (overallSummary.healthySites === aggregateData.totalSites) {
    insights.push('All sites are operating within healthy parameters.')
  }

  // Latency insight
  const latency = parseFloat(overallSummary.avgLatency.replace(' ms', ''))
  if (latency > 100) {
    insights.push('Average latency is high. Investigate network connectivity issues.')
  } else if (latency < 30) {
    insights.push('Network latency is excellent across all sites.')
  }

  return insights
}
