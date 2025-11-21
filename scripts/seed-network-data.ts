/**
 * Seed Network Telemetry Data
 *
 * Generates realistic, randomized network usage data for all sites.
 * Each site gets unique characteristics for realistic variation.
 * Periods: May-Nov 2024, Feb-Jun 2025
 * Operating hours: 10:00-18:00
 */

import { db } from '../src/db'
import {
  sites,
  networkTelemetry,
  networkDailyAggregates,
  networkMonthlyAggregates,
} from '../src/db/schema'

// Configuration
const PERIODS = [
  { start: new Date('2024-05-01'), end: new Date('2024-11-30') },
  { start: new Date('2025-02-01'), end: new Date('2025-06-30') },
]

const OPERATING_HOURS = { start: 10, end: 18 } // 8 hours
const DAILY_ALLOWANCE_BYTES = 1 * 1024 * 1024 * 1024 // 1 GB

// Issue sites cutoff dates - no data should be generated after these dates
const ISSUE_SITES_CUTOFF: Record<string, Date> = {
  'drayini community hall': new Date('2025-02-06T23:59:59'),
  'clydesdale community hall': new Date('2025-02-09T23:59:59'),
  'thuleshe hall': new Date('2025-02-14T23:59:59'),
  'mpithini community hall': new Date('2025-02-18T23:59:59'),
  'mziki hall': new Date('2025-02-26T23:59:59'),
  'smme facility': new Date('2025-02-27T23:59:59'),
  'hlafuna community hall': new Date('2025-02-28T23:59:59'),
  'sheshe community hall': new Date('2025-03-01T23:59:59'),
  'thumosong centre (high flats)': new Date('2025-03-01T23:59:59'),
  'thumosong centre': new Date('2025-03-01T23:59:59'),
  'amazabeko community hall': new Date('2025-03-01T23:59:59'),
  'hlobani tourist centre': new Date('2025-03-03T23:59:59'),
  'ngunjini community hall': new Date('2025-03-03T23:59:59'),
}

// Site characteristic interface
interface SiteCharacteristics {
  baseUtilization: number      // 0.4-0.95 - how much of bandwidth typically used
  baseLatency: number          // 10-50ms base latency
  latencyVariance: number      // How much latency fluctuates
  consumptionFactor: number    // 0.3-1.2 - multiplier for daily consumption
  reliability: number          // 0.7-1.0 - consistency of performance
  peakHourBoost: number        // Extra usage during peak hours
  trendDirection: number       // -0.1 to 0.1 - monthly trend
  hasWeekendDrop: boolean      // Lower usage on weekends
  outageFrequency: number      // 0-0.05 - chance of bad day
}

// Helper functions
function getBandwidthForSite(siteName: string): number {
  return siteName.toLowerCase().includes('pholela') ? 100 : 15
}

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Get cutoff date for issue sites (returns null if site has no issues)
function getCutoffDate(siteName: string): Date | null {
  const normalizedName = siteName.toLowerCase().trim()
  return ISSUE_SITES_CUTOFF[normalizedName] || null
}

// Generate random number in range
function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

// Generate random characteristics for a site
function generateSiteCharacteristics(siteName: string): SiteCharacteristics {
  // Use site name as seed for some consistency
  const nameHash = siteName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const seedRandom = () => ((nameHash * 9301 + 49297) % 233280) / 233280

  // Pholela School gets special treatment (100 Mbps line)
  const isPholela = siteName.toLowerCase().includes('pholela')

  return {
    baseUtilization: isPholela
      ? randomInRange(0.7, 0.92)  // High utilization for premium line
      : randomInRange(0.4, 0.95), // Wide range for others
    baseLatency: randomInRange(12, 45),
    latencyVariance: randomInRange(0.1, 0.4),
    consumptionFactor: randomInRange(0.4, 1.15),
    reliability: randomInRange(0.75, 0.98),
    peakHourBoost: randomInRange(1.0, 1.3),
    trendDirection: randomInRange(-0.08, 0.08),
    hasWeekendDrop: Math.random() > 0.6, // 40% of sites have weekend drop
    outageFrequency: randomInRange(0, 0.04),
  }
}

// Get seasonal factor based on month
function getSeasonalFactor(month: number): number {
  // Southern hemisphere: Summer Dec-Feb, Winter Jun-Aug
  const seasonFactors: Record<number, number> = {
    1: 0.85,  // Jan - summer holiday
    2: 0.90,  // Feb - back to school
    3: 1.0,   // Mar
    4: 1.05,  // Apr
    5: 1.1,   // May - winter starting
    6: 1.15,  // Jun - peak winter
    7: 1.1,   // Jul
    8: 1.05,  // Aug
    9: 1.0,   // Sep - spring
    10: 0.95, // Oct
    11: 0.9,  // Nov
    12: 0.8,  // Dec - summer holiday
  }
  return seasonFactors[month] || 1.0
}

// Generate speed based on time, characteristics, and conditions
function generateSpeed(
  hour: number,
  bandwidth: number,
  chars: SiteCharacteristics,
  dayOfWeek: number,
  monthIndex: number,
  dayInPeriod: number,
  isOutageDay: boolean
): { upload: number; download: number } {
  // Base speed from utilization
  let baseSpeed = bandwidth * chars.baseUtilization

  // Time-of-day pattern
  let timeMultiplier = 0.7
  if (hour >= 11 && hour <= 15) {
    timeMultiplier = chars.peakHourBoost // Peak hours
  } else if (hour === 10 || hour === 17) {
    timeMultiplier = 0.6 + Math.random() * 0.2 // Ramp up/down
  } else {
    timeMultiplier = 0.75 + Math.random() * 0.2 // Normal hours
  }

  // Weekend drop
  if (chars.hasWeekendDrop && (dayOfWeek === 0 || dayOfWeek === 6)) {
    timeMultiplier *= 0.6
  }

  // Seasonal adjustment
  const month = (monthIndex % 12) + 1
  const seasonalFactor = getSeasonalFactor(month)

  // Trend over time (gradual change)
  const trendFactor = 1 + (chars.trendDirection * dayInPeriod / 100)

  // Reliability variance
  const reliabilityNoise = chars.reliability + (1 - chars.reliability) * Math.random()

  // Random variance
  const variance = 0.85 + Math.random() * 0.3

  // Calculate final speed
  let speed = baseSpeed * timeMultiplier * seasonalFactor * trendFactor * reliabilityNoise * variance

  // Outage day - significant degradation
  if (isOutageDay) {
    speed *= randomInRange(0.2, 0.5)
  }

  // Ensure within bounds
  speed = Math.min(speed, bandwidth)
  speed = Math.max(speed, bandwidth * 0.1) // At least 10% of bandwidth

  // Upload slightly lower than download
  const uploadRatio = randomInRange(0.85, 0.98)

  return {
    upload: Math.round(speed * uploadRatio * 100) / 100,
    download: Math.round(speed * 100) / 100,
  }
}

// Generate latency based on characteristics and conditions
function generateLatency(
  chars: SiteCharacteristics,
  hour: number,
  isOutageDay: boolean
): number {
  let latency = chars.baseLatency

  // Time-based variance (busier = higher latency)
  if (hour >= 11 && hour <= 15) {
    latency *= 1 + randomInRange(0, 0.3)
  }

  // Normal variance
  latency *= 1 + (Math.random() - 0.5) * chars.latencyVariance * 2

  // Random spikes (5% chance)
  if (Math.random() < 0.05) {
    latency += randomInRange(20, 60)
  }

  // Outage day - high latency
  if (isOutageDay) {
    latency *= randomInRange(2, 5)
  }

  return Math.round(Math.max(5, Math.min(200, latency)) * 10) / 10
}

// Generate data consumption
function generateConsumption(
  chars: SiteCharacteristics,
  hour: number,
  dayOfWeek: number,
  isOutageDay: boolean
): number {
  const baseHourly = (DAILY_ALLOWANCE_BYTES / 8) * chars.consumptionFactor

  // Time pattern
  let multiplier = 1.0
  if (hour >= 11 && hour <= 15) {
    multiplier = 1.2 + Math.random() * 0.3 // Peak
  } else if (hour === 10 || hour === 17) {
    multiplier = 0.6 + Math.random() * 0.2 // Start/end
  } else {
    multiplier = 0.8 + Math.random() * 0.3 // Normal
  }

  // Weekend
  if (chars.hasWeekendDrop && (dayOfWeek === 0 || dayOfWeek === 6)) {
    multiplier *= 0.5
  }

  // Outage
  if (isOutageDay) {
    multiplier *= 0.3
  }

  // Variance
  multiplier *= 0.7 + Math.random() * 0.6

  return Math.round(baseHourly * multiplier)
}

async function clearExistingData() {
  console.log('Clearing existing network telemetry data...')
  await db.delete(networkMonthlyAggregates)
  await db.delete(networkDailyAggregates)
  await db.delete(networkTelemetry)
  console.log('Cleared existing data')
}

async function seedNetworkData() {
  console.log('Starting network data seed with realistic random data...')
  console.log(`Periods: ${PERIODS.map(p => `${formatDate(p.start)} to ${formatDate(p.end)}`).join(', ')}`)

  // Get all sites
  const allSites = await db.select().from(sites)
  console.log(`Found ${allSites.length} sites`)

  if (allSites.length === 0) {
    console.error('No sites found. Please run db:seed first.')
    process.exit(1)
  }

  let totalRecords = 0
  let totalDailyAggregates = 0
  let totalMonthlyAggregates = 0

  for (const site of allSites) {
    const bandwidth = getBandwidthForSite(site.name)
    const chars = generateSiteCharacteristics(site.name)
    const cutoffDate = getCutoffDate(site.name)

    if (cutoffDate) {
      console.log(`Processing site: ${site.name} (${bandwidth} Mbps, util: ${(chars.baseUtilization * 100).toFixed(0)}%, latency: ${chars.baseLatency.toFixed(0)}ms) ⚠️  CUTOFF: ${formatDate(cutoffDate)}`)
    } else {
      console.log(`Processing site: ${site.name} (${bandwidth} Mbps, util: ${(chars.baseUtilization * 100).toFixed(0)}%, latency: ${chars.baseLatency.toFixed(0)}ms)`)
    }

    // Track monthly data for aggregation
    const monthlyData: Map<string, {
      speeds: { upload: number; download: number }[];
      latencies: number[];
      dataConsumed: number;
      activeDays: number;
      activeHours: number;
    }> = new Map()

    let dayInPeriod = 0

    for (const period of PERIODS) {
      const currentDate = new Date(period.start)

      while (currentDate <= period.end) {
        // Skip dates after cutoff for issue sites
        if (cutoffDate && currentDate > cutoffDate) {
          currentDate.setDate(currentDate.getDate() + 1)
          dayInPeriod++
          continue
        }

        const dateStr = formatDate(currentDate)
        const monthStr = formatMonth(currentDate)
        const dayOfWeek = currentDate.getDay()
        const monthIndex = currentDate.getMonth()

        // Determine if this is an outage day
        const isOutageDay = Math.random() < chars.outageFrequency

        // Initialize monthly tracking
        if (!monthlyData.has(monthStr)) {
          monthlyData.set(monthStr, {
            speeds: [],
            latencies: [],
            dataConsumed: 0,
            activeDays: 0,
            activeHours: 0,
          })
        }

        // Daily accumulators
        const dailySpeeds: { upload: number; download: number }[] = []
        const dailyLatencies: number[] = []
        let dailyDataConsumed = 0

        // Generate hourly telemetry
        const telemetryBatch: typeof networkTelemetry.$inferInsert[] = []

        for (let hour = OPERATING_HOURS.start; hour < OPERATING_HOURS.end; hour++) {
          const timestamp = new Date(currentDate)
          timestamp.setHours(hour, 0, 0, 0)

          // Generate metrics with realistic randomization
          const speeds = generateSpeed(hour, bandwidth, chars, dayOfWeek, monthIndex, dayInPeriod, isOutageDay)
          const latency = generateLatency(chars, hour, isOutageDay)
          const dataConsumed = generateConsumption(chars, hour, dayOfWeek, isOutageDay)

          const jitter = latency * randomInRange(0.05, 0.15)
          const packetLoss = isOutageDay
            ? randomInRange(1, 5)
            : randomInRange(0, 0.5)

          dailyDataConsumed += dataConsumed

          telemetryBatch.push({
            siteId: site.id,
            timestamp,
            uploadSpeed: speeds.upload,
            downloadSpeed: speeds.download,
            allocatedBandwidth: bandwidth,
            latency,
            jitter,
            packetLoss,
            dataConsumed,
          })

          dailySpeeds.push(speeds)
          dailyLatencies.push(latency)
        }

        // Insert hourly telemetry in batch
        if (telemetryBatch.length > 0) {
          await db.insert(networkTelemetry).values(telemetryBatch)
          totalRecords += telemetryBatch.length
        }

        // Create daily aggregate
        const avgUpload = dailySpeeds.reduce((sum, s) => sum + s.upload, 0) / dailySpeeds.length
        const avgDownload = dailySpeeds.reduce((sum, s) => sum + s.download, 0) / dailySpeeds.length
        const maxUpload = Math.max(...dailySpeeds.map(s => s.upload))
        const maxDownload = Math.max(...dailySpeeds.map(s => s.download))
        const avgLatency = dailyLatencies.reduce((sum, l) => sum + l, 0) / dailyLatencies.length
        const minLatency = Math.min(...dailyLatencies)
        const maxLatency = Math.max(...dailyLatencies)

        await db.insert(networkDailyAggregates).values({
          siteId: site.id,
          date: dateStr,
          avgUploadSpeed: Math.round(avgUpload * 100) / 100,
          avgDownloadSpeed: Math.round(avgDownload * 100) / 100,
          maxUploadSpeed: Math.round(maxUpload * 100) / 100,
          maxDownloadSpeed: Math.round(maxDownload * 100) / 100,
          allocatedBandwidth: bandwidth,
          avgLatency: Math.round(avgLatency * 10) / 10,
          minLatency: Math.round(minLatency * 10) / 10,
          maxLatency: Math.round(maxLatency * 10) / 10,
          avgJitter: Math.round(avgLatency * 0.1 * 10) / 10,
          totalDataConsumed: Math.round(dailyDataConsumed),
          dataAllowance: DAILY_ALLOWANCE_BYTES,
          activeHours: OPERATING_HOURS.end - OPERATING_HOURS.start,
        })
        totalDailyAggregates++

        // Update monthly tracking
        const monthly = monthlyData.get(monthStr)!
        monthly.speeds.push(...dailySpeeds)
        monthly.latencies.push(...dailyLatencies)
        monthly.dataConsumed += dailyDataConsumed
        monthly.activeDays++
        monthly.activeHours += OPERATING_HOURS.end - OPERATING_HOURS.start

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
        dayInPeriod++
      }
    }

    // Create monthly aggregates
    for (const [monthStr, data] of monthlyData) {
      const avgUpload = data.speeds.reduce((sum, s) => sum + s.upload, 0) / data.speeds.length
      const avgDownload = data.speeds.reduce((sum, s) => sum + s.download, 0) / data.speeds.length
      const peakUpload = Math.max(...data.speeds.map(s => s.upload))
      const peakDownload = Math.max(...data.speeds.map(s => s.download))
      const avgLatency = data.latencies.reduce((sum, l) => sum + l, 0) / data.latencies.length

      // Calculate p95 latency
      const sortedLatencies = [...data.latencies].sort((a, b) => a - b)
      const p95Index = Math.floor(sortedLatencies.length * 0.95)
      const p95Latency = sortedLatencies[p95Index] || avgLatency

      // Monthly allowance based on days
      const [year, month] = monthStr.split('-').map(Number)
      const daysInMonth = getDaysInMonth(year, month - 1)
      const monthlyAllowance = DAILY_ALLOWANCE_BYTES * daysInMonth

      await db.insert(networkMonthlyAggregates).values({
        siteId: site.id,
        month: monthStr,
        avgUploadSpeed: Math.round(avgUpload * 100) / 100,
        avgDownloadSpeed: Math.round(avgDownload * 100) / 100,
        peakUploadSpeed: Math.round(peakUpload * 100) / 100,
        peakDownloadSpeed: Math.round(peakDownload * 100) / 100,
        allocatedBandwidth: bandwidth,
        utilizationPct: Math.round((avgDownload / bandwidth) * 10000) / 100,
        avgLatency: Math.round(avgLatency * 10) / 10,
        p95Latency: Math.round(p95Latency * 10) / 10,
        avgJitter: Math.round(avgLatency * 0.1 * 10) / 10,
        totalDataConsumed: Math.round(data.dataConsumed),
        monthlyAllowance,
        consumptionPct: Math.round((data.dataConsumed / monthlyAllowance) * 10000) / 100,
        activeDays: data.activeDays,
        totalActiveHours: data.activeHours,
      })
      totalMonthlyAggregates++
    }
  }

  console.log('\n=== Seed Complete ===')
  console.log(`Total hourly records: ${totalRecords.toLocaleString()}`)
  console.log(`Total daily aggregates: ${totalDailyAggregates.toLocaleString()}`)
  console.log(`Total monthly aggregates: ${totalMonthlyAggregates.toLocaleString()}`)
}

async function main() {
  try {
    await clearExistingData()
    await seedNetworkData()
    console.log('\nNetwork data seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding network data:', error)
    process.exit(1)
  }
}

main()
