'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

// Grafana-inspired colors
const STATUS_COLORS = {
  good: '#73bf69',
  warning: '#fade2a',
  critical: '#f2495c',
}

interface SiteOverviewCardProps {
  siteId: number
  siteName: string
  avgUploadSpeed: number
  avgDownloadSpeed: number
  allocatedBandwidth: number
  utilizationPct: number
  totalDataConsumed: number
  consumptionPct: number
  avgLatency: number
  status: 'good' | 'warning' | 'critical'
  className?: string
}

export function SiteOverviewCard({
  siteId,
  siteName,
  avgUploadSpeed,
  avgDownloadSpeed,
  allocatedBandwidth,
  utilizationPct,
  totalDataConsumed,
  consumptionPct,
  avgLatency,
  status,
  className,
}: SiteOverviewCardProps) {
  const getStatusColor = () => STATUS_COLORS[status]

  const getLatencyBadgeVariant = () => {
    if (avgLatency < 50) return 'default'
    if (avgLatency < 100) return 'secondary'
    return 'destructive'
  }

  const formatDataConsumed = (gb: number) => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`
    }
    return `${gb.toFixed(1)} GB`
  }

  return (
    <Link
      href={`/dashboard/data-usage/${siteId}`}
      className="block"
      tabIndex={0}
      aria-label={`View data usage details for ${siteName}`}
    >
      <Card
        className={cn(
          'p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 cursor-pointer',
          className
        )}
      >
        {/* Header with site name and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: getStatusColor() }}
              aria-hidden="true"
            />
            <h3 className="font-semibold text-sm truncate">{siteName}</h3>
          </div>
          <Badge variant={getLatencyBadgeVariant()} className="text-xs">
            {avgLatency.toFixed(0)}ms
          </Badge>
        </div>

        {/* Speed metrics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <ArrowUpRight className="h-3 w-3 text-blue-500" aria-hidden="true" />
              Upload
            </div>
            <span className="text-sm font-medium tabular-nums">
              {avgUploadSpeed.toFixed(1)} <span className="text-xs text-muted-foreground">Mbps</span>
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <ArrowDownRight className="h-3 w-3 text-green-500" aria-hidden="true" />
              Download
            </div>
            <span className="text-sm font-medium tabular-nums">
              {avgDownloadSpeed.toFixed(1)} <span className="text-xs text-muted-foreground">Mbps</span>
            </span>
          </div>
        </div>

        {/* Bandwidth allocation info */}
        <div className="text-xs text-muted-foreground mb-2">
          Allocated: {allocatedBandwidth} Mbps
        </div>

        {/* Data consumption progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Data Used</span>
            <span className="font-medium tabular-nums">
              {formatDataConsumed(totalDataConsumed)}
            </span>
          </div>
          <Progress
            value={Math.min(consumptionPct, 100)}
            className="h-2"
            aria-label={`Data consumption: ${consumptionPct.toFixed(0)}%`}
          />
          <div className="text-xs text-muted-foreground text-right tabular-nums">
            {consumptionPct.toFixed(0)}% of allowance
          </div>
        </div>
      </Card>
    </Link>
  )
}
