import { db } from '../src/db'
import { sites } from '../src/db/schema'
import { sql } from 'drizzle-orm'

async function main() {
  // Get total site count
  const siteCount = await db.select({ count: sql<number>`count(*)` }).from(sites)

  console.log(`Total sites in database: ${siteCount[0].count}`)
  console.log("=".repeat(80))

  // Get all sites
  const allSites = await db.select({
    id: sites.id,
    name: sites.name,
    state: sites.state,
    status: sites.status,
  }).from(sites).orderBy(sites.name)

  console.log("\nAll sites:")
  allSites.forEach((site, i) => {
    const num = String(i + 1).padStart(3, ' ')
    const id = String(site.id).padStart(3, ' ')
    console.log(`${num} [ID ${id}] ${site.name} (${site.state || 'N/A'}) - ${site.status}`)
  })

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
