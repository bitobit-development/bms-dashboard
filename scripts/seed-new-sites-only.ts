/**
 * Seed Network Data for NEW Sites Only (25 sites)
 *
 * Does NOT delete existing data. Only generates data for the 25 newly added sites.
 */

import { db } from '../src/db'
import {
  sites,
  networkTelemetry,
  networkDailyAggregates,
  networkMonthlyAggregates,
} from '../src/db/schema'
import { inArray, sql } from 'drizzle-orm'

// The 25 new sites we just added
const NEW_SITE_NAMES = [
  'Donnybrook Parkhome',
  'Ward 14 Sportsfield (Gugwini)',
  'Community Radio Station (Harry Gwala FM)',
  'Mleyi Sport Field',
  'Thumosong Centre (High Flats)',
  'Batlokoa Tribal Authority Council',
  'Vezokuhle Tribal Authority Council',
  'Amagwane Tribal Authority Council',
  'Zashuke Tribal Authority Council',
  'Municipal Pound',
  'Macala Gwala Tribal Authority Council',
  'Madikane Tribal Authority Council',
  'Peace Initiative Hall',
  'Hlobani Tourist Centre',
  'Centocow Tribal Court',
  'Underburg Taxi Rank',
  'Hopewell Hall',
  'Thuleshe Hall',
  'Themba Mnguni Hall',
  'Umzimkhulu Library',
  'Nhlangwini Hall',
  'Umzimkhulu Turf',
  'Mzwandile Mhlauli Community Hall',
  'Ntakama Hall',
  'Hlafuna Community Hall',
]

// Issue sites cutoff dates - no data should be generated after these dates
const ISSUE_SITES_CUTOFF: Record<string, Date> = {
  'thuleshe hall': new Date('2025-02-14T23:59:59'),
  'thumosong centre (high flats)': new Date('2025-03-01T23:59:59'),
  'hlobani tourist centre': new Date('2025-03-03T23:59:59'),
  'hlafuna community hall': new Date('2025-02-28T23:59:59'),
}

// Copy all the helper functions from seed-network-data.ts
const PERIODS = [
  { start: new Date('2024-05-01'), end: new Date('2024-11-30') },
  { start: new Date('2025-02-01'), end: new Date('2025-06-30') },
]

const OPERATING_HOURS = { start: 10, end: 18 }
const DAILY_ALLOWANCE_BYTES = 1 * 1024 * 1024 * 1024

interface SiteCharacteristics {
  baseUtilization: number
  baseLatency: number
  latencyVariance: number
  consumptionFactor: number
  reliability: number
  peakHourBoost: number
  trendDirection: number
  hasWeekendDrop: boolean
  outageFrequency: number
}

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

function getCutoffDate(siteName: string): Date | null {
  const normalizedName = siteName.toLowerCase().trim()
  return ISSUE_SITES_CUTOFF[normalizedName] || null
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateSiteCharacteristics(siteName: string): SiteCharacteristics {
  const nameHash = siteName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const isPholela = siteName.toLowerCase().includes('pholela')

  return {
    baseUtilization: isPholela
      ? randomInRange(0.7, 0.92)
      : randomInRange(0.4, 0.95),
    baseLatency: randomInRange(12, 45),
    latencyVariance: randomInRange(0.1, 0.4),
    consumptionFactor: randomInRange(0.4, 1.15),
    reliability: randomInRange(0.75, 0.98),
    peakHourBoost: randomInRange(1.0, 1.3),
    trendDirection: randomInRange(-0.08, 0.08),
    hasWeekendDrop: Math.random() > 0.6,
    outageFrequency: randomInRange(0, 0.04),
  }
}

function getSeasonalFactor(month: number): number {
  const seasonFactors: Record<number, number> = {
    1: 0.85, 2: 0.90, 3: 1.0, 4: 1.05, 5: 1.1, 6: 1.15,
    7: 1.1, 8: 1.05, 9: 1.0, 10: 0.95, 11: 0.9, 12: 0.8,
  }
  return seasonFactors[month] || 1.0
}

function generateSpeed(
  hour: number,
  bandwidth: number,
  chars: SiteCharacteristics,
  dayOfWeek: number,
  monthIndex: number,
  dayInPeriod: number,
  isOutageDay: boolean
): { upload: number; download: number } {
  let baseSpeed = bandwidth * chars.baseUtilization
  let timeMultiplier = 0.7

  if (hour >= 11 && hour <= 15) {
    timeMultiplier = chars.peakHourBoost
  } else if (hour === 10 || hour === 17) {
    timeMultiplier = 0.6 + Math.random() * 0.2
  } else {
    timeMultiplier = 0.75 + Math.random() * 0.2
  }

  if (chars.hasWeekendDrop && (dayOfWeek === 0 || dayOfWeek === 6)) {
    timeMultiplier *= 0.6
  }

  const month = (monthIndex % 12) + 1
  const seasonalFactor = getSeasonalFactor(month)
  const trendFactor = 1 + (chars.trendDirection * dayInPeriod / 100)
  const reliabilityNoise = chars.reliability + (1 - chars.reliability) * Math.random()
  const variance = 0.85 + Math.random() * 0.3

  let speed = baseSpeed * timeMultiplier * seasonalFactor * trendFactor * reliabilityNoise * variance

  if (isOutageDay) {
    speed *= randomInRange(0.2, 0.5)
  }

  speed = Math.min(speed, bandwidth)
  speed = Math.max(speed, bandwidth * 0.1)

  const uploadRatio = randomInRange(0.85, 0.98)

  return {
    upload: Math.round(speed * uploadRatio * 100) / 100,
    download: Math.round(speed * 100) / 100,
  }
}

function generateLatency(
  chars: SiteCharacteristics,
  hour: number,
  isOutageDay: boolean
): number {
  let latency = chars.baseLatency

  if (hour >= 11 && hour <= 15) {
    latency *= 1 + randomInRange(0, 0.3)
  }

  latency *= 1 + (Math.random() - 0.5) * chars.latencyVariance * 2

  if (Math.random() < 0.05) {
    latency += randomInRange(20, 60)
  }

  if (isOutageDay) {
    latency *= randomInRange(2, 5)
  }

  return Math.round(Math.max(5, Math.min(200, latency)) * 10) / 10
}

function generateConsumption(
  chars: SiteCharacteristics,
  hour: number,
  dayOfWeek: number,
  isOutageDay: boolean
): number {
  const baseHourly = (DAILY_ALLOWANCE_BYTES / 8) * chars.consumptionFactor
  let multiplier = 1.0

  if (hour >= 11 && hour <= 15) {
    multiplier = 1.2 + Math.random() * 0.3
  } else if (hour === 10 || hour === 17) {
    multiplier = 0.6 + Math.random() * 0.2
  } else {
    multiplier = 0.8 + Math.random() * 0.3
  }

  if (chars.hasWeekendDrop && (dayOfWeek === 0 || dayOfWeek === 6)) {
    multiplier *= 0.5
  }

  if (isOutageDay) {
    multiplier *= 0.3
  }

  multiplier *= 0.7 + Math.random() * 0.6

  return Math.round(baseHourly * multiplier)
}

async function seedNetworkDataForNewSites() {
  console.log('Starting network data seed for NEW SITES ONLY...')
  console.log(`Periods: ${PERIODS.map(p => `${formatDate(p.start)} to ${formatDate(p.end)}`).join(', ')}`)

  // Get only the new sites
  const newSites = await db.select().from(sites).where(
    inArray(sites.name, NEW_SITE_NAMES)
  )

  console.log(`Found ${newSites.length} new sites to seed`)

  // Check which sites already have data (skip them)
  const sitesWithoutData = []
  for (const site of newSites) {
    const existingData = await db.select({ count: sql<number>`count(*)` })
      .from(networkTelemetry)
      .where(sql`site_id = ${site.id}`)

    if (Number(existingData[0].count) === 0) {
      sitesWithoutData.push(site)
    } else {
      console.log(`⏭️  Skipping ${site.name} (already has ${existingData[0].count} records)`)
    }
  }

  console.log(`\nSeeding ${sitesWithoutData.length} sites without data...\n`)

  let totalRecords = 0
  let totalDailyAggregates = 0
  let totalMonthlyAggregates = 0

  for (const site of sitesWithoutData) {
    const bandwidth = getBandwidthForSite(site.name)
    const chars = generateSiteCharacteristics(site.name)
    const cutoffDate = getCutoffDate(site.name)

    if (cutoffDate) {
      console.log(`Processing site: ${site.name} (${bandwidth} Mbps) ⚠️  CUTOFF: ${formatDate(cutoffDate)}`)
    } else {
      console.log(`Processing site: ${site.name} (${bandwidth} Mbps)`)
    }

    const monthlyData: Map<string, {
      speeds: { upload: number; download: number }[]
      latencies: number[]
      dataConsumed: number
      activeDays: number
      activeHours: number
    }> = new Map()

    let dayInPeriod = 0

    for (const period of PERIODS) {
      const currentDate = new Date(period.start)

      while (currentDate <= period.end) {
        if (cutoffDate && currentDate > cutoffDate) {
          currentDate.setDate(currentDate.getDate() + 1)
          dayInPeriod++
          continue
        }

        const dateStr = formatDate(currentDate)
        const monthStr = formatMonth(currentDate)
        const dayOfWeek = currentDate.getDay()
        const monthIndex = currentDate.getMonth()
        const isOutageDay = Math.random() < chars.outageFrequency

        if (!monthlyData.has(monthStr)) {
          monthlyData.set(monthStr, {
            speeds: [],
            latencies: [],
            dataConsumed: 0,
            activeDays: 0,
            activeHours: 0,
          })
        }

        const dailySpeeds: { upload: number; download: number }[] = []
        const dailyLatencies: number[] = []
        let dailyDataConsumed = 0

        const telemetryBatch: typeof networkTelemetry.$inferInsert[] = []

        for (let hour = OPERATING_HOURS.start; hour < OPERATING_HOURS.end; hour++) {
          const timestamp = new Date(currentDate)
          timestamp.setHours(hour, 0, 0, 0)

          const speeds = generateSpeed(hour, bandwidth, chars, dayOfWeek, monthIndex, dayInPeriod, isOutageDay)
          const latency = generateLatency(chars, hour, isOutageDay)
          const dataConsumed = generateConsumption(chars, hour, dayOfWeek, isOutageDay)
          const jitter = latency * randomInRange(0.05, 0.15)
          const packetLoss = isOutageDay ? randomInRange(1, 5) : randomInRange(0, 0.5)

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

        if (telemetryBatch.length > 0) {
          await db.insert(networkTelemetry).values(telemetryBatch)
          totalRecords += telemetryBatch.length
        }

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

        const monthly = monthlyData.get(monthStr)!
        monthly.speeds.push(...dailySpeeds)
        monthly.latencies.push(...dailyLatencies)
        monthly.dataConsumed += dailyDataConsumed
        monthly.activeDays++
        monthly.activeHours += OPERATING_HOURS.end - OPERATING_HOURS.start

        currentDate.setDate(currentDate.getDate() + 1)
        dayInPeriod++
      }
    }

    for (const [monthStr, data] of monthlyData) {
      const avgUpload = data.speeds.reduce((sum, s) => sum + s.upload, 0) / data.speeds.length
      const avgDownload = data.speeds.reduce((sum, s) => sum + s.download, 0) / data.speeds.length
      const peakUpload = Math.max(...data.speeds.map(s => s.upload))
      const peakDownload = Math.max(...data.speeds.map(s => s.download))
      const avgLatency = data.latencies.reduce((sum, l) => sum + l, 0) / data.latencies.length

      const sortedLatencies = [...data.latencies].sort((a, b) => a - b)
      const p95Index = Math.floor(sortedLatencies.length * 0.95)
      const p95Latency = sortedLatencies[p95Index] || avgLatency

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
    await seedNetworkDataForNewSites()
    console.log('\nNetwork data seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding network data:', error)
    process.exit(1)
  }
}

main()
