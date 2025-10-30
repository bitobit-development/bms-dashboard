'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow, format } from 'date-fns'
import {
  CheckCircle,
  XCircle,
  Shield,
  UserPlus,
  Ban,
  PlayCircle,
  Trash2,
} from 'lucide-react'
import type { UserAuditLog } from '@/src/db/schema/user-audit-log'

interface AuditLogViewerProps {
  logs: UserAuditLog[]
  maxHeight?: string
}

export function AuditLogViewer({ logs, maxHeight = '500px' }: AuditLogViewerProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return CheckCircle
      case 'reject':
        return XCircle
      case 'role_change':
        return Shield
      case 'invite':
        return UserPlus
      case 'suspend':
        return Ban
      case 'activate':
        return PlayCircle
      case 'delete':
        return Trash2
      default:
        return Shield
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve':
      case 'activate':
        return 'text-green-600 bg-green-50'
      case 'reject':
      case 'suspend':
      case 'delete':
        return 'text-red-600 bg-red-50'
      case 'role_change':
        return 'text-blue-600 bg-blue-50'
      case 'invite':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getActionLabel = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatDetails = (log: UserAuditLog) => {
    const details = log.details as any
    if (!details) return null

    switch (log.action) {
      case 'approve':
        return `Approved ${details.email} as ${details.role}`
      case 'reject':
        return `Rejected ${details.email}${details.reason ? `: ${details.reason}` : ''}`
      case 'role_change':
        return `Changed role from ${details.oldValue} to ${details.newValue} for ${details.email}`
      case 'invite':
        return `Invited ${details.email} as ${details.role}`
      case 'suspend':
        return `Suspended ${details.email}${details.reason ? `: ${details.reason}` : ''}`
      case 'activate':
        return `Activated ${details.email}`
      default:
        return JSON.stringify(details)
    }
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>No activity recorded yet</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            User management actions will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>Recent user management activity</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-3">
            {logs.map((log) => {
              const Icon = getActionIcon(log.action)
              const colorClass = getActionColor(log.action)

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {getActionLabel(log.action)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{formatDetails(log)}</p>
                    <p className="text-xs text-muted-foreground">
                      By {log.performedByName || log.performedBy}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), 'PPpp')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
