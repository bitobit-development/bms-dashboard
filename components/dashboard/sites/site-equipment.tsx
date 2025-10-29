import { Battery, Zap, Sun, Activity, Gauge, Package } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Equipment } from '@/src/db/schema'

type SiteEquipmentProps = {
  siteId: number
  equipment: Equipment[]
}

const getEquipmentIcon = (type: string) => {
  switch (type) {
    case 'battery':
      return <Battery className="h-4 w-4" />
    case 'inverter':
      return <Zap className="h-4 w-4" />
    case 'solar_panel':
      return <Sun className="h-4 w-4" />
    case 'charge_controller':
      return <Activity className="h-4 w-4" />
    case 'grid_meter':
      return <Gauge className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
  }
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'operational':
      return 'default'
    case 'degraded':
      return 'secondary'
    case 'maintenance':
      return 'secondary'
    case 'failed':
      return 'destructive'
    case 'offline':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getHealthScoreColor = (score: number | null | undefined) => {
  if (!score) return 'text-muted-foreground'
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

const formatEquipmentType = (type: string) => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const SiteEquipment = ({ siteId, equipment }: SiteEquipmentProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Equipment</CardTitle>
          <Badge variant="outline">{equipment.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {equipment.length > 0 ? (
          <div className="space-y-3">
            {equipment.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/equipment/${item.id}`}
                className="block rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
              >
                {/* Equipment Header */}
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-muted p-2">
                    {getEquipmentIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatEquipmentType(item.type)}
                    </div>
                    {item.manufacturer && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.manufacturer}
                        {item.model && ` - ${item.model}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status and Health */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant={getStatusVariant(item.status)} className="text-xs">
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>

                  {item.healthScore !== null && item.healthScore !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Health:</span>
                      <span className={`text-xs font-semibold ${getHealthScoreColor(item.healthScore)}`}>
                        {item.healthScore.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}

            {/* View All Link */}
            <Link
              href={`/dashboard/sites/${siteId}/equipment`}
              className="block text-center text-sm text-primary hover:underline mt-4"
            >
              View all equipment
            </Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No equipment registered</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add equipment to track performance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
