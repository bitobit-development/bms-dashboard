'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import { Battery, Zap, Sun, Activity, Gauge, Wrench, AlertCircle, ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { EquipmentFormDialog } from './equipment-form-dialog'
import { EquipmentDeleteDialog } from './equipment-delete-dialog'
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

interface EquipmentGridProps {
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

export function EquipmentGrid({ equipment, isLoading = false }: EquipmentGridProps) {
  const router = useRouter()
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null)

  const handleSuccess = () => {
    router.refresh()
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {equipment.map((item) => {
        const Icon = equipmentIcons[item.type]
        const isMaintenanceOverdue = item.nextMaintenanceAt && isPast(new Date(item.nextMaintenanceAt))

        return (
          <Card key={item.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {equipmentLabels[item.type]}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={cn('shrink-0 capitalize', statusColors[item.status])}>
                  {item.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {/* Site Name */}
              {item.siteName && (
                <div className="text-sm text-muted-foreground">
                  Site: <span className="font-medium text-foreground">{item.siteName}</span>
                </div>
              )}

              {/* Manufacturer and Model */}
              {(item.manufacturer || item.model) && (
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    {item.manufacturer}
                    {item.manufacturer && item.model && ' '}
                    {item.model}
                  </span>
                </div>
              )}

              {/* Serial Number */}
              {item.serialNumber && (
                <div className="text-xs text-muted-foreground">
                  S/N: {item.serialNumber}
                </div>
              )}

              {/* Health Score */}
              {item.healthScore !== null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Health Score</span>
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
              )}

              {/* Specifications */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {item.capacity !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="font-medium">
                      {item.capacity} {item.type === 'battery' ? 'kWh' : 'kW'}
                    </p>
                  </div>
                )}
                {item.voltage !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Voltage</p>
                    <p className="font-medium">{item.voltage}V</p>
                  </div>
                )}
              </div>

              {/* Next Maintenance */}
              {item.nextMaintenanceAt && (
                <div className={cn(
                  "flex items-center gap-2 p-2 rounded-md",
                  isMaintenanceOverdue
                    ? "bg-red-500/10 text-red-500"
                    : "bg-blue-500/10 text-blue-500"
                )}>
                  {isMaintenanceOverdue ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Wrench className="h-4 w-4" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">
                      {isMaintenanceOverdue ? 'Maintenance Overdue' : 'Next Maintenance'}
                    </p>
                    <p className="text-xs">
                      {format(new Date(item.nextMaintenanceAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button asChild className="flex-1" variant="outline" size="sm">
                <Link href={`/dashboard/equipment/${item.id}`}>
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingEquipment(item)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingEquipment(item)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </CardFooter>
          </Card>
        )
      })}

      {/* Edit Dialog */}
      {editingEquipment && (
        <EquipmentFormDialog
          open={!!editingEquipment}
          onOpenChange={(open) => !open && setEditingEquipment(null)}
          equipmentId={editingEquipment.id}
          equipment={editingEquipment}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Dialog */}
      {deletingEquipment && (
        <EquipmentDeleteDialog
          open={!!deletingEquipment}
          onOpenChange={(open) => !open && setDeletingEquipment(null)}
          equipmentId={deletingEquipment.id}
          equipmentName={deletingEquipment.name}
          equipmentType={equipmentLabels[deletingEquipment.type]}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
