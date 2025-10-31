'use client'

import { useCallback, useEffect } from 'react'
import { SiteCard } from '@/components/dashboard/site-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Activity, Battery, Sun, Home, AlertCircle } from 'lucide-react'
import { useRealtimeData } from '@/hooks/use-realtime-data'
import { getSites, getSystemStats } from '@/app/actions/sites'
import { formatDistanceToNow } from 'date-fns'
import { syncUserToDatabase } from '@/src/lib/actions/users'

export default function DashboardPage() {
  // Sync user to database on mount (for new signups)
  useEffect(() => {
    syncUserToDatabase().catch(console.error)
  }, [])
  const user = { displayName: 'Admin User' }

  const fetchSitesData = useCallback(async () => {
    return await getSites()
  }, [])

  const fetchStatsData = useCallback(async () => {
    return await getSystemStats()
  }, [])

  const {
    data: sites,
    isLoading: sitesLoading,
    error: sitesError,
    lastUpdated,
    refresh,
  } = useRealtimeData(fetchSitesData, 60000)

  const {
    data: stats,
    isLoading: statsLoading,
  } = useRealtimeData(fetchStatsData, 60000)

  if (sitesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.displayName || 'User'}</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. {sitesError.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.displayName || 'User'}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={sitesLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${sitesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Sites"
          value={stats?.totalSites.toString() || '0'}
          icon={Activity}
          description={`${stats?.onlineSites || 0} online`}
          isLoading={statsLoading}
        />
        <StatsCard
          title="Avg Battery Level"
          value={`${stats?.averageBatteryLevel.toFixed(0) || '0'}%`}
          icon={Battery}
          description={`${stats?.totalBatteryCapacity.toFixed(0) || '0'} kWh capacity`}
          isLoading={statsLoading}
          valueColor="text-purple-600"
        />
        <StatsCard
          title="Total Solar"
          value={`${stats?.totalSolarGeneration.toFixed(1) || '0'} kW`}
          icon={Sun}
          description={`${stats?.totalSolarCapacity.toFixed(0) || '0'} kW capacity`}
          isLoading={statsLoading}
          valueColor="text-yellow-600"
        />
        <StatsCard
          title="Total Load"
          value={`${stats?.totalLoad.toFixed(1) || '0'} kW`}
          icon={Home}
          description="Current consumption"
          isLoading={statsLoading}
          valueColor="text-slate-600"
        />
      </div>

      {/* Sites Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Sites</h2>
        {sitesLoading && !sites ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sites && sites.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No sites found</p>
              <p className="text-sm text-muted-foreground">
                Sites will appear here once they're added to the system
              </p>
            </CardContent>
          </Card>
        )}
      </div>
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
}

function StatsCard({ title, value, icon: Icon, description, isLoading, valueColor }: StatsCardProps) {
  return (
    <Card>
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
  )
}
