import { db } from '../src/db'
import { sites } from '../src/db/schema'
import * as fs from 'fs'

async function main() {
  const allSites = await db.select({
    id: sites.id,
    name: sites.name,
    slug: sites.slug,
    state: sites.state,
    status: sites.status,
  }).from(sites).orderBy(sites.name)

  console.log(`Total sites in database: ${allSites.length}`)
  console.log("=".repeat(80))

  // Write to file for comparison
  const dbSiteNames = allSites.map(s => s.name)
  fs.writeFileSync('/tmp/db_site_names.txt', dbSiteNames.join('\n'))

  // Display all sites
  allSites.forEach((site, i) => {
    const num = String(i + 1).padStart(3, ' ')
    const id = String(site.id).padStart(3, ' ')
    console.log(`${num}. [ID ${id}] ${site.name} - ${site.status}`)
  })

  console.log("\n" + "=".repeat(80))
  console.log("Database site names saved to /tmp/db_site_names.txt")

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
