import { db } from '../src/db'
import { networkDailyAggregates, sites } from '../src/db/schema'
import { sql } from 'drizzle-orm'

async function main() {
  const dailyCount = await db.select({ count: sql<number>`count(*)` }).from(networkDailyAggregates)
  const siteCount = await db.select({ count: sql<number>`count(*)` }).from(sites)

  console.log('Total sites:', siteCount[0].count)
  console.log('Daily aggregates:', dailyCount[0].count)

  process.exit(0)
}

main()
