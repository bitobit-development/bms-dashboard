'use client'

import { InfoWindow } from '@vis.gl/react-google-maps'
import { MapSiteData } from '@/app/actions/sites-map'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { STATUS_COLORS } from '@/lib/map-utils'
import Link from 'next/link'

interface SiteInfoWindowProps {
  site: MapSiteData
  onClose: () => void
}

export function SiteInfoWindow({ site, onClose }: SiteInfoWindowProps) {
  const statusColor = STATUS_COLORS[site.markerStatus]

  return (
    <InfoWindow
      position={{ lat: site.latitude, lng: site.longitude }}
      onCloseClick={onClose}
      maxWidth={300}
    >
      <div className="p-2 space-y-3">
        {/* Site name and status */}
        <div>
          <h3 className="font-semibold text-lg">{site.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColor.primary }}
            />
            <span className="text-sm font-medium">{statusColor.label}</span>
          </div>
        </div>

        {/* Location */}
        {(site.city || site.state) && (
          <p className="text-sm text-muted-foreground">
            {[site.city, site.state].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Alert counts */}
        <div className="flex gap-2 flex-wrap">
          {site.criticalAlerts > 0 && (
            <Badge variant="destructive" className="text-xs">
              {site.criticalAlerts} Critical
            </Badge>
          )}
          {site.warningAlerts > 0 && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-xs">
              {site.warningAlerts} Warning
            </Badge>
          )}
          {site.infoAlerts > 0 && (
            <Badge variant="secondary" className="text-xs">
              {site.infoAlerts} Info
            </Badge>
          )}
          {site.criticalAlerts === 0 &&
            site.warningAlerts === 0 &&
            site.infoAlerts === 0 && (
              <Badge variant="outline" className="text-xs text-green-600">
                No Active Alerts
              </Badge>
            )}
        </div>

        {/* Last telemetry */}
        {site.lastTelemetryAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Last data: {formatDistanceToNow(site.lastTelemetryAt, { addSuffix: true })}
            </span>
          </div>
        )}

        {/* View details button */}
        <Button asChild size="sm" className="w-full">
          <Link href={`/dashboard/sites/${site.id}`}>
            View Details
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </InfoWindow>
  )
}
