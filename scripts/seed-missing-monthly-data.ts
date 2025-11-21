/**
 * Seed Missing Monthly Network Data
 *
 * Adds monthly aggregate data for sites that don't have it.
 * Only covers May 2024 - November 2024 (7 months).
 * Does NOT delete existing data.
 */

import { db } from '../src/db'
import { sites, networkMonthlyAggregates } from '../src/db/schema'
import { sql, notInArray } from 'drizzle-orm'

const MONTHS = ['2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11']
const DAILY_ALLOWANCE_BYTES = 1 * 1024 * 1024 * 1024 // 1 GB

function getBandwidthForSite(siteName: string): number {
  return siteName.toLowerCase().includes('pholela') ? 100 : 15
}

function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function getSeasonalFactor(month: number): number {
  const factors: Record<number, number> = {
    5: 1.1, 6: 1.15, 7: 1.1, 8: 1.05, 9: 1.0, 10: 0.95, 11: 0.9
  }
  return factors[month] || 1.0
}

function generateMonthlyData(siteName: string, month: string) {
  const bandwidth = getBandwidthForSite(siteName)
  const daysInMonth = getDaysInMonth(month)
  const monthNum = parseInt(month.split('-')[1])
  const seasonalFactor = getSeasonalFactor(monthNum)

  // Site characteristics (randomized per site)
  const baseUtilization = randomInRange(0.4, 0.95)
  const baseLatency = randomInRange(12, 45)
  const consumptionFactor = randomInRange(0.4, 1.15)

  // Calculate speeds
  const avgDownloadSpeed = Math.round(bandwidth * baseUtilization * seasonalFactor * randomInRange(0.85, 1.0) * 100) / 100
  const avgUploadSpeed = Math.round(avgDownloadSpeed * randomInRange(0.85, 0.98) * 100) / 100
  const peakDownloadSpeed = Math.round(Math.min(bandwidth, avgDownloadSpeed * randomInRange(1.1, 1.3)) * 100) / 100
  const peakUploadSpeed = Math.round(peakDownloadSpeed * randomInRange(0.85, 0.95) * 100) / 100

  // Latency
  const avgLatency = Math.round(baseLatency * randomInRange(0.9, 1.1) * 10) / 10
  const p95Latency = Math.round(avgLatency * randomInRange(1.3, 1.8) * 10) / 10
  const avgJitter = Math.round(avgLatency * 0.1 * 10) / 10

  // Data consumption
  const monthlyAllowance = DAILY_ALLOWANCE_BYTES * daysInMonth
  const totalDataConsumed = Math.round(monthlyAllowance * consumptionFactor * randomInRange(0.7, 1.1))
  const consumptionPct = Math.round((totalDataConsumed / monthlyAllowance) * 10000) / 100

  // Active days (most days, occasional outages)
  const activeDays = Math.floor(daysInMonth * randomInRange(0.9, 1.0))
  const totalActiveHours = activeDays * 8 // 8 operating hours per day

  return {
    month,
    avgUploadSpeed,
    avgDownloadSpeed,
    peakUploadSpeed,
    peakDownloadSpeed,
    allocatedBandwidth: bandwidth,
    utilizationPct: Math.round((avgDownloadSpeed / bandwidth) * 10000) / 100,
    avgLatency,
    p95Latency,
    avgJitter,
    totalDataConsumed,
    monthlyAllowance,
    consumptionPct,
    activeDays,
    totalActiveHours,
  }
}

async function main() {
  console.log('Finding sites without monthly aggregate data...')

  // Get site IDs that already have monthly data
  const sitesWithData = await db
    .selectDistinct({ siteId: networkMonthlyAggregates.siteId })
    .from(networkMonthlyAggregates)

  const siteIdsWithData = sitesWithData.map(s => s.siteId)
  console.log(`Sites with existing data: ${siteIdsWithData.length}`)

  // Get sites without monthly data
  const sitesWithoutData = siteIdsWithData.length > 0
    ? await db.select().from(sites).where(notInArray(sites.id, siteIdsWithData))
    : await db.select().from(sites)

  console.log(`Sites needing data: ${sitesWithoutData.length}`)

  if (sitesWithoutData.length === 0) {
    console.log('All sites already have monthly data!')
    process.exit(0)
  }

  let totalInserted = 0

  for (const site of sitesWithoutData) {
    console.log(`Processing: ${site.name}`)

    const monthlyRecords = MONTHS.map(month => ({
      siteId: site.id,
      ...generateMonthlyData(site.name, month)
    }))

    await db.insert(networkMonthlyAggregates).values(monthlyRecords)
    totalInserted += monthlyRecords.length
  }

  console.log(`\n=== Complete ===`)
  console.log(`Sites updated: ${sitesWithoutData.length}`)
  console.log(`Monthly records inserted: ${totalInserted}`)

  process.exit(0)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
