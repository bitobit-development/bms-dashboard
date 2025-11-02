/**
 * UBU Sites Import Script
 *
 * Imports 30 uMgungundlovu District community sites from Excel file.
 *
 * Features:
 * - Idempotent (safe to run multiple times)
 * - Creates UBU organization if not exists
 * - Converts DMS GPS coordinates to decimal degrees
 * - Creates standard equipment for each site
 * - Validates GPS coordinates
 *
 * Usage:
 *   pnpm import:ubu
 */

import * as XLSX from 'xlsx'
import { db } from '../src/db'
import { organizations, sites, equipment } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import * as fs from 'fs'

const EXCEL_FILE_PATH = '/Users/haim/Projects/bms-dashboard/docs/sites/UBU-Sites.xlsx'

// South Africa GPS bounds for validation
const SA_LAT_MIN = -34
const SA_LAT_MAX = -22
const SA_LON_MIN = 16
const SA_LON_MAX = 33

/**
 * Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 * Example: " 30°16'14.98\"S" → -30.270828
 */
function parseDMS(dms: string): number {
  // Remove whitespace
  dms = dms.trim()

  // Extract degrees, minutes, seconds, direction
  const regex = /(\d+)°\s*(\d+)'(\d+\.?\d*)"([NSEW])/
  const match = dms.match(regex)

  if (!match) {
    throw new Error(`Invalid DMS format: ${dms}`)
  }

  const [, degrees, minutes, seconds, direction] = match

  // Calculate decimal degrees
  let decimal =
    parseFloat(degrees) + parseFloat(minutes) / 60 + parseFloat(seconds) / 3600

  // Apply direction (S and W are negative)
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal
  }

  return decimal
}

/**
 * Validate GPS coordinates are within South Africa
 */
function validateGPSCoordinates(lat: number, lon: number): boolean {
  return lat >= SA_LAT_MIN && lat <= SA_LAT_MAX && lon >= SA_LON_MIN && lon <= SA_LON_MAX
}

/**
 * Generate unique slug from site name and postal code
 */
function generateUniqueSlug(name: string, postalCode: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${baseSlug}-${postalCode.toLowerCase()}`
}

/**
 * Create standard equipment for a community hall site
 */
async function createSiteEquipment(siteId: number, siteName: string): Promise<void> {
  const equipmentItems = [
    // 2x Inverters (15kW each, three-phase 400V)
    {
      siteId,
      type: 'inverter' as const,
      name: 'Inverter 1',
      manufacturer: 'SMA',
      model: 'Sunny Tripower 15000',
      serialNumber: `INV1-${siteId}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      capacity: 15, // kW
      voltage: 400, // 400V three-phase (SA standard)
      status: 'operational' as const,
      healthScore: 95 + Math.random() * 5,
      installedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
      specs: { maxPower: 15, efficiency: 96, warrantyYears: 10 },
    },
    {
      siteId,
      type: 'inverter' as const,
      name: 'Inverter 2',
      manufacturer: 'SMA',
      model: 'Sunny Tripower 15000',
      serialNumber: `INV2-${siteId}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      capacity: 15, // kW
      voltage: 400,
      status: 'operational' as const,
      healthScore: 94 + Math.random() * 6,
      installedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      specs: { maxPower: 15, efficiency: 96, warrantyYears: 10 },
    },
    // 1x Battery Bank (100kWh)
    {
      siteId,
      type: 'battery' as const,
      name: 'Battery Bank',
      manufacturer: 'BYD',
      model: 'Battery-Box Premium HVS',
      serialNumber: `BAT-${siteId}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      capacity: 100, // kWh
      voltage: 400,
      status: 'operational' as const,
      healthScore: 98,
      installedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      specs: { maxPower: 100, efficiency: 95, warrantyYears: 10 },
    },
    // 1x Solar Array (30kW)
    {
      siteId,
      type: 'solar_panel' as const,
      name: 'Solar Array',
      manufacturer: 'JA Solar',
      model: 'JAM72S30-550/MR',
      serialNumber: `SOLAR-${siteId}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      capacity: 30, // kW
      voltage: 520,
      status: 'operational' as const,
      healthScore: 97,
      installedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      specs: { maxPower: 30, efficiency: 18, warrantyYears: 25 },
    },
  ]

  await db.insert(equipment).values(equipmentItems)
}

async function main() {
  console.log('🚀 Starting UBU Sites Import...\n')

  // Step 1: Check if Excel file exists
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    throw new Error(`Excel file not found: ${EXCEL_FILE_PATH}`)
  }

  console.log(`📄 Reading Excel file: ${EXCEL_FILE_PATH}`)

  // Step 2: Read Excel file
  const workbook = XLSX.readFile(EXCEL_FILE_PATH)
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<{
    Name: string
    'Site Code': string
    Latitude: string
    Longitude: string
  }>(worksheet)

  console.log(`✅ Found ${rows.length} sites in Excel file\n`)

  // Step 3: Create or get UBU organization
  console.log('🏢 Setting up uMgungundlovu District Municipality organization...')

  let ubuOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, 'umgungundlovu-district'),
  })

  if (!ubuOrg) {
    const [org] = await db
      .insert(organizations)
      .values({
        name: 'uMgungundlovu District Municipality',
        slug: 'umgungundlovu-district',
        email: 'contact@umgungundlovu.gov.za',
        phone: '+27-33-000-0000',
        address: 'Municipal Building',
        city: 'Pietermaritzburg',
        state: 'KwaZulu-Natal',
        country: 'ZA',
        postalCode: '3200',
        status: 'active',
        subscriptionTier: 'enterprise',
        settings: {
          timezone: 'Africa/Johannesburg',
          alertEmail: ['alerts@umgungundlovu.gov.za'],
          dataRetentionDays: 365,
        },
      })
      .returning()

    ubuOrg = org
    console.log(`✅ Created organization: ${ubuOrg.name} (ID: ${ubuOrg.id})`)
  } else {
    console.log(`✅ Using existing organization: ${ubuOrg.name} (ID: ${ubuOrg.id})`)
  }

  // Step 4: Import sites
  console.log('\n📍 Importing sites...\n')

  let createdCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const row of rows) {
    try {
      const name = row.Name?.trim()
      const siteCode = row['Site Code']

      // Validate data
      if (!name || !siteCode) {
        console.error(`❌ Missing name or site code for row: ${JSON.stringify(row)}`)
        errorCount++
        continue
      }

      // Convert DMS to decimal
      let latitude: number
      let longitude: number

      try {
        latitude = parseDMS(row.Latitude)
        longitude = parseDMS(row.Longitude)
      } catch (error) {
        console.error(
          `❌ Failed to parse GPS coordinates for ${name}: ${row.Latitude}, ${row.Longitude}`
        )
        console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        errorCount++
        continue
      }

      if (isNaN(latitude) || isNaN(longitude)) {
        console.error(`❌ Invalid GPS coordinates for ${name}: ${latitude}, ${longitude}`)
        errorCount++
        continue
      }

      if (!validateGPSCoordinates(latitude, longitude)) {
        console.warn(`⚠️  GPS coordinates outside South Africa for ${name}: ${latitude}, ${longitude}`)
        console.warn(`   Importing anyway...`)
      }

      // Check if site already exists by Site Code (used as postal code)
      const existing = await db.query.sites.findFirst({
        where: eq(sites.postalCode, siteCode),
      })

      if (existing) {
        console.log(`   ✓ Skipping existing: ${name} (${siteCode})`)
        skippedCount++
        continue
      }

      // Create site
      const slug = generateUniqueSlug(name, siteCode)
      const [site] = await db
        .insert(sites)
        .values({
          organizationId: ubuOrg.id,
          name,
          slug,
          description: 'KwaZulu-Natal community facility',
          address: name,
          city: 'KwaZulu-Natal',
          state: 'KwaZulu-Natal',
          country: 'ZA',
          postalCode: siteCode, // Use Site Code as postal code
          latitude,
          longitude,
          timezone: 'Africa/Johannesburg',
          nominalVoltage: 400, // 400V three-phase (SA standard)
          dailyConsumptionKwh: 80,
          batteryCapacityKwh: 100,
          solarCapacityKw: 30,
          status: 'active',
          installedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
          lastSeenAt: new Date(),
          config: {
            alertThresholds: {
              batteryLowPercent: 20,
              batteryHighTemp: 45,
              gridFrequencyMin: 49.5,
              gridFrequencyMax: 50.5,
              voltageMin: 380,
              voltageMax: 420,
            },
          },
        })
        .returning()

      // Create equipment
      await createSiteEquipment(site.id, site.name)

      console.log(`   ✅ Created: ${name} (${siteCode}) - Site ID: ${site.id}`)
      console.log(`      GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
      createdCount++
    } catch (error) {
      console.error(`   ❌ Error importing ${row.Name}:`, error)
      errorCount++
    }
  }

  // Step 5: Summary
  console.log('\n📊 Import Summary:')
  console.log(`   • Total sites in file: ${rows.length}`)
  console.log(`   • Created: ${createdCount}`)
  console.log(`   • Skipped (existing): ${skippedCount}`)
  console.log(`   • Errors: ${errorCount}`)
  console.log(`   • Organization: ${ubuOrg.name}`)
  console.log(`   • Equipment per site: 2x inverters, 1x battery, 1x solar array`)
  console.log(`   • Total equipment created: ${createdCount * 4}`)

  console.log('\n✨ UBU import completed successfully!\n')

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Import failed:', error)
  process.exit(1)
})
