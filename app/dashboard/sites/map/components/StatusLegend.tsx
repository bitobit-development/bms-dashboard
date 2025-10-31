'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STATUS_COLORS } from '@/lib/map-utils'
import { groupSitesByStatus } from '@/lib/map-utils'
import type { MapSiteData } from '@/app/actions/sites-map'

interface StatusLegendProps {
  sites: MapSiteData[]
}

export function StatusLegend({ sites }: StatusLegendProps) {
  const counts = groupSitesByStatus(sites)

  return (
    <Card className="w-full lg:w-80">
      <CardHeader>
        <CardTitle className="text-base">Legend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(STATUS_COLORS).map(([status, info]) => {
            const count = counts[status as keyof typeof counts]
            return (
              <div key={status} className="flex items-start gap-3">
                <div
                  className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                  style={{ backgroundColor: info.primary }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{info.label}</span>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {info.description}
                  </p>
                </div>
              </div>
            )
          })}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total Sites</span>
              <span className="text-sm font-semibold">{counts.total}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
