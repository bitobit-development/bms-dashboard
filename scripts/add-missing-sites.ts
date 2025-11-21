/**
 * Add 25 Missing Sites from Excel Report
 *
 * These sites appear in the Harry Gwala Excel report but are not in the database.
 */

import { db } from '../src/db'
import { sites, organizations } from '../src/db/schema'
import { eq } from 'drizzle-orm'

const MISSING_SITES = [
  { name: 'Donnybrook Parkhome', code: 'NDZ077' },
  { name: 'Ward 14 Sportsfield (Gugwini)', code: 'UMZ042' },
  { name: 'Community Radio Station (Harry Gwala FM)', code: 'UMZ041' },
  { name: 'Mleyi Sport Field', code: 'UBU040' },
  { name: 'Thumosong Centre (High Flats)', code: 'UBU035' },
  { name: 'Batlokoa Tribal Authority Council', code: 'NDZ061' },
  { name: 'Vezokuhle Tribal Authority Council', code: 'NDZ062' },
  { name: 'Amagwane Tribal Authority Council', code: 'NDZ076' },
  { name: 'Zashuke Tribal Authority Council', code: 'NDZ082' },
  { name: 'Municipal Pound', code: 'UMZ045' },
  { name: 'Macala Gwala Tribal Authority Council', code: 'NDZ074' },
  { name: 'Madikane Tribal Authority Council', code: 'NDZ070' },
  { name: 'Peace Initiative Hall', code: 'UBU032' },
  { name: 'Hlobani Tourist Centre', code: 'UMZ021' },
  { name: 'Centocow Tribal Court', code: 'NDZ083' },
  { name: 'Underburg Taxi Rank', code: 'NDZ058' },
  { name: 'Hopewell Hall', code: 'UBU036' },
  { name: 'Thuleshe Hall', code: 'UBU038' },
  { name: 'Themba Mnguni Hall', code: 'UBU037' },
  { name: 'Umzimkhulu Library', code: 'UMZ036' },
  { name: 'Nhlangwini Hall', code: 'UBU041' },
  { name: 'Umzimkhulu Turf', code: 'UMZ037' },
  { name: 'Mzwandile Mhlauli Community Hall', code: 'UMZ044' },
  { name: 'Ntakama Hall', code: 'UBU042' },
  { name: 'Hlafuna Community Hall', code: 'NDZ060' },
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function main() {
  console.log('Adding 25 missing sites to database...\n')

  // Get the organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, 'demo-bms'),
  })

  if (!org) {
    console.error('❌ Organization not found. Please run db:seed first.')
    process.exit(1)
  }

  console.log(`✅ Found organization: ${org.name} (ID: ${org.id})\n`)

  let addedCount = 0
  let skippedCount = 0

  for (const site of MISSING_SITES) {
    const slug = generateSlug(site.name)

    // Check if site already exists
    const existing = await db.query.sites.findFirst({
      where: eq(sites.slug, slug),
    })

    if (existing) {
      console.log(`⏭️  Skipped: ${site.name} (already exists)`)
      skippedCount++
      continue
    }

    // Insert new site
    await db.insert(sites).values({
      organizationId: org.id,
      name: site.name,
      slug,
      description: `Harry Gwala District site - ${site.code}`,
      address: 'KwaZulu-Natal',
      city: 'Harry Gwala District',
      state: 'KwaZulu-Natal',
      country: 'ZA',
      timezone: 'Africa/Johannesburg',
      nominalVoltage: 500,
      dailyConsumptionKwh: 65,
      batteryCapacityKwh: 50,
      solarCapacityKw: 20,
      status: 'active', // Will be updated later based on Excel status
      installedAt: new Date('2024-05-01'), // Assume installed before data collection
      lastSeenAt: new Date(),
      config: {
        alertThresholds: {
          batteryLowPercent: 20,
          batteryHighTemp: 45,
          gridFrequencyMin: 49.5,
          gridFrequencyMax: 50.5,
          voltageMin: 475,
          voltageMax: 525,
        },
      },
    })

    console.log(`✅ Added: ${site.name} (${site.code})`)
    addedCount++
  }

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Added ${addedCount} new sites`)
  console.log(`⏭️  Skipped ${skippedCount} existing sites`)
  console.log(`📊 Total: ${addedCount + skippedCount} sites processed`)
  console.log('='.repeat(80))

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Error adding sites:', error)
  process.exit(1)
})
