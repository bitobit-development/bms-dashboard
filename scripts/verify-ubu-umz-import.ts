/**
 * Verify UBU/UMZ Import
 * Quick verification script to check import results
 */

import { db } from '../src/db'
import { organizations, sites, equipment } from '../src/db/schema'
import { sql, eq } from 'drizzle-orm'

async function main() {
  console.log('📊 Database Summary After UBU/UMZ Import:')
  console.log('═'.repeat(60))

  // Total counts
  const [orgCount] = await db.select({ count: sql<number>`count(*)` }).from(organizations)
  const [siteCount] = await db.select({ count: sql<number>`count(*)` }).from(sites)
  const [equipCount] = await db.select({ count: sql<number>`count(*)` }).from(equipment)

  console.log(`\nTotal Organizations: ${orgCount.count}`)
  console.log(`Total Sites: ${siteCount.count}`)
  console.log(`Total Equipment: ${equipCount.count}`)

  // Organization breakdown
  const orgs = await db.query.organizations.findMany({
    orderBy: (orgs, { asc }) => [asc(orgs.name)],
  })

  console.log('\n📋 Organizations with Site Counts:')
  console.log('─'.repeat(60))

  for (const org of orgs) {
    const orgSites = await db.query.sites.findMany({
      where: eq(sites.organizationId, org.id),
    })

    // Count equipment for all sites in this organization
    let equipCount = 0
    for (const site of orgSites) {
      const siteEquip = await db.query.equipment.findMany({
        where: eq(equipment.siteId, site.id),
      })
      equipCount += siteEquip.length
    }

    console.log(`  ${org.name}\n    - Sites: ${orgSites.length}\n    - Equipment: ${equipCount}`)
  }

  // UBU organization details
  const ubuOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, 'umgungundlovu-district'),
  })

  if (ubuOrg) {
    const ubuSites = await db.query.sites.findMany({
      where: eq(sites.organizationId, ubuOrg.id),
      columns: { name: true, postalCode: true, latitude: true, longitude: true },
    })

    console.log('\n🏢 UBU Sites (uMgungundlovu District):')
    console.log('─'.repeat(60))
    console.log(`Total: ${ubuSites.length} sites`)
    if (ubuSites.length > 0) {
      console.log('First 5 sites:')
      ubuSites.slice(0, 5).forEach((site, i) => {
        console.log(
          `  ${i + 1}. ${site.name} (${site.postalCode}) - GPS: ${site.latitude?.toFixed(6)}, ${site.longitude?.toFixed(6)}`
        )
      })
    }
  }

  // UMZ organization details
  const umzOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, 'umzinyathi-district'),
  })

  if (umzOrg) {
    const umzSites = await db.query.sites.findMany({
      where: eq(sites.organizationId, umzOrg.id),
      columns: { name: true, postalCode: true, latitude: true, longitude: true },
    })

    console.log('\n🏢 UMZ Sites (uMzinyathi District):')
    console.log('─'.repeat(60))
    console.log(`Total: ${umzSites.length} sites`)
    if (umzSites.length > 0) {
      console.log('First 5 sites:')
      umzSites.slice(0, 5).forEach((site, i) => {
        console.log(
          `  ${i + 1}. ${site.name} (${site.postalCode}) - GPS: ${site.latitude?.toFixed(6)}, ${site.longitude?.toFixed(6)}`
        )
      })
    }
  }

  console.log('\n✨ Verification complete!\n')
  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Verification failed:', error)
  process.exit(1)
})
