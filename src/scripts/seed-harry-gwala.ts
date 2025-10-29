/**
 * Harry Gwala District BMS Sites Seeding Script
 *
 * Seeds 5 BMS sites in Harry Gwala district, KwaZulu-Natal, South Africa
 * with initial weather data.
 *
 * Usage:
 *   pnpm tsx src/scripts/seed-harry-gwala.ts
 */

import { db } from '../db/index'
import { organizations, sites, equipment } from '../db/schema/index'
import { eq } from 'drizzle-orm'
import { weatherService } from '../lib/weather-service'
import { saveWeatherData } from '../lib/weather-db'

/**
 * Harry Gwala district BMS sites
 */
const harryGwalaSites = [
  {
    name: 'Ixopo Community Center BMS',
    slug: 'ixopo-community-center',
    description: 'Community center with solar backup power system',
    city: 'Ixopo',
    state: 'KwaZulu-Natal',
    country: 'South Africa',
    latitude: -30.0667,
    longitude: 29.9833,
    timezone: 'Africa/Johannesburg',
    solarCapacityKw: 150,
    batteryCapacityKwh: 400,
    dailyConsumptionKwh: 280,
    nominalVoltage: 500,
  },
  {
    name: 'Kokstad Hospital Energy System',
    slug: 'kokstad-hospital',
    description: 'Hospital critical load backup system',
    city: 'Kokstad',
    state: 'KwaZulu-Natal',
    country: 'South Africa',
    latitude: -30.5472,
    longitude: 29.4242,
    timezone: 'Africa/Johannesburg',
    solarCapacityKw: 300,
    batteryCapacityKwh: 800,
    dailyConsumptionKwh: 600,
    nominalVoltage: 500,
  },
  {
    name: 'Underberg School Solar Array',
    slug: 'underberg-school',
    description: 'School renewable energy system',
    city: 'Underberg',
    state: 'KwaZulu-Natal',
    country: 'South Africa',
    latitude: -29.7667,
    longitude: 29.5333,
    timezone: 'Africa/Johannesburg',
    solarCapacityKw: 100,
    batteryCapacityKwh: 250,
    dailyConsumptionKwh: 180,
    nominalVoltage: 500,
  },
  {
    name: 'Umzimkhulu Clinic BMS',
    slug: 'umzimkhulu-clinic',
    description: 'Rural clinic power backup',
    city: 'Umzimkhulu',
    state: 'KwaZulu-Natal',
    country: 'South Africa',
    latitude: -30.2833,
    longitude: 29.9333,
    timezone: 'Africa/Johannesburg',
    solarCapacityKw: 80,
    batteryCapacityKwh: 200,
    dailyConsumptionKwh: 120,
    nominalVoltage: 500,
  },
  {
    name: 'Franklin Agricultural Co-op',
    slug: 'franklin-agricultural-coop',
    description: 'Agricultural facility solar power system',
    city: 'Franklin',
    state: 'KwaZulu-Natal',
    country: 'South Africa',
    latitude: -30.3167,
    longitude: 29.3833,
    timezone: 'Africa/Johannesburg',
    solarCapacityKw: 200,
    batteryCapacityKwh: 500,
    dailyConsumptionKwh: 350,
    nominalVoltage: 500,
  },
]

/**
 * Main seeding function
 */
const main = async () => {
  console.log('🌍 Seeding Harry Gwala District BMS Sites\n')

  // Step 1: Get or create organization
  console.log('📦 Getting organization...')
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, 'demo-bms'))
    .limit(1)

  if (!org) {
    console.error('❌ Organization not found. Please run `pnpm db:seed` first.')
    process.exit(1)
  }

  console.log(`✅ Using organization: ${org.name} (ID: ${org.id})\n`)

  // Step 2: Seed each site
  console.log('🏢 Seeding Harry Gwala sites...\n')

  for (const siteConfig of harryGwalaSites) {
    try {
      console.log(`📍 Processing: ${siteConfig.name}`)

      // Check if site already exists
      const existingSite = await db
        .select()
        .from(sites)
        .where(eq(sites.slug, siteConfig.slug))
        .limit(1)

      let site
      if (existingSite.length > 0) {
        console.log('  ℹ️  Site already exists, updating...')
        const [updated] = await db
          .update(sites)
          .set({
            ...siteConfig,
            organizationId: org.id,
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(sites.id, existingSite[0].id))
          .returning()
        site = updated
      } else {
        console.log('  ➕ Creating new site...')
        const [inserted] = await db
          .insert(sites)
          .values({
            ...siteConfig,
            organizationId: org.id,
            status: 'active',
            installedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
            lastSeenAt: new Date(),
          })
          .returning()
        site = inserted
      }

      console.log(`  ✅ Site: ${site.name} (ID: ${site.id})`)

      // Step 3: Create equipment for the site
      console.log('  ⚡ Creating equipment...')

      // Delete existing equipment
      await db.delete(equipment).where(eq(equipment.siteId, site.id))

      const equipmentItems = [
        {
          siteId: site.id,
          type: 'inverter' as const,
          name: 'Inverter 1',
          manufacturer: 'SolarEdge',
          model: 'SE100K',
          serialNumber: `INV1-${site.id}-${Math.random().toString(36).substring(7).toUpperCase()}`,
          capacity: siteConfig.solarCapacityKw / 2,
          voltage: 500,
          status: 'operational' as const,
          healthScore: 95 + Math.random() * 5,
          installedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          specs: { maxPower: siteConfig.solarCapacityKw / 2, efficiency: 98, warrantyYears: 10 },
        },
        {
          siteId: site.id,
          type: 'inverter' as const,
          name: 'Inverter 2',
          manufacturer: 'SolarEdge',
          model: 'SE100K',
          serialNumber: `INV2-${site.id}-${Math.random().toString(36).substring(7).toUpperCase()}`,
          capacity: siteConfig.solarCapacityKw / 2,
          voltage: 500,
          status: 'operational' as const,
          healthScore: 94 + Math.random() * 6,
          installedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          specs: { maxPower: siteConfig.solarCapacityKw / 2, efficiency: 98, warrantyYears: 10 },
        },
        {
          siteId: site.id,
          type: 'battery' as const,
          name: 'Battery Bank',
          manufacturer: 'Tesla',
          model: 'Powerpack',
          serialNumber: `BAT-${site.id}-${Math.random().toString(36).substring(7).toUpperCase()}`,
          capacity: siteConfig.batteryCapacityKwh,
          voltage: 500,
          status: 'operational' as const,
          healthScore: 98,
          installedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          specs: { maxPower: siteConfig.batteryCapacityKwh, efficiency: 95, warrantyYears: 10 },
        },
        {
          siteId: site.id,
          type: 'solar_panel' as const,
          name: 'Solar Array',
          manufacturer: 'SunPower',
          model: 'Maxeon 3',
          serialNumber: `SOLAR-${site.id}-${Math.random().toString(36).substring(7).toUpperCase()}`,
          capacity: siteConfig.solarCapacityKw,
          voltage: 520,
          status: 'operational' as const,
          healthScore: 97,
          installedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          specs: { maxPower: siteConfig.solarCapacityKw, efficiency: 22, warrantyYears: 25 },
        },
      ]

      await db.insert(equipment).values(equipmentItems)
      console.log(`  ✅ Created ${equipmentItems.length} equipment items`)

      // Step 4: Fetch and save current weather
      console.log('  🌤️  Fetching current weather...')
      try {
        const currentWeather = await weatherService.getCurrentWeather(
          siteConfig.latitude,
          siteConfig.longitude
        )

        await saveWeatherData(site.id, currentWeather, 'seed')
        console.log(
          `  ✅ Weather: ${currentWeather.temperature}°C, ${currentWeather.condition}`
        )
      } catch (error) {
        console.error('  ⚠️  Failed to fetch weather:', error)
      }

      // Rate limit - wait 1 second between API requests
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log('')
    } catch (error) {
      console.error(`❌ Failed to seed ${siteConfig.name}:`, error)
    }
  }

  console.log('✨ Harry Gwala district seeding completed!\n')
  console.log('Summary:')
  console.log(`  • ${harryGwalaSites.length} sites`)
  console.log(`  • Equipment for each site`)
  console.log(`  • Current weather data`)
  console.log('\nView in Drizzle Studio: pnpm db:studio')
  console.log('View dashboard: http://localhost:3000/dashboard/weather\n')

  process.exit(0)
}

// Run the script
main().catch((error) => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})
