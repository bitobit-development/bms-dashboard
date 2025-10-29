'use client'

import { useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, Grid3X3, List } from 'lucide-react'
import { useRealtimeData } from '@/hooks/use-realtime-data'
import { getEquipmentList } from '@/app/actions/equipment-actions'
import { EquipmentFilters } from './equipment-filters'
import { EquipmentGrid } from './equipment-grid'
import { EquipmentList } from './equipment-list'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

type ViewMode = 'grid' | 'list'

export function EquipmentContent() {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    site: 'all',
    sortBy: 'name',
  })
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const fetchEquipment = useCallback(async () => {
    const result = await getEquipmentList(filters)
    return result
  }, [filters])

  const { data, isLoading, error, lastUpdated, refresh } = useRealtimeData<{
    success: boolean
    equipment: Equipment[]
    error?: string
  }>(fetchEquipment, 60000)

  const handleRefresh = () => {
    refresh()
  }

  if (error) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-500">Failed to load equipment</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  const equipment = data?.equipment || []

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <EquipmentFilters filters={filters} onFiltersChange={setFilters} />

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn(
                'h-8 w-8 p-0',
                viewMode === 'grid' && 'bg-accent'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                'h-8 w-8 p-0',
                viewMode === 'list' && 'bg-accent'
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && !isLoading && (
        <div className="text-sm text-muted-foreground">
          Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </div>
      )}

      {/* Equipment Display */}
      {viewMode === 'grid' ? (
        <EquipmentGrid equipment={equipment} isLoading={isLoading} />
      ) : (
        <EquipmentList equipment={equipment} isLoading={isLoading} />
      )}

      {/* Results Count */}
      {!isLoading && equipment.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {equipment.length} equipment item{equipment.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
