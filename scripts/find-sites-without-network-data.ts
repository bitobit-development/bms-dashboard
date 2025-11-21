import { db } from '../src/db'
import { sites, networkTelemetry } from '../src/db/schema'
import { sql } from 'drizzle-orm'

async function main() {
  // Get all sites
  const allSites = await db.select({ id: sites.id, name: sites.name }).from(sites).orderBy(sites.name)

  console.log(`Total sites: ${allSites.length}\n`)

  const sitesWithData: string[] = []
  const sitesWithoutData: string[] = []

  for (const site of allSites) {
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(networkTelemetry)
      .where(sql`site_id = ${site.id}`)

    if (Number(count[0].count) > 0) {
      sitesWithData.push(site.name)
    } else {
      sitesWithoutData.push(site.name)
    }
  }

  console.log(`Sites WITH network data: ${sitesWithData.length}`)
  console.log(`Sites WITHOUT network data: ${sitesWithoutData.length}`)

  if (sitesWithoutData.length > 0) {
    console.log('\n=== Sites WITHOUT network data ===')
    sitesWithoutData.forEach((name, i) => {
      console.log(`${i + 1}. ${name}`)
    })
  }

  process.exit(0)
}

main()
