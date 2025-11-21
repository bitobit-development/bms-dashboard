/**
 * Clean Up Network Data for Sites with Issues
 *
 * Deletes network telemetry data AFTER the issue date for 12 sites
 * that have "SITE HAS ISSUES" status in the Excel report.
 */

import { db } from '../src/db'
import {
  sites,
  networkTelemetry,
  networkDailyAggregates,
  networkMonthlyAggregates,
} from '../src/db/schema'
import { eq, gte, and, sql } from 'drizzle-orm'

interface IssueSite {
  name: string
  cutoffDate: string // Date after which data should be deleted
  code: string
}

const ISSUE_SITES: IssueSite[] = [
  { name: 'Drayini Community Hall', cutoffDate: '2025-02-07', code: 'NDZ007' },
  { name: 'Clydesdale Community Hall', cutoffDate: '2025-02-10', code: 'UMZ028' },
  { name: 'Thuleshe Hall', cutoffDate: '2025-02-15', code: 'UBU038' },
  { name: 'Mpithini Community Hall', cutoffDate: '2025-02-19', code: 'NDZ055' },
  { name: 'Mziki Hall', cutoffDate: '2025-02-27', code: 'UBU021' },
  { name: 'SMME Facility', cutoffDate: '2025-02-28', code: 'UMZ022' },
  { name: 'Hlafuna Community Hall', cutoffDate: '2025-03-01', code: 'NDZ060' },
  { name: 'Sheshe Community Hall', cutoffDate: '2025-03-02', code: 'UBU033' },
  { name: 'Thumosong Centre (High Flats)', cutoffDate: '2025-03-02', code: 'UBU035' },
  { name: 'Amazabeko Community Hall', cutoffDate: '2025-03-02', code: 'UBU025' },
  { name: 'Hlobani Tourist Centre', cutoffDate: '2025-03-04', code: 'UMZ021' },
  { name: 'Ngunjini Community Hall', cutoffDate: '2025-03-04', code: 'UMZ010' },
]

async function findSiteByName(name: string): Promise<number | null> {
  // Try exact match first
  const exactMatch = await db.query.sites.findFirst({
    where: sql`LOWER(${sites.name}) = LOWER(${name})`,
  })

  if (exactMatch) return exactMatch.id

  // Try fuzzy match (contains)
  const fuzzyMatch = await db.query.sites.findFirst({
    where: sql`LOWER(${sites.name}) LIKE ${`%${name.toLowerCase()}%`}`,
  })

  return fuzzyMatch?.id || null
}

async function cleanupSiteData(issueSite: IssueSite) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Processing: ${issueSite.name} (${issueSite.code})`)
  console.log(`Cutoff Date: ${issueSite.cutoffDate} (delete data ON and after this date)`)
  console.log('='.repeat(80))

  // Find the site in database
  const siteId = await findSiteByName(issueSite.name)

  if (!siteId) {
    console.log(`⚠️  Site not found in database: ${issueSite.name}`)
    return {
      site: issueSite.name,
      found: false,
      hourlyDeleted: 0,
      dailyDeleted: 0,
      monthlyDeleted: 0,
    }
  }

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
  })

  console.log(`✅ Found site: ${site?.name} (ID: ${siteId})`)

  // Delete hourly telemetry data on or after cutoff date
  const hourlyResult = await db
    .delete(networkTelemetry)
    .where(
      and(
        eq(networkTelemetry.siteId, siteId),
        gte(networkTelemetry.timestamp, new Date(issueSite.cutoffDate))
      )
    )
    .returning({ id: networkTelemetry.id })

  console.log(`🗑️  Deleted ${hourlyResult.length} hourly telemetry records`)

  // Delete daily aggregates on or after cutoff date
  const dailyResult = await db
    .delete(networkDailyAggregates)
    .where(
      and(
        eq(networkDailyAggregates.siteId, siteId),
        gte(networkDailyAggregates.date, issueSite.cutoffDate)
      )
    )
    .returning({ id: networkDailyAggregates.id })

  console.log(`🗑️  Deleted ${dailyResult.length} daily aggregate records`)

  // Delete monthly aggregates for affected months (Feb 2025 onwards)
  const monthlyResult = await db
    .delete(networkMonthlyAggregates)
    .where(
      and(
        eq(networkMonthlyAggregates.siteId, siteId),
        gte(networkMonthlyAggregates.month, '2025-02')
      )
    )
    .returning({ id: networkMonthlyAggregates.id })

  console.log(`🗑️  Deleted ${monthlyResult.length} monthly aggregate records`)

  // Update site status to 'maintenance'
  await db
    .update(sites)
    .set({ status: 'maintenance', updatedAt: new Date() })
    .where(eq(sites.id, siteId))

  console.log(`✅ Updated site status to 'maintenance'`)

  return {
    site: issueSite.name,
    found: true,
    siteId,
    hourlyDeleted: hourlyResult.length,
    dailyDeleted: dailyResult.length,
    monthlyDeleted: monthlyResult.length,
  }
}

async function main() {
  console.log('🧹 Cleaning up network data for sites with issues...\n')
  console.log(`Processing ${ISSUE_SITES.length} sites\n`)

  const results = []

  for (const issueSite of ISSUE_SITES) {
    const result = await cleanupSiteData(issueSite)
    results.push(result)
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('CLEANUP SUMMARY')
  console.log('='.repeat(80))

  const found = results.filter((r) => r.found)
  const notFound = results.filter((r) => !r.found)

  console.log(`\n✅ Sites processed: ${found.length}`)
  console.log(`⚠️  Sites not found: ${notFound.length}`)

  const totalHourly = found.reduce((sum, r) => sum + r.hourlyDeleted, 0)
  const totalDaily = found.reduce((sum, r) => sum + r.dailyDeleted, 0)
  const totalMonthly = found.reduce((sum, r) => sum + r.monthlyDeleted, 0)

  console.log(`\n🗑️  Total hourly records deleted: ${totalHourly.toLocaleString()}`)
  console.log(`🗑️  Total daily records deleted: ${totalDaily.toLocaleString()}`)
  console.log(`🗑️  Total monthly records deleted: ${totalMonthly.toLocaleString()}`)

  if (notFound.length > 0) {
    console.log('\n⚠️  Sites not found in database:')
    notFound.forEach((r) => console.log(`   - ${r.site}`))
  }

  console.log('\n✅ Cleanup completed successfully!')
  console.log('='.repeat(80))

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Error during cleanup:', error)
  process.exit(1)
})
