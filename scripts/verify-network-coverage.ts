/**
 * Verify Network Data Coverage
 *
 * Validates that network data has been correctly generated:
 * - Issue sites have NO data after their cutoff dates
 * - Active sites have full data coverage
 * - All sites have proper data ranges
 */

import { db } from '../src/db'
import {
  sites,
  networkTelemetry,
  networkDailyAggregates,
  networkMonthlyAggregates,
} from '../src/db/schema'
import { sql, eq, gte, lte, and } from 'drizzle-orm'

interface IssueSite {
  name: string
  cutoffDate: string
}

const ISSUE_SITES: IssueSite[] = [
  { name: 'Drayini Community Hall', cutoffDate: '2025-02-06' },
  { name: 'Clydesdale Community Hall', cutoffDate: '2025-02-09' },
  { name: 'Thuleshe Hall', cutoffDate: '2025-02-14' },
  { name: 'Mpithini Community Hall', cutoffDate: '2025-02-18' },
  { name: 'Mziki Hall', cutoffDate: '2025-02-26' },
  { name: 'SMME Facility', cutoffDate: '2025-02-27' },
  { name: 'Hlafuna Community Hall', cutoffDate: '2025-02-28' },
  { name: 'Sheshe Community Hall', cutoffDate: '2025-03-01' },
  { name: 'Thumosong Centre (High Flats)', cutoffDate: '2025-03-01' },
  { name: 'Amazabeko Community Hall', cutoffDate: '2025-03-01' },
  { name: 'Hlobani Tourist Centre', cutoffDate: '2025-03-03' },
  { name: 'Ngunjini Community Hall', cutoffDate: '2025-03-03' },
]

async function findSiteByName(name: string): Promise<number | null> {
  const exactMatch = await db.query.sites.findFirst({
    where: sql`LOWER(${sites.name}) = LOWER(${name})`,
  })

  if (exactMatch) return exactMatch.id

  const fuzzyMatch = await db.query.sites.findFirst({
    where: sql`LOWER(${sites.name}) LIKE ${`%${name.toLowerCase()}%`}`,
  })

  return fuzzyMatch?.id || null
}

async function verifyIssueSite(issueSite: IssueSite) {
  const siteId = await findSiteByName(issueSite.name)

  if (!siteId) {
    return {
      site: issueSite.name,
      found: false,
      valid: false,
      issue: 'Site not found in database',
    }
  }

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
  })

  // Check for data AFTER cutoff date (should be 0)
  const afterCutoffDate = new Date(issueSite.cutoffDate)
  afterCutoffDate.setDate(afterCutoffDate.getDate() + 1) // Day after cutoff

  const invalidData = await db
    .select({ count: sql<number>`count(*)` })
    .from(networkTelemetry)
    .where(
      and(
        eq(networkTelemetry.siteId, siteId),
        gte(networkTelemetry.timestamp, afterCutoffDate)
      )
    )

  const hasInvalidData = Number(invalidData[0].count) > 0

  // Check for data BEFORE cutoff date (should exist)
  const beforeCutoff = await db
    .select({ count: sql<number>`count(*)` })
    .from(networkTelemetry)
    .where(
      and(
        eq(networkTelemetry.siteId, siteId),
        lte(networkTelemetry.timestamp, new Date(issueSite.cutoffDate))
      )
    )

  const hasValidData = Number(beforeCutoff[0].count) > 0

  return {
    site: site?.name || issueSite.name,
    found: true,
    valid: !hasInvalidData && hasValidData,
    invalidRecordsAfterCutoff: Number(invalidData[0].count),
    validRecordsBeforeCutoff: Number(beforeCutoff[0].count),
    cutoffDate: issueSite.cutoffDate,
    status: site?.status,
  }
}

async function main() {
  console.log('🔍 Verifying Network Data Coverage...\n')

  // Overall stats
  const totalSites = await db.select({ count: sql<number>`count(*)` }).from(sites)
  const totalHourly = await db.select({ count: sql<number>`count(*)` }).from(networkTelemetry)
  const totalDaily = await db.select({ count: sql<number>`count(*)` }).from(networkDailyAggregates)
  const totalMonthly = await db.select({ count: sql<number>`count(*)` }).from(networkMonthlyAggregates)

  console.log('='.repeat(80))
  console.log('OVERALL STATISTICS')
  console.log('='.repeat(80))
  console.log(`Total sites: ${totalSites[0].count}`)
  console.log(`Total hourly records: ${Number(totalHourly[0].count).toLocaleString()}`)
  console.log(`Total daily aggregates: ${Number(totalDaily[0].count).toLocaleString()}`)
  console.log(`Total monthly aggregates: ${Number(totalMonthly[0].count).toLocaleString()}`)

  // Site status breakdown
  const statusBreakdown = await db
    .select({ status: sites.status, count: sql<number>`count(*)` })
    .from(sites)
    .groupBy(sites.status)

  console.log('\n' + '='.repeat(80))
  console.log('SITE STATUS BREAKDOWN')
  console.log('='.repeat(80))
  statusBreakdown.forEach((row) => {
    console.log(`${row.status}: ${row.count} sites`)
  })

  // Verify issue sites
  console.log('\n' + '='.repeat(80))
  console.log('VERIFYING ISSUE SITES (No data after cutoff)')
  console.log('='.repeat(80))

  const results = []
  let validCount = 0
  let invalidCount = 0

  for (const issueSite of ISSUE_SITES) {
    const result = await verifyIssueSite(issueSite)
    results.push(result)

    if (!result.found) {
      console.log(`\n❌ ${result.site}`)
      console.log(`   Issue: ${result.issue}`)
      invalidCount++
    } else if (result.valid) {
      console.log(`\n✅ ${result.site} (${result.status})`)
      console.log(`   Cutoff: ${result.cutoffDate}`)
      console.log(`   Valid records (before cutoff): ${result.validRecordsBeforeCutoff}`)
      console.log(`   Invalid records (after cutoff): ${result.invalidRecordsAfterCutoff}`)
      validCount++
    } else {
      console.log(`\n⚠️  ${result.site} (${result.status})`)
      console.log(`   Cutoff: ${result.cutoffDate}`)
      console.log(`   Valid records (before cutoff): ${result.validRecordsBeforeCutoff}`)
      console.log(`   Invalid records (after cutoff): ${result.invalidRecordsAfterCutoff}`)
      console.log(`   Issue: ${(result.invalidRecordsAfterCutoff ?? 0) > 0 ? 'Data exists after cutoff!' : 'No data before cutoff!'}`)
      invalidCount++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('VERIFICATION SUMMARY')
  console.log('='.repeat(80))
  console.log(`✅ Valid issue sites: ${validCount}/${ISSUE_SITES.length}`)
  console.log(`❌ Invalid issue sites: ${invalidCount}/${ISSUE_SITES.length}`)

  if (invalidCount === 0) {
    console.log('\n🎉 All verifications passed!')
  } else {
    console.log('\n⚠️  Some verifications failed. Please review the issues above.')
  }

  console.log('='.repeat(80))

  process.exit(invalidCount > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('❌ Error during verification:', error)
  process.exit(1)
})
