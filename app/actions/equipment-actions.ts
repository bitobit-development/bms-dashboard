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

export async function createEquipment(data: {
  siteId: number
  type: 'inverter' | 'battery' | 'solar_panel' | 'charge_controller' | 'grid_meter'
  name: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  capacity?: number
  voltage?: number
  specs?: Record<string, any>
  status?: 'operational' | 'degraded' | 'maintenance' | 'failed' | 'offline'
  healthScore?: number
  installedAt?: Date
  warrantyExpiresAt?: Date
}) {
  try {
    // TODO: Add authentication and authorization checks
    // const user = await stackServerApp.getUser()
    // if (!user) return { success: false, error: 'Not authenticated' }

    const [newEquipment] = await db
      .insert(equipment)
      .values({
        siteId: data.siteId,
        type: data.type,
        name: data.name,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        capacity: data.capacity || null,
        voltage: data.voltage || null,
        specs: data.specs || {},
        status: data.status || 'operational',
        healthScore: data.healthScore || null,
        installedAt: data.installedAt || null,
        warrantyExpiresAt: data.warrantyExpiresAt || null,
      })
      .returning()

    return {
      success: true,
      equipment: newEquipment,
    }
  } catch (error) {
    console.error('Error creating equipment:', error)
    return {
      success: false,
      error: 'Failed to create equipment',
    }
  }
}

export async function updateEquipment(
  equipmentId: number,
  data: {
    name?: string
    manufacturer?: string
    model?: string
    serialNumber?: string
    capacity?: number
    voltage?: number
    specs?: Record<string, any>
    status?: 'operational' | 'degraded' | 'maintenance' | 'failed' | 'offline'
    healthScore?: number
    installedAt?: Date
    lastMaintenanceAt?: Date
    nextMaintenanceAt?: Date
    warrantyExpiresAt?: Date
  }
) {
  try {
    // TODO: Add authentication and authorization checks
    // const user = await stackServerApp.getUser()
    // if (!user) return { success: false, error: 'Not authenticated' }

    const [updatedEquipment] = await db
      .update(equipment)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(equipment.id, equipmentId))
      .returning()

    if (!updatedEquipment) {
      return { success: false, error: 'Equipment not found' }
    }

    return {
      success: true,
      equipment: updatedEquipment,
    }
  } catch (error) {
    console.error('Error updating equipment:', error)
    return {
      success: false,
      error: 'Failed to update equipment',
    }
  }
}

export async function deleteEquipment(equipmentId: number) {
  try {
    // TODO: Add authentication and authorization checks
    // const user = await stackServerApp.getUser()
    // if (!user) return { success: false, error: 'Not authenticated' }

    await db.delete(equipment).where(eq(equipment.id, equipmentId))

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting equipment:', error)
    return {
      success: false,
      error: 'Failed to delete equipment',
    }
  }
}
