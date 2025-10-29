'use client'

import { AlertCircle, CheckCircle, Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { Alert } from '@/src/db/schema'

type SiteAlertsProps = {
  siteId: number
  alerts: Alert[]
}

const getSeverityVariant = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'destructive'
    case 'error':
      return 'destructive'
    case 'warning':
      return 'secondary'
    case 'info':
      return 'outline'
    default:
      return 'outline'
  }
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
    case 'error':
    case 'warning':
      return <AlertCircle className="h-4 w-4" />
    case 'info':
      return <CheckCircle className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

export const SiteAlerts = ({ siteId, alerts }: SiteAlertsProps) => {
  const handleAcknowledge = (alertId: number) => {
    // TODO: Implement acknowledge alert action
    console.log('Acknowledge alert:', alertId)
  }

  const handleResolve = (alertId: number) => {
    // TODO: Implement resolve alert action
    console.log('Resolve alert:', alertId)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Alerts</CardTitle>
          {alerts.length > 0 && (
            <Badge variant="destructive">{alerts.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
              >
                {/* Alert Header */}
                <div className="flex items-start gap-2">
                  <Badge variant={getSeverityVariant(alert.severity)} className="mt-0.5">
                    {getSeverityIcon(alert.severity)}
                    <span className="ml-1 capitalize">{alert.severity}</span>
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{alert.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {alert.message}
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-accent transition-colors"
                    title="Acknowledge"
                  >
                    <Check className="h-3 w-3" />
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-accent transition-colors"
                    title="Resolve"
                  >
                    <X className="h-3 w-3" />
                    Resolve
                  </button>
                </div>
              </div>
            ))}

            {/* View All Link */}
            <Link
              href={`/dashboard/sites/${siteId}/alerts`}
              className="block text-center text-sm text-primary hover:underline mt-4"
            >
              View all alerts
            </Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No active alerts</p>
            <p className="text-xs text-muted-foreground mt-1">
              All systems are operating normally
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
