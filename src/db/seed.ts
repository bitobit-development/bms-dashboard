/**
 * Database Seed Script
 *
 * Populates the database with realistic test data for development and testing.
 *
 * Usage:
 *   pnpm db:seed
 *
 * Features:
 * - Idempotent (safe to run multiple times)
 * - Creates complete test environment
 * - Realistic data patterns based on time of day
 */

import { db } from './index'
import {
  organizations,
  sites,
  equipment,
  telemetryReadings,
  alerts,
  events,
  organizationUsers,
} from './schema'
import { eq, and } from 'drizzle-orm'

// Helper to generate realistic battery voltage (495-505V for 500V nominal)
const generateBatteryVoltage = (chargeLevel: number): number => {
  return 480 + (chargeLevel / 100) * 25 // 480V at 0%, 505V at 100%
}

// Helper to generate solar power based on time of day
const generateSolarPower = (hour: number, capacity: number): number => {
  if (hour < 6 || hour > 18) return 0 // No solar at night

  // Peak at noon, falloff in morning/evening
  const normalizedHour = hour - 12 // -6 to +6
  const efficiency = Math.max(0, 1 - Math.abs(normalizedHour) / 8)
  const cloudVariation = 0.85 + Math.random() * 0.15 // 85-100% of potential

  return capacity * efficiency * cloudVariation
}

// Helper to generate load power based on time of day and site type
const generateLoadPower = (hour: number, dailyConsumption: number, siteType: 'residential' | 'commercial' | 'industrial'): number => {
  const hourlyAvg = dailyConsumption / 24

  if (siteType === 'residential') {
    // Higher in morning (7-9) and evening (18-22)
    if (hour >= 7 && hour <= 9) return hourlyAvg * 1.5
    if (hour >= 18 && hour <= 22) return hourlyAvg * 1.8
    if (hour >= 0 && hour <= 6) return hourlyAvg * 0.5
    return hourlyAvg
  } else if (siteType === 'commercial') {
    // Higher during business hours (8-18)
    if (hour >= 8 && hour <= 18) return hourlyAvg * 1.4
    return hourlyAvg * 0.6
  } else {
    // Industrial: consistent with peak during day shift (6-14)
    if (hour >= 6 && hour <= 14) return hourlyAvg * 1.3
    if (hour >= 14 && hour <= 22) return hourlyAvg * 1.1
    return hourlyAvg * 0.8
  }
}

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Step 1: Create organization (idempotent)
  console.log('📦 Creating organization...')
  const [org] = await db
    .insert(organizations)
    .values({
      name: 'Demo BMS Company',
      slug: 'demo-bms',
      email: 'contact@demobms.com',
      phone: '+1-555-0100',
      address: '123 Energy Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      postalCode: '94102',
      status: 'active',
      subscriptionTier: 'professional',
      settings: {
        timezone: 'America/Los_Angeles',
        alertEmail: ['alerts@demobms.com'],
        dataRetentionDays: 365,
      },
    })
    .onConflictDoUpdate({
      target: organizations.slug,
      set: {
        updatedAt: new Date(),
      },
    })
    .returning()

  console.log(`✅ Organization: ${org.name} (ID: ${org.id})`)

  // Step 2: Create sites
  console.log('\n🏢 Creating sites...')
  const siteConfigs = [
    {
      name: 'Residential Backup System',
      slug: 'residential-backup',
      description: 'Home solar + battery backup system',
      address: '456 Oak Avenue',
      city: 'Palo Alto',
      state: 'CA',
      timezone: 'America/Los_Angeles',
      nominalVoltage: 500,
      dailyConsumptionKwh: 60,
      batteryCapacityKwh: 40,
      solarCapacityKw: 15,
      type: 'residential' as const,
    },
    {
      name: 'Small Commercial Site',
      slug: 'commercial-site',
      description: 'Small business solar installation',
      address: '789 Market Street',
      city: 'San Jose',
      state: 'CA',
      timezone: 'America/Los_Angeles',
      nominalVoltage: 500,
      dailyConsumptionKwh: 70,
      batteryCapacityKwh: 50,
      solarCapacityKw: 20,
      type: 'commercial' as const,
    },
    {
      name: 'Industrial Facility',
      slug: 'industrial-facility',
      description: 'Large industrial solar + storage',
      address: '321 Industrial Blvd',
      city: 'Oakland',
      state: 'CA',
      timezone: 'America/Los_Angeles',
      nominalVoltage: 500,
      dailyConsumptionKwh: 65,
      batteryCapacityKwh: 60,
      solarCapacityKw: 25,
      type: 'industrial' as const,
    },
  ]

  const createdSites = []
  for (const config of siteConfigs) {
    // Check if site exists first
    const existingSite = await db.query.sites.findFirst({
      where: eq(sites.slug, config.slug),
    })

    let site
    if (existingSite) {
      // Update existing site
      const [updatedSite] = await db
        .update(sites)
        .set({
          updatedAt: new Date(),
          lastSeenAt: new Date(),
        })
        .where(eq(sites.id, existingSite.id))
        .returning()
      site = updatedSite
    } else {
      // Insert new site
      const [newSite] = await db
        .insert(sites)
        .values({
          organizationId: org.id,
          name: config.name,
          slug: config.slug,
          description: config.description,
          address: config.address,
          city: config.city,
          state: config.state,
          country: 'US',
          timezone: config.timezone,
          nominalVoltage: config.nominalVoltage,
          dailyConsumptionKwh: config.dailyConsumptionKwh,
          batteryCapacityKwh: config.batteryCapacityKwh,
          solarCapacityKw: config.solarCapacityKw,
          status: 'active',
          installedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
          lastSeenAt: new Date(),
          config: {
            alertThresholds: {
              batteryLowPercent: 20,
              batteryHighTemp: 45,
              gridFrequencyMin: 59.5,
              gridFrequencyMax: 60.5,
              voltageMin: 475,
              voltageMax: 525,
            },
          },
        })
        .returning()
      site = newSite
    }

    createdSites.push({ ...site, type: config.type })
    console.log(`  ✅ ${site.name} (ID: ${site.id})`)
  }

  // Step 3: Create equipment for each site
  console.log('\n⚡ Creating equipment...')
  for (const site of createdSites) {
    // Delete existing equipment for this site to avoid duplicates
    await db.delete(equipment).where(eq(equipment.siteId, site.id))

    const equipmentItems = [
      // Inverter 1
      {
        siteId: site.id,
        type: 'inverter' as const,
        name: 'Inverter 1',
        manufacturer: 'SolarEdge',
        model: 'SE100K',
        serialNumber: `INV1-${site.id}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        capacity: 100,
        voltage: 500,
        status: 'operational' as const,
        healthScore: 95 + Math.random() * 5,
        installedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        specs: { maxPower: 100, efficiency: 98, warrantyYears: 10 },
      },
      // Inverter 2
      {
        siteId: site.id,
        type: 'inverter' as const,
        name: 'Inverter 2',
        manufacturer: 'SolarEdge',
        model: 'SE100K',
        serialNumber: `INV2-${site.id}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        capacity: 100,
        voltage: 500,
        status: 'operational' as const,
        healthScore: 94 + Math.random() * 6,
        installedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        specs: { maxPower: 100, efficiency: 98, warrantyYears: 10 },
      },
      // Battery
      {
        siteId: site.id,
        type: 'battery' as const,
        name: 'Battery Bank',
        manufacturer: 'Tesla',
        model: 'Powerpack',
        serialNumber: `BAT-${site.id}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        capacity: site.batteryCapacityKwh,
        voltage: 500,
        status: 'operational' as const,
        healthScore: 98,
        installedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        specs: { maxPower: site.batteryCapacityKwh!, efficiency: 95, warrantyYears: 10 },
      },
      // Solar panels
      {
        siteId: site.id,
        type: 'solar_panel' as const,
        name: 'Solar Array',
        manufacturer: 'SunPower',
        model: 'Maxeon 3',
        serialNumber: `SOLAR-${site.id}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        capacity: site.solarCapacityKw,
        voltage: 520,
        status: 'operational' as const,
        healthScore: 97,
        installedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        specs: { maxPower: site.solarCapacityKw!, efficiency: 22, warrantyYears: 25 },
      },
    ]

    await db.insert(equipment).values(equipmentItems)
    console.log(`  ✅ Created equipment for ${site.name}`)
  }

  // Step 4: Generate telemetry data for last 24 hours (5-minute intervals)
  console.log('\n📊 Generating telemetry data (last 24 hours)...')
  const now = new Date()
  const intervals = 288 // 24 hours * 12 (5-minute intervals per hour)

  for (const site of createdSites) {
    console.log(`  🔄 Generating data for ${site.name}...`)

    // Delete existing telemetry for this site to avoid duplicates
    await db.delete(telemetryReadings).where(eq(telemetryReadings.siteId, site.id))

    const readings = []
    let batteryChargeLevel = 85 // Start at 85%

    for (let i = intervals - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000)
      const hour = timestamp.getHours()

      // Calculate solar generation
      const solarPower = generateSolarPower(hour, site.solarCapacityKw!)

      // Calculate load
      const loadPower = generateLoadPower(hour, site.dailyConsumptionKwh!, site.type)

      // Calculate battery behavior
      const netPower = solarPower - loadPower
      const batteryPower = -netPower // Negative = discharging, positive = charging

      // Update battery charge level (simplified)
      const chargeChange = (batteryPower / site.batteryCapacityKwh!) * (5 / 60) * 100
      batteryChargeLevel = Math.max(20, Math.min(100, batteryChargeLevel + chargeChange))

      // Grid power (import when needed)
      const gridPower = netPower < 0 && batteryChargeLevel <= 25 ? Math.abs(netPower) : 0

      // Inverter distribution (split solar power)
      const inverter1Power = solarPower * 0.48
      const inverter2Power = solarPower * 0.52

      readings.push({
        siteId: site.id,
        timestamp,
        batteryVoltage: generateBatteryVoltage(batteryChargeLevel),
        batteryCurrent: (batteryPower / 500) * 1000, // Convert kW to Amps
        batteryChargeLevel,
        batteryTemperature: 25 + Math.random() * 5,
        batteryStateOfHealth: 98,
        batteryPowerKw: batteryPower,
        solarPowerKw: solarPower,
        solarEnergyKwh: solarPower * (5 / 60),
        solarEfficiency: solarPower > 0 ? 90 + Math.random() * 10 : null,
        inverter1PowerKw: inverter1Power,
        inverter1Efficiency: inverter1Power > 0 ? 96 + Math.random() * 2 : null,
        inverter1Temperature: inverter1Power > 0 ? 35 + Math.random() * 10 : 25,
        inverter2PowerKw: inverter2Power,
        inverter2Efficiency: inverter2Power > 0 ? 96 + Math.random() * 2 : null,
        inverter2Temperature: inverter2Power > 0 ? 35 + Math.random() * 10 : 25,
        gridVoltage: 240,
        gridFrequency: 60,
        gridPowerKw: gridPower,
        gridEnergyKwh: gridPower * (5 / 60),
        loadPowerKw: loadPower,
        loadEnergyKwh: loadPower * (5 / 60),
      })
    }

    // Insert in batches of 50
    const batchSize = 50
    for (let i = 0; i < readings.length; i += batchSize) {
      const batch = readings.slice(i, i + batchSize)
      await db.insert(telemetryReadings).values(batch)
    }

    console.log(`  ✅ Generated ${readings.length} telemetry readings`)
  }

  // Step 5: Create sample alerts
  console.log('\n🚨 Creating sample alerts...')

  // Delete existing alerts
  for (const site of createdSites) {
    await db.delete(alerts).where(eq(alerts.siteId, site.id))
  }

  const sampleAlerts = [
    {
      siteId: createdSites[0].id,
      severity: 'warning' as const,
      category: 'battery' as const,
      code: 'BATTERY_LOW',
      title: 'Battery Charge Low',
      message: 'Battery charge level has dropped below 25%',
      status: 'active' as const,
      context: { thresholdValue: 25, actualValue: 22, unit: '%' },
    },
    {
      siteId: createdSites[1].id,
      severity: 'info' as const,
      category: 'maintenance' as const,
      code: 'MAINTENANCE_DUE',
      title: 'Maintenance Due',
      message: 'Quarterly inverter inspection is due',
      status: 'acknowledged' as const,
      acknowledgedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      acknowledgedBy: 'admin@demobms.com',
      context: { equipmentType: 'inverter', lastMaintenance: '2024-07-29' },
    },
    {
      siteId: createdSites[2].id,
      severity: 'error' as const,
      category: 'grid' as const,
      code: 'GRID_FREQUENCY_HIGH',
      title: 'Grid Frequency Out of Range',
      message: 'Grid frequency exceeded upper threshold',
      status: 'resolved' as const,
      resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      resolvedBy: 'system',
      context: { thresholdValue: 60.5, actualValue: 60.7, unit: 'Hz' },
    },
  ]

  await db.insert(alerts).values(sampleAlerts)
  console.log(`✅ Created ${sampleAlerts.length} sample alerts`)

  // Step 6: Create sample events
  console.log('\n📝 Creating sample events...')

  // Delete existing events
  for (const site of createdSites) {
    await db.delete(events).where(eq(events.siteId, site.id))
  }

  const sampleEvents = [
    {
      siteId: createdSites[0].id,
      type: 'site_online' as const,
      title: 'Site came online',
      description: 'System startup after maintenance',
      actorType: 'system' as const,
      actorId: 'bms-controller',
      context: { uptime: 0 },
    },
    {
      siteId: createdSites[1].id,
      type: 'configuration_changed' as const,
      title: 'Alert thresholds updated',
      description: 'Battery low threshold changed from 20% to 25%',
      actorType: 'user' as const,
      actorId: 'admin@demobms.com',
      context: {
        changesBefore: { batteryLowPercent: 20 },
        changesAfter: { batteryLowPercent: 25 },
      },
    },
    {
      siteId: createdSites[2].id,
      type: 'maintenance_completed' as const,
      title: 'Scheduled maintenance completed',
      description: 'Quarterly inverter inspection and cleaning',
      actorType: 'user' as const,
      actorId: 'tech@demobms.com',
      context: { maintenanceType: 'preventive', duration: '2 hours' },
    },
  ]

  await db.insert(events).values(sampleEvents)
  console.log(`✅ Created ${sampleEvents.length} sample events`)

  // Step 7: Create organization users
  console.log('\n👥 Creating organization users...')

  // Delete existing users for this org
  await db.delete(organizationUsers).where(eq(organizationUsers.organizationId, org.id))

  const users = [
    {
      organizationId: org.id,
      stackUserId: 'stack_user_admin_123',
      email: 'admin@demobms.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin' as const,
      status: 'active' as const,
      lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastActiveAt: new Date(),
      acceptedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      preferences: {
        timezone: 'America/Los_Angeles',
        notifications: { email: true, sms: true },
      },
    },
    {
      organizationId: org.id,
      stackUserId: 'stack_user_operator_456',
      email: 'operator@demobms.com',
      firstName: 'John',
      lastName: 'Operator',
      role: 'operator' as const,
      status: 'active' as const,
      lastLoginAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      lastActiveAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      preferences: {
        timezone: 'America/Los_Angeles',
        notifications: { email: true },
      },
    },
  ]

  await db.insert(organizationUsers).values(users)
  console.log(`✅ Created ${users.length} organization users`)

  console.log('\n✨ Seed completed successfully!\n')
  console.log('Summary:')
  console.log(`  • 1 organization`)
  console.log(`  • ${createdSites.length} sites`)
  console.log(`  • ${createdSites.length * 4} equipment items`)
  console.log(`  • ${createdSites.length * intervals} telemetry readings`)
  console.log(`  • ${sampleAlerts.length} alerts`)
  console.log(`  • ${sampleEvents.length} events`)
  console.log(`  • ${users.length} users`)
  console.log('\nYou can now run: pnpm db:studio')
  console.log('Or test the API: POST /api/telemetry\n')

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Seed failed:', error)
  process.exit(1)
})
