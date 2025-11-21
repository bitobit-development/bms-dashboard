import { db } from '../src/db'
import { networkMonthlyAggregates, sites } from '../src/db/schema'
import { sql, gte, lte, and } from 'drizzle-orm'

async function main() {
  // Check overall counts
  const totalSites = await db.select({ count: sql<number>`count(*)` }).from(sites)
  const totalMonthly = await db.select({ count: sql<number>`count(*)` }).from(networkMonthlyAggregates)

  console.log('Total sites:', totalSites[0].count)
  console.log('Total monthly aggregates:', totalMonthly[0].count)

  // Check sites with monthly data in May-Nov 2024 range
  const sitesInRange = await db
    .select({
      siteId: networkMonthlyAggregates.siteId,
      siteName: sites.name,
      count: sql<number>`count(*)`
    })
    .from(networkMonthlyAggregates)
    .innerJoin(sites, sql`${networkMonthlyAggregates.siteId} = ${sites.id}`)
    .where(
      and(
        gte(networkMonthlyAggregates.month, '2024-05'),
        lte(networkMonthlyAggregates.month, '2024-11')
      )
    )
    .groupBy(networkMonthlyAggregates.siteId, sites.name)

  console.log('\nSites with monthly data in May-Nov 2024:', sitesInRange.length)

  // Check sites with monthly data in Feb-Jun 2025 range
  const sites2025 = await db
    .select({
      siteId: networkMonthlyAggregates.siteId,
      siteName: sites.name,
      count: sql<number>`count(*)`
    })
    .from(networkMonthlyAggregates)
    .innerJoin(sites, sql`${networkMonthlyAggregates.siteId} = ${sites.id}`)
    .where(
      and(
        gte(networkMonthlyAggregates.month, '2025-02'),
        lte(networkMonthlyAggregates.month, '2025-06')
      )
    )
    .groupBy(networkMonthlyAggregates.siteId, sites.name)

  console.log('Sites with monthly data in Feb-Jun 2025:', sites2025.length)

  // Check unique sites with ANY monthly data
  const uniqueSites = await db
    .select({
      count: sql<number>`count(DISTINCT site_id)`
    })
    .from(networkMonthlyAggregates)

  console.log('\nTotal unique sites with monthly data:', uniqueSites[0].count)

  process.exit(0)
}

main()
