'use client'

import Link from 'next/link'
import { format, isPast } from 'date-fns'
import { Battery, Zap, Sun, Activity, Gauge, Wrench, AlertCircle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Equipment {
  id: number
  name: string
  type: 'inverter' | 'battery' | 'solar_panel' | 'charge_controller' | 'grid_meter'
  manufacturer: string | null
  model: string | null
  serialNumber: string | null
  status: 'operational' | 'degraded' | 'maintenance' | 'failed' | 'offline'
  healthScore: number | null
  capacity: number | null
  voltage: number | null
  specs: any
  siteId: number
  siteName: string | null
  nextMaintenanceAt: Date | null
  lastMaintenanceAt: Date | null
  installedAt: Date | null
  warrantyExpiresAt: Date | null
}

interface EquipmentListProps {
  equipment: Equipment[]
  isLoading?: boolean
}

const equipmentIcons = {
  battery: Battery,
  inverter: Zap,
  solar_panel: Sun,
  charge_controller: Activity,
  grid_meter: Gauge,
}

const equipmentLabels = {
  battery: 'Battery',
  inverter: 'Inverter',
  solar_panel: 'Solar Panel',
  charge_controller: 'Charge Controller',
  grid_meter: 'Grid Meter',
}

const statusColors = {
  operational: 'bg-green-100 text-green-800 border-green-200',
  degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  maintenance: 'bg-blue-100 text-blue-800 border-blue-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  offline: 'bg-gray-100 text-gray-800 border-gray-200',
}

const getHealthColor = (health: number) => {
  if (health >= 80) return 'bg-green-500'
  if (health >= 60) return 'bg-yellow-500'
  if (health >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

const getHealthTextColor = (health: number) => {
  if (health >= 80) return 'text-green-500'
  if (health >= 60) return 'text-yellow-500'
  if (health >= 40) return 'text-orange-500'
  return 'text-red-500'
}

export function EquipmentList({ equipment, isLoading = false }: EquipmentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-6">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (equipment.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-2">
          <p className="text-lg text-muted-foreground">No equipment found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search criteria
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {equipment.map((item) => {
        const Icon = equipmentIcons[item.type]
        const isMaintenanceOverdue = item.nextMaintenanceAt && isPast(new Date(item.nextMaintenanceAt))

        return (
          <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-6">
              {/* Icon */}
              <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{equipmentLabels[item.type]}</span>
                      {item.siteName && (
                        <>
                          <span>•</span>
                          <span>{item.siteName}</span>
                        </>
                      )}
                      {(item.manufacturer || item.model) && (
                        <>
                          <span>•</span>
                          <span>
                            {item.manufacturer}
                            {item.manufacturer && item.model && ' '}
                            {item.model}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('shrink-0 capitalize', statusColors[item.status])}>
                    {item.status}
                  </Badge>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-6 mt-3">
                  {/* Health Score */}
                  {item.healthScore !== null && (
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Health</span>
                          <span className={cn('font-semibold', getHealthTextColor(item.healthScore))}>
                            {item.healthScore}%
                          </span>
                        </div>
                        <Progress
                          value={item.healthScore}
                          className="h-2"
                          indicatorClassName={getHealthColor(item.healthScore)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Specs */}
                  <div className="flex items-center gap-4 text-sm">
                    {item.capacity !== null && (
                      <div>
                        <span className="text-muted-foreground">Capacity: </span>
                        <span className="font-medium">
                          {item.capacity} {item.type === 'battery' ? 'kWh' : 'kW'}
                        </span>
                      </div>
                    )}
                    {item.voltage !== null && (
                      <div>
                        <span className="text-muted-foreground">Voltage: </span>
                        <span className="font-medium">{item.voltage}V</span>
                      </div>
                    )}
                  </div>

                  {/* Maintenance */}
                  {item.nextMaintenanceAt && (
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-md text-sm",
                      isMaintenanceOverdue
                        ? "bg-red-500/10 text-red-500"
                        : "bg-blue-500/10 text-blue-500"
                    )}>
                      {isMaintenanceOverdue ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <Wrench className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {isMaintenanceOverdue ? 'Overdue' : format(new Date(item.nextMaintenanceAt), 'MMM d')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button asChild variant="outline" className="shrink-0">
                <Link href={`/dashboard/equipment/${item.id}`}>
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
