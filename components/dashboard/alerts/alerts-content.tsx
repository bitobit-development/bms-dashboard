'use client'

import { useState, useCallback, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeData } from '@/hooks/use-realtime-data'
import {
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
  acknowledgeBulkAlerts,
  resolveBulkAlerts,
} from '@/app/actions/alerts-actions'
import { AlertsStats } from './alerts-stats'
import { AlertsFilters } from './alerts-filters'
import { AlertsList } from './alerts-list'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Alert {
  id: number
  severity: 'critical' | 'error' | 'warning' | 'info'
  category: 'battery' | 'solar' | 'grid' | 'inverter' | 'system' | 'maintenance'
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  code: string
  title: string
  message: string
  context: {
    thresholdValue?: number
    actualValue?: number
    unit?: string
    telemetryId?: number
  } | null
  siteId: number
  siteName: string | null
  equipmentId: number | null
  equipmentName: string | null
  createdAt: Date
  acknowledgedAt: Date | null
  acknowledgedBy: string | null
  resolvedAt: Date | null
  resolvedBy: string | null
}

interface AlertStats {
  critical: number
  error: number
  warning: number
  resolved24h: number
}

export function AlertsContent() {
  const [filters, setFilters] = useState({
    severity: 'all',
    category: 'all',
    status: 'all',
    site: 'all',
  })
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([])

  const fetchAlerts = useCallback(async () => {
    const result = await getAlerts(filters)
    return result
  }, [filters])

  const { data, isLoading, error, lastUpdated, refresh } = useRealtimeData<{
    success: boolean
    alerts: Alert[]
    stats: AlertStats
    error?: string
  }>(fetchAlerts, 30000) // 30-second refresh for alerts

  const handleRefresh = () => {
    refresh()
    setSelectedAlerts([]) // Clear selection on refresh
  }

  // Handle single alert actions
  const handleAcknowledge = async (alertId: number) => {
    const result = await acknowledgeAlert(alertId)
    if (result.success) {
      toast.success('Alert acknowledged')
      refresh()
    } else {
      toast.error('Failed to acknowledge alert')
    }
  }

  const handleResolve = async (alertId: number) => {
    const result = await resolveAlert(alertId)
    if (result.success) {
      toast.success('Alert resolved')
      refresh()
    } else {
      toast.error('Failed to resolve alert')
    }
  }

  // Handle bulk actions
  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.length === 0) return

    const result = await acknowledgeBulkAlerts(selectedAlerts)
    if (result.success) {
      toast.success(`${selectedAlerts.length} alert${selectedAlerts.length !== 1 ? 's' : ''} acknowledged`)
      setSelectedAlerts([])
      refresh()
    } else {
      toast.error('Failed to acknowledge alerts')
    }
  }

  const handleBulkResolve = async () => {
    if (selectedAlerts.length === 0) return

    const result = await resolveBulkAlerts(selectedAlerts)
    if (result.success) {
      toast.success(`${selectedAlerts.length} alert${selectedAlerts.length !== 1 ? 's' : ''} resolved`)
      setSelectedAlerts([])
      refresh()
    } else {
      toast.error('Failed to resolve alerts')
    }
  }

  // Handle alert selection
  const handleSelectAlert = (alertId: number) => {
    setSelectedAlerts((prev) =>
      prev.includes(alertId)
        ? prev.filter((id) => id !== alertId)
        : [...prev, alertId]
    )
  }

  const handleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([])
    } else {
      setSelectedAlerts(alerts.map((alert) => alert.id))
    }
  }

  const handleClearSelection = () => {
    setSelectedAlerts([])
  }

  if (error) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-500">Failed to load alerts</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  const alerts = data?.alerts || []
  const stats = data?.stats || null

  // Get unique sites for filter dropdown
  const sites = useMemo(() => {
    const uniqueSites = new Map<number, string>()
    alerts.forEach((alert) => {
      if (alert.siteId && alert.siteName) {
        uniqueSites.set(alert.siteId, alert.siteName)
      }
    })
    return Array.from(uniqueSites.entries()).map(([id, name]) => ({
      id,
      name,
    }))
  }, [alerts])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <AlertsStats stats={stats} isLoading={isLoading} />

      {/* Filters and Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <AlertsFilters filters={filters} sites={sites} onFiltersChange={setFilters} />

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {/* Last Updated */}
      {lastUpdated && !isLoading && (
        <div className="text-sm text-muted-foreground">
          Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedAlerts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm font-medium">
              {selectedAlerts.length} alert{selectedAlerts.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleBulkAcknowledge}>
                Acknowledge Selected
              </Button>
              <Button size="sm" onClick={handleBulkResolve}>
                Resolve Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClearSelection}>
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Alerts List */}
      <AlertsList
        alerts={alerts}
        isLoading={isLoading}
        selectedAlerts={selectedAlerts}
        onSelectAlert={handleSelectAlert}
        onSelectAll={handleSelectAll}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
      />

      {/* Results Count */}
      {!isLoading && alerts.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
