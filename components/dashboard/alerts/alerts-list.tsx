'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
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

interface AlertsListProps {
  alerts: Alert[]
  isLoading: boolean
  selectedAlerts: number[]
  onSelectAlert: (alertId: number) => void
  onSelectAll: () => void
  onAcknowledge: (alertId: number) => void
  onResolve: (alertId: number) => void
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    badgeClasses: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-400',
    iconClasses: 'text-red-600',
  },
  error: {
    icon: AlertTriangle,
    badgeClasses: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-400',
    iconClasses: 'text-orange-600',
  },
  warning: {
    icon: Info,
    badgeClasses: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400',
    iconClasses: 'text-yellow-600',
  },
  info: {
    icon: Info,
    badgeClasses: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-400',
    iconClasses: 'text-blue-600',
  },
}

const categoryConfig = {
  battery: { label: 'Battery', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400' },
  solar: { label: 'Solar', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400' },
  grid: { label: 'Grid', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400' },
  inverter: { label: 'Inverter', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400' },
  system: { label: 'System', color: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400' },
}

export function AlertsList({
  alerts,
  isLoading,
  selectedAlerts,
  onSelectAlert,
  onSelectAll,
  onAcknowledge,
  onResolve,
}: AlertsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-2">
            <Info className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-lg font-medium">No alerts found</p>
            <p className="text-sm text-muted-foreground">
              There are no alerts matching your current filters.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const allSelected = alerts.length > 0 && selectedAlerts.length === alerts.length

  return (
    <div className="space-y-4">
      {/* Select All Header */}
      <div className="flex items-center gap-2 px-1">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          aria-label="Select all alerts"
        />
        <span className="text-sm text-muted-foreground">
          {selectedAlerts.length > 0
            ? `${selectedAlerts.length} alert${selectedAlerts.length !== 1 ? 's' : ''} selected`
            : 'Select all'}
        </span>
      </div>

      {/* Alerts List */}
      {alerts.map((alert) => {
        const severityInfo = severityConfig[alert.severity]
        const SeverityIcon = severityInfo.icon
        const categoryInfo = categoryConfig[alert.category]
        const isSelected = selectedAlerts.includes(alert.id)

        // Check if actual value exceeded threshold
        const hasExceeded =
          alert.context?.actualValue !== undefined &&
          alert.context?.thresholdValue !== undefined &&
          alert.context.actualValue > alert.context.thresholdValue

        return (
          <Card key={alert.id} className={cn(isSelected && 'ring-2 ring-primary')}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelectAlert(alert.id)}
                  aria-label={`Select alert ${alert.title}`}
                  className="mt-1"
                />

                {/* Alert Content */}
                <div className="flex-1 space-y-3">
                  {/* Header with severity icon and badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <SeverityIcon
                      className={cn('h-5 w-5', severityInfo.iconClasses)}
                    />
                    <Badge variant="outline" className={severityInfo.badgeClasses}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={categoryInfo.color}>
                      {categoryInfo.label}
                    </Badge>
                    <Badge variant="outline">
                      {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Title and Message */}
                  <div>
                    <h3 className="font-semibold text-lg">{alert.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                  </div>

                  {/* Context Data (if available) */}
                  {alert.context?.actualValue !== undefined &&
                    alert.context?.thresholdValue !== undefined && (
                      <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted">
                        {hasExceeded ? (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        )}
                        <span>
                          <span className="font-medium">Actual:</span>{' '}
                          {alert.context.actualValue}
                          {alert.context.unit || ''} | <span className="font-medium">Threshold:</span>{' '}
                          {alert.context.thresholdValue}
                          {alert.context.unit || ''}
                        </span>
                      </div>
                    )}

                  {/* Site and Equipment Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{alert.siteName || 'Unknown Site'}</span>
                    </div>
                    {alert.equipmentName && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{alert.equipmentName}</span>
                      </div>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(alert.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {alert.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAcknowledge(alert.id)}
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onResolve(alert.id)}
                        >
                          Resolve
                        </Button>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <Button
                        size="sm"
                        onClick={() => onResolve(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                    {(alert.status === 'resolved' || alert.status === 'dismissed') && (
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
