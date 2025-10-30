'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  UserCheck,
  Clock,
  Shield,
  Activity,
  AlertCircle,
} from 'lucide-react'
import { getUserStats, getAuditLog, inviteUser } from '@/app/actions/management'
import { UserInviteForm } from '@/components/management/user-invite-form'
import { AuditLogViewer } from '@/components/management/audit-log-viewer'
import type { Role } from '@/lib/auth/permissions'
import Link from 'next/link'

export default function ManagementPage() {
  const [stats, setStats] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statsResult, logsResult] = await Promise.all([
        getUserStats(),
        getAuditLog(undefined, 10),
      ])

      if (statsResult.success) {
        setStats(statsResult.stats)
      } else {
        setError(statsResult.error || 'Failed to load statistics')
      }

      if (logsResult.success) {
        setAuditLogs(logsResult.logs || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleInviteUser = async (email: string, role: Role) => {
    const result = await inviteUser(email, role)
    if (result.success) {
      await loadData()
    } else {
      throw new Error(result.error || 'Failed to invite user')
    }
  }

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and permissions</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and permissions</p>
        </div>
        <UserInviteForm onInvite={handleInviteUser} />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.total?.toString() || '0'}
          icon={Users}
          description="All users in organization"
          isLoading={isLoading}
          href="/management/users"
        />
        <StatsCard
          title="Pending Approval"
          value={stats?.pending?.toString() || '0'}
          icon={Clock}
          description="Awaiting approval"
          isLoading={isLoading}
          valueColor="text-yellow-600"
          href="/management/users/pending"
          highlight={stats?.pending > 0}
        />
        <StatsCard
          title="Active Users"
          value={stats?.active?.toString() || '0'}
          icon={UserCheck}
          description="Currently active"
          isLoading={isLoading}
          valueColor="text-green-600"
        />
        <StatsCard
          title="Admins"
          value={stats?.adminCount?.toString() || '0'}
          icon={Shield}
          description={`${stats?.operatorCount || 0} operators, ${stats?.viewerCount || 0} viewers`}
          isLoading={isLoading}
          valueColor="text-blue-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/management/users/pending">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Review Pending Approvals
                {stats?.pending > 0 && (
                  <span className="ml-auto bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
                    {stats.pending}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/management/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                View All Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">
                      {log.action} by {log.performedByName || log.performedBy}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <AuditLogViewer logs={auditLogs} maxHeight="400px" />
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  isLoading?: boolean
  valueColor?: string
  href?: string
  highlight?: boolean
}

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
  valueColor,
  href,
  highlight,
}: StatsCardProps) {
  const CardWrapper = href ? Link : 'div'
  const cardProps = href ? { href } : {}

  return (
    <CardWrapper {...cardProps}>
      <Card className={highlight ? 'border-yellow-300 bg-yellow-50/50' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </>
          ) : (
            <>
              <div className={`text-2xl font-bold ${valueColor || ''}`}>{value}</div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  )
}
