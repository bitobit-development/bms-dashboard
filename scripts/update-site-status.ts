/**
 * Update Site Statuses Based on Excel Report
 *
 * Updates site status flags based on the Harry Gwala Excel report:
 * - "SITE IS UP" → status='active'
 * - "SITE HAS ISSUES" → status='maintenance'
 * - "SITE DOWN" → status='offline'
 */

import { db } from '../src/db'
import { sites } from '../src/db/schema'
import { sql } from 'drizzle-orm'

interface SiteStatus {
  name: string
  status: 'active' | 'maintenance' | 'offline'
  code?: string
}

// Sites marked as "SITE IS UP" in Excel (26 sites)
const ACTIVE_SITES = [
  'Bethlehem Community Hall',
  'Nkumba Community Hall',
  'Underburg Taxi Rank',
  'Bulwer Community Service Centre',
  'Macabazini Community Hall',
  'Lubovana Community Hall',
  'Ridge Community Hall',
  'Junction Community Hall',
  'Cabazi Hall',
  'Umzimkhulu Library',
  'Rietvlei Taxi Rank',
  'Nomandlovu Community Hall',
  'Mahhehle Hall',
  'Madungeni Hall',
  'Bazini Community Hall',
  'Hlobani Tourist Centre',
  'Ndodeni Community Hall',
  'Khukhulela Community Hall',
  'Isibonelo Esihle Community Hall',
  'Gala Community Hall',
  'Masameni Community Hall',
  'Umzimkhulu Municipality (Emakhosini Building)',
  'Xosheyakhe Community Hall',
  'Mkhazini Community Hall',
  'Riverside Community Hall',
  'Ibisi Library',
]

// Sites marked as "SITE HAS ISSUES" in Excel (12 sites)
const MAINTENANCE_SITES = [
  'Drayini Community Hall',
  'Clydesdale Community Hall',
  'Thuleshe Hall',
  'Mpithini Community Hall',
  'Mziki Hall',
  'SMME Facility',
  'Hlafuna Community Hall',
  'Sheshe Community Hall',
  'Thumosong Centre (High Flats)',
  'Amazabeko Community Hall',
  'Hlobani Tourist Centre',
  'Ngunjini Community Hall',
]

async function updateSiteStatus(siteName: string, status: 'active' | 'maintenance' | 'offline'): Promise<boolean> {
  // Try case-insensitive match
  const result = await db
    .update(sites)
    .set({ status, updatedAt: new Date() })
    .where(sql`LOWER(${sites.name}) = LOWER(${siteName})`)
    .returning({ id: sites.id, name: sites.name })

  if (result.length > 0) {
    return true
  }

  // Try fuzzy match (contains)
  const fuzzyResult = await db
    .update(sites)
    .set({ status, updatedAt: new Date() })
    .where(sql`LOWER(${sites.name}) LIKE ${`%${siteName.toLowerCase()}%`}`)
    .returning({ id: sites.id, name: sites.name })

  return fuzzyResult.length > 0
}

async function main() {
  console.log('🔄 Updating site statuses based on Excel report...\n')

  let activeUpdated = 0
  let activeFailed = 0
  let maintenanceUpdated = 0
  let maintenanceFailed = 0
  let offlineUpdated = 0

  // Update active sites
  console.log('='.repeat(80))
  console.log('Updating ACTIVE sites (SITE IS UP)')
  console.log('='.repeat(80))
  for (const siteName of ACTIVE_SITES) {
    const success = await updateSiteStatus(siteName, 'active')
    if (success) {
      console.log(`✅ ${siteName} → active`)
      activeUpdated++
    } else {
      console.log(`⚠️  ${siteName} → not found`)
      activeFailed++
    }
  }

  // Update maintenance sites
  console.log('\n' + '='.repeat(80))
  console.log('Updating MAINTENANCE sites (SITE HAS ISSUES)')
  console.log('='.repeat(80))
  for (const siteName of MAINTENANCE_SITES) {
    const success = await updateSiteStatus(siteName, 'maintenance')
    if (success) {
      console.log(`✅ ${siteName} → maintenance`)
      maintenanceUpdated++
    } else {
      console.log(`⚠️  ${siteName} → not found`)
      maintenanceFailed++
    }
  }

  // Update all remaining sites to offline
  console.log('\n' + '='.repeat(80))
  console.log('Updating remaining sites to OFFLINE (SITE DOWN)')
  console.log('='.repeat(80))

  // Get all sites not in active or maintenance lists
  const activeLowercase = ACTIVE_SITES.map(s => s.toLowerCase())
  const maintenanceLowercase = MAINTENANCE_SITES.map(s => s.toLowerCase())

  const allSites = await db.select({ id: sites.id, name: sites.name, status: sites.status }).from(sites)

  for (const site of allSites) {
    const siteLower = site.name.toLowerCase()
    const isActiveOrMaintenance =
      activeLowercase.some(a => siteLower.includes(a.toLowerCase()) || a.toLowerCase().includes(siteLower)) ||
      maintenanceLowercase.some(m => siteLower.includes(m.toLowerCase()) || m.toLowerCase().includes(siteLower))

    if (!isActiveOrMaintenance && site.status !== 'offline') {
      await db.update(sites).set({ status: 'offline', updatedAt: new Date() }).where(sql`id = ${site.id}`)
      console.log(`🔴 ${site.name} → offline`)
      offlineUpdated++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('UPDATE SUMMARY')
  console.log('='.repeat(80))
  console.log(`✅ Active sites updated: ${activeUpdated}`)
  console.log(`⚠️  Active sites not found: ${activeFailed}`)
  console.log(`✅ Maintenance sites updated: ${maintenanceUpdated}`)
  console.log(`⚠️  Maintenance sites not found: ${maintenanceFailed}`)
  console.log(`🔴 Offline sites updated: ${offlineUpdated}`)
  console.log('='.repeat(80))

  console.log('\n✅ Site status update completed!')

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Error updating site statuses:', error)
  process.exit(1)
})
