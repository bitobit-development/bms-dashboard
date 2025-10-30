'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BatteryGauge } from './battery-gauge'
import { EnergyFlowCanvas, EnergyFlow } from './energy-flow'
import { LastCheckedDisplay } from './last-checked-display'
import { MapPin, Sun, Zap, Home, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SiteWithLatestTelemetry } from '@/app/actions/sites'

interface SiteCardProps {
  site: SiteWithLatestTelemetry
  className?: string
}

export function SiteCard({ site, className }: SiteCardProps) {
  const { id, name, status, location, latestReading, batteryCapacityKwh, solarCapacityKw, lastSeenAt } = site
  const [isHovered, setIsHovered] = useState(false)

  const isOnline = latestReading && lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < 10 * 60 * 1000
  const batteryLevel = latestReading?.batteryChargeLevel || 0
  const isCharging = (latestReading?.batteryPowerKw || 0) < 0 // Negative power means charging

  const getStatusBadgeColor = () => {
    if (status === 'active' && isOnline) return 'default'
    if (status === 'maintenance') return 'secondary'
    return 'destructive'
  }

  // Calculate energy flows based on telemetry data
  const calculateEnergyFlows = (): EnergyFlow[] => {
    if (!latestReading) return []

    const flows: EnergyFlow[] = []
    const solarPower = latestReading.solarPowerKw || 0
    const batteryPower = latestReading.batteryPowerKw || 0
    const gridPower = latestReading.gridPowerKw || 0
    const gridImport = gridPower > 0 ? gridPower : 0
    const gridExport = gridPower < 0 ? Math.abs(gridPower) : 0
    const loadPower = latestReading.loadPowerKw || 0

    // Solar to Battery (charging from solar)
    if (solarPower > 0 && batteryPower < 0) {
      flows.push({
        type: 'solar-to-battery',
        power: Math.min(solarPower, Math.abs(batteryPower)),
        isActive: true,
      })
    }

    // Battery to Load (discharging)
    if (batteryPower > 0 && loadPower > 0) {
      flows.push({
        type: 'battery-to-load',
        power: Math.min(batteryPower, loadPower),
        isActive: true,
      })
    }

    // Solar to Load (direct consumption)
    if (solarPower > 0 && loadPower > 0) {
      const directSolar = Math.max(0, solarPower - Math.abs(batteryPower || 0))
      if (directSolar > 0.1) {
        flows.push({
          type: 'solar-to-load',
          power: Math.min(directSolar, loadPower),
          isActive: true,
        })
      }
    }

    // Grid to Battery (charging from grid)
    if (gridImport > 0 && batteryPower < 0) {
      flows.push({
        type: 'grid-to-battery',
        power: Math.min(gridImport, Math.abs(batteryPower)),
        isActive: true,
      })
    }

    // Grid to Load (importing)
    if (gridImport > 0 && loadPower > 0) {
      flows.push({
        type: 'grid-to-load',
        power: Math.min(gridImport, loadPower),
        isActive: true,
      })
    }

    // Solar to Grid (exporting)
    if (gridExport > 0 && solarPower > 0) {
      flows.push({
        type: 'solar-to-grid',
        power: Math.min(gridExport, solarPower),
        isActive: true,
      })
    }

    return flows
  }

  const energyFlows = calculateEnergyFlows()

  return (
    <Link href={`/dashboard/sites/${id}`}>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Energy flow animation overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <EnergyFlowCanvas flows={energyFlows} isPaused={isHovered} />
        </div>

        <Card
          className={cn(
            'relative z-20 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 cursor-pointer',
            className
          )}
        >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{name}</CardTitle>
              {location.city && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {location.city}
                    {location.state ? `, ${location.state}` : ''}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={getStatusBadgeColor()} className={cn(isOnline && 'animate-pulse')}>
                {isOnline ? 'Online' : status}
              </Badge>
              {lastSeenAt && <LastCheckedDisplay timestamp={lastSeenAt} />}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Battery Gauge */}
            <div className="flex justify-center">
              <BatteryGauge level={batteryLevel} size="md" isCharging={isCharging} />
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              <MetricRow
                icon={Sun}
                label="Solar"
                value={latestReading?.solarPowerKw?.toFixed(1) || '0'}
                unit="kW"
                capacity={solarCapacityKw}
                color="text-yellow-600"
              />
              <MetricRow
                icon={Home}
                label="Load"
                value={latestReading?.loadPowerKw?.toFixed(1) || '0'}
                unit="kW"
                color="text-slate-600"
              />
              <MetricRow
                icon={Zap}
                label="Grid"
                value={Math.abs(latestReading?.gridPowerKw || 0).toFixed(1)}
                unit="kW"
                status={
                  latestReading?.gridPowerKw
                    ? latestReading.gridPowerKw > 0
                      ? 'Import'
                      : 'Export'
                    : undefined
                }
                color={
                  latestReading?.gridPowerKw
                    ? latestReading.gridPowerKw > 0
                      ? 'text-blue-600'
                      : 'text-green-600'
                    : 'text-blue-600'
                }
              />
            </div>
          </div>

          {/* View Details Link */}
          <div className="mt-6 pt-4 border-t flex justify-end">
            <span className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
              View Details <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </CardContent>
      </Card>
      </div>
    </Link>
  )
}

interface MetricRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  unit: string
  capacity?: number | null
  status?: string
  color?: string
}

function MetricRow({ icon: Icon, label, value, unit, capacity, status, color }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between transition-all duration-200">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4 transition-colors duration-200', color)} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <div className="flex items-baseline gap-1">
          <span className={cn('font-semibold tabular-nums transition-all duration-300', color)}>{value}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
          {status && (
            <span className={cn('text-xs ml-1 transition-colors duration-200', color)}>({status})</span>
          )}
        </div>
        {capacity && (
          <div className="text-xs text-muted-foreground">
            / {capacity} {unit} max
          </div>
        )}
      </div>
    </div>
  )
}
