'use server'

import { db } from '@/src/db'
import { equipment, sites, maintenanceRecords, alerts } from '@/src/db/schema'
import { eq, and, like, sql, desc, count } from 'drizzle-orm'

export async function getEquipmentList(filters: {
  search: string
  type: string
  status: string
  site: string
  sortBy: string
}) {
  try {
    const conditions = []

    if (filters.search) {
      conditions.push(
        sql`${equipment.name} ILIKE ${'%' + filters.search + '%'}`
      )
    }

    if (filters.type !== 'all') {
      conditions.push(eq(equipment.type, filters.type as 'inverter' | 'battery' | 'solar_panel' | 'charge_controller' | 'grid_meter'))
    }

    if (filters.status !== 'all') {
      conditions.push(eq(equipment.status, filters.status as 'operational' | 'degraded' | 'offline' | 'maintenance' | 'failed'))
    }

    if (filters.site !== 'all') {
      conditions.push(eq(equipment.siteId, parseInt(filters.site)))
    }

    const equipmentList = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        type: equipment.type,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        status: equipment.status,
        healthScore: equipment.healthScore,
        capacity: equipment.capacity,
        voltage: equipment.voltage,
        specs: equipment.specs,
        siteId: equipment.siteId,
        siteName: sites.name,
        nextMaintenanceAt: equipment.nextMaintenanceAt,
        lastMaintenanceAt: equipment.lastMaintenanceAt,
        installedAt: equipment.installedAt,
        warrantyExpiresAt: equipment.warrantyExpiresAt,
      })
      .from(equipment)
      .leftJoin(sites, eq(equipment.siteId, sites.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    // Sort
    let sorted = [...equipmentList]
    switch (filters.sortBy) {
      case 'health':
        sorted.sort((a, b) => (a.healthScore || 0) - (b.healthScore || 0))
        break
      case 'maintenance':
        sorted.sort((a, b) => {
          if (!a.nextMaintenanceAt) return 1
          if (!b.nextMaintenanceAt) return -1
          return new Date(a.nextMaintenanceAt).getTime() - new Date(b.nextMaintenanceAt).getTime()
        })
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'status':
        sorted.sort((a, b) => a.status.localeCompare(b.status))
        break
    }

    return {
      success: true,
      equipment: sorted,
    }
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return {
      success: false,
      error: 'Failed to fetch equipment',
      equipment: [],
    }
  }
}

export async function getEquipmentById(equipmentId: number) {
  try {
    const [item] = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        type: equipment.type,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        status: equipment.status,
        healthScore: equipment.healthScore,
        capacity: equipment.capacity,
        voltage: equipment.voltage,
        specs: equipment.specs,
        siteId: equipment.siteId,
        siteName: sites.name,
        installedAt: equipment.installedAt,
        lastMaintenanceAt: equipment.lastMaintenanceAt,
        nextMaintenanceAt: equipment.nextMaintenanceAt,
        warrantyExpiresAt: equipment.warrantyExpiresAt,
        createdAt: equipment.createdAt,
        updatedAt: equipment.updatedAt,
      })
      .from(equipment)
      .leftJoin(sites, eq(equipment.siteId, sites.id))
      .where(eq(equipment.id, equipmentId))
      .limit(1)

    if (!item) {
      return { success: false, error: 'Equipment not found' }
    }

    // Get maintenance history
    const maintenance = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.equipmentId, equipmentId))
      .orderBy(desc(maintenanceRecords.scheduledAt))
      .limit(10)

    // Get related alerts
    const relatedAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.equipmentId, equipmentId))
      .orderBy(desc(alerts.createdAt))
      .limit(5)

    return {
      success: true,
      equipment: item,
      maintenanceHistory: maintenance,
      relatedAlerts,
    }
  } catch (error) {
    console.error('Error fetching equipment details:', error)
    return { success: false, error: 'Failed to fetch equipment details' }
  }
}

export async function getSitesForFilter() {
  try {
    const sitesList = await db
      .select({
        id: sites.id,
        name: sites.name,
      })
      .from(sites)
      .orderBy(sites.name)

    return {
      success: true,
      sites: sitesList,
    }
  } catch (error) {
    console.error('Error fetching sites for filter:', error)
    return {
      success: false,
      sites: [],
    }
  }
}
