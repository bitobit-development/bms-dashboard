'use server'

import { db } from '@/src/db'
import { alerts, sites, equipment } from '@/src/db/schema'
import { eq, and, desc, sql, count, gte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getAlerts(filters: {
  severity: string
  category: string
  status: string
  site: string
}) {
  try {
    const conditions = []

    if (filters.severity !== 'all') {
      conditions.push(eq(alerts.severity, filters.severity))
    }

    if (filters.category !== 'all') {
      conditions.push(eq(alerts.category, filters.category))
    }

    if (filters.status !== 'all') {
      conditions.push(eq(alerts.status, filters.status))
    }

    if (filters.site !== 'all') {
      conditions.push(eq(alerts.siteId, parseInt(filters.site)))
    }

    const alertsList = await db
      .select({
        id: alerts.id,
        severity: alerts.severity,
        category: alerts.category,
        status: alerts.status,
        code: alerts.code,
        title: alerts.title,
        message: alerts.message,
        context: alerts.context,
        siteId: alerts.siteId,
        siteName: sites.name,
        equipmentId: alerts.equipmentId,
        equipmentName: equipment.name,
        createdAt: alerts.createdAt,
        acknowledgedAt: alerts.acknowledgedAt,
        acknowledgedBy: alerts.acknowledgedBy,
        resolvedAt: alerts.resolvedAt,
        resolvedBy: alerts.resolvedBy,
      })
      .from(alerts)
      .leftJoin(sites, eq(alerts.siteId, sites.id))
      .leftJoin(equipment, eq(alerts.equipmentId, equipment.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alerts.createdAt))
      .limit(100)

    // Get stats
    const [criticalCount] = await db
      .select({ count: count() })
      .from(alerts)
      .where(
        and(
          eq(alerts.severity, 'critical'),
          eq(alerts.status, 'active')
        )
      )

    const [errorCount] = await db
      .select({ count: count() })
      .from(alerts)
      .where(
        and(
          eq(alerts.severity, 'error'),
          eq(alerts.status, 'active')
        )
      )

    const [warningCount] = await db
      .select({ count: count() })
      .from(alerts)
      .where(
        and(
          eq(alerts.severity, 'warning'),
          eq(alerts.status, 'active')
        )
      )

    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const [resolved24h] = await db
      .select({ count: count() })
      .from(alerts)
      .where(
        and(
          eq(alerts.status, 'resolved'),
          gte(alerts.resolvedAt, oneDayAgo)
        )
      )

    return {
      success: true,
      alerts: alertsList,
      stats: {
        critical: criticalCount?.count || 0,
        error: errorCount?.count || 0,
        warning: warningCount?.count || 0,
        resolved24h: resolved24h?.count || 0,
      },
    }
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return {
      success: false,
      error: 'Failed to fetch alerts',
      alerts: [],
      stats: { critical: 0, error: 0, warning: 0, resolved24h: 0 },
    }
  }
}

export async function acknowledgeAlert(alertId: number, userId: string = 'system') {
  try {
    await db
      .update(alerts)
      .set({
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      })
      .where(eq(alerts.id, alertId))

    revalidatePath('/dashboard/alerts')
    return { success: true }
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    return { success: false, error: 'Failed to acknowledge alert' }
  }
}

export async function resolveAlert(alertId: number, userId: string = 'system') {
  try {
    await db
      .update(alerts)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: userId,
      })
      .where(eq(alerts.id, alertId))

    revalidatePath('/dashboard/alerts')
    return { success: true }
  } catch (error) {
    console.error('Error resolving alert:', error)
    return { success: false, error: 'Failed to resolve alert' }
  }
}

export async function dismissAlert(alertId: number, userId: string = 'system') {
  try {
    await db
      .update(alerts)
      .set({
        status: 'dismissed',
      })
      .where(eq(alerts.id, alertId))

    revalidatePath('/dashboard/alerts')
    return { success: true }
  } catch (error) {
    console.error('Error dismissing alert:', error)
    return { success: false, error: 'Failed to dismiss alert' }
  }
}

export async function acknowledgeBulkAlerts(alertIds: number[], userId: string = 'system') {
  try {
    for (const alertId of alertIds) {
      await db
        .update(alerts)
        .set({
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        })
        .where(eq(alerts.id, alertId))
    }

    revalidatePath('/dashboard/alerts')
    return { success: true }
  } catch (error) {
    console.error('Error acknowledging bulk alerts:', error)
    return { success: false, error: 'Failed to acknowledge alerts' }
  }
}

export async function resolveBulkAlerts(alertIds: number[], userId: string = 'system') {
  try {
    for (const alertId of alertIds) {
      await db
        .update(alerts)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: userId,
        })
        .where(eq(alerts.id, alertId))
    }

    revalidatePath('/dashboard/alerts')
    return { success: true }
  } catch (error) {
    console.error('Error resolving bulk alerts:', error)
    return { success: false, error: 'Failed to resolve alerts' }
  }
}
