'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Battery, Sun, Activity, MapPin, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
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

interface SitesListProps {
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

export function SitesList({ sites, isLoading = false }: SitesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-6">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
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
    <div className="space-y-4">
      {sites.map((site) => (
        <Card key={site.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Site Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Battery Capacity */}
                <div className="flex items-center gap-2 text-sm">
                  <Battery className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Battery</p>
                    <p className="font-medium">
                      {site.batteryCapacityKwh ? `${site.batteryCapacityKwh} kWh` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Solar Capacity */}
                <div className="flex items-center gap-2 text-sm">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Solar</p>
                    <p className="font-medium">
                      {site.solarCapacityKw ? `${site.solarCapacityKw} kW` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Current Power */}
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Power</p>
                    <p className="font-medium">{site.currentPowerKw.toFixed(1)} kW</p>
                  </div>
                </div>

                {/* Charge Level */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Charge</p>
                    <div className="flex items-center gap-2">
                      <Progress value={site.currentChargeLevel} className="h-2 flex-1" />
                      <span className={cn('font-semibold text-xs', getChargeColor(site.currentChargeLevel))}>
                        {site.currentChargeLevel}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>
                  Last seen:{' '}
                  {site.lastSeenAt
                    ? formatDistanceToNow(new Date(site.lastSeenAt), { addSuffix: true })
                    : 'Never'}
                </span>
                {site.activeAlerts > 0 && (
                  <div className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-medium">
                      {site.activeAlerts} Alert{site.activeAlerts > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="lg:shrink-0">
              <Button asChild variant="outline">
                <Link href={`/dashboard/sites/${site.id}`}>
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
