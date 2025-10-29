'use client'

import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { Battery, Sun, Activity, MapPin, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Site {
  id: number
  name: string
  city: string | null
  state: string | null
  status: string
  batteryCapacityKwh: number | null
  solarCapacityKw: number | null
  currentChargeLevel: number
  currentPowerKw: number
  activeAlerts: number
  lastSeenAt: Date | null
}

interface SitesGridProps {
  sites: Site[]
  isLoading?: boolean
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'maintenance':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'offline':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }
}

const getChargeColor = (level: number) => {
  if (level >= 80) return 'text-green-500'
  if (level >= 50) return 'text-yellow-500'
  return 'text-red-500'
}

export function SitesGrid({ sites, isLoading = false }: SitesGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-2">
          <p className="text-lg text-muted-foreground">No sites found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search criteria
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sites.map((site) => (
        <Card key={site.id} className="flex flex-col hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{site.name}</h3>
                {(site.city || site.state) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {[site.city, site.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
              <Badge variant="outline" className={cn('shrink-0', getStatusColor(site.status))}>
                {site.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            {/* Capacity Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Battery className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Battery</p>
                  <p className="font-medium truncate">
                    {site.batteryCapacityKwh ? `${site.batteryCapacityKwh} kWh` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Solar</p>
                  <p className="font-medium truncate">
                    {site.solarCapacityKw ? `${site.solarCapacityKw} kW` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Charge Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Charge Level</span>
                <span className={cn('font-semibold', getChargeColor(site.currentChargeLevel))}>
                  {site.currentChargeLevel}%
                </span>
              </div>
              <Progress value={site.currentChargeLevel} className="h-2" />
            </div>

            {/* Current Power */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Current Power</span>
              </div>
              <span className="font-semibold">{site.currentPowerKw.toFixed(1)} kW</span>
            </div>

            {/* Active Alerts */}
            {site.activeAlerts > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/10 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {site.activeAlerts} Active Alert{site.activeAlerts > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Last Seen */}
            <div className="text-xs text-muted-foreground">
              Last seen:{' '}
              {site.lastSeenAt
                ? formatDistanceToNow(new Date(site.lastSeenAt), { addSuffix: true })
                : 'Never'}
            </div>
          </CardContent>

          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/dashboard/sites/${site.id}`}>
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
