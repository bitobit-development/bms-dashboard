import { db } from '../src/db'
import { sites, networkTelemetry, networkDailyAggregates } from '../src/db/schema'
import { sql, inArray } from 'drizzle-orm'

const NEW_SITE_NAMES = [
  'Donnybrook Parkhome', 'Ward 14 Sportsfield (Gugwini)', 'Community Radio Station (Harry Gwala FM)',
  'Mleyi Sport Field', 'Thumosong Centre (High Flats)', 'Batlokoa Tribal Authority Council',
  'Vezokuhle Tribal Authority Council', 'Amagwane Tribal Authority Council', 'Zashuke Tribal Authority Council',
  'Municipal Pound', 'Macala Gwala Tribal Authority Council', 'Madikane Tribal Authority Council',
  'Peace Initiative Hall', 'Hlobani Tourist Centre', 'Centocow Tribal Court',
  'Underburg Taxi Rank', 'Hopewell Hall', 'Thuleshe Hall', 'Themba Mnguni Hall',
  'Umzimkhulu Library', 'Nhlangwini Hall', 'Umzimkhulu Turf', 'Mzwandile Mhlauli Community Hall',
  'Ntakama Hall', 'Hlafuna Community Hall'
]

async function main() {
  const newSites = await db.select({ id: sites.id, name: sites.name }).from(sites).where(
    inArray(sites.name, NEW_SITE_NAMES)
  )

  console.log('New sites data status:')
  console.log('='.repeat(80))

  let withData = 0
  let withoutData = 0

  for (const site of newSites) {
    const hourlyCount = await db.select({ count: sql<number>`count(*)` })
      .from(networkTelemetry)
      .where(sql`site_id = ${site.id}`)

    const dailyCount = await db.select({ count: sql<number>`count(*)` })
      .from(networkDailyAggregates)
      .where(sql`site_id = ${site.id}`)

    const hasData = Number(hourlyCount[0].count) > 0

    if (hasData) {
      console.log(`✅ [ID ${site.id}] ${site.name}`)
      console.log(`   Hourly: ${Number(hourlyCount[0].count)}, Daily: ${Number(dailyCount[0].count)}`)
      withData++
    } else {
      console.log(`❌ [ID ${site.id}] ${site.name} - NO DATA`)
      withoutData++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`Sites with data: ${withData}`)
  console.log(`Sites without data: ${withoutData}`)
  console.log('='.repeat(80))

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
