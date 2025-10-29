'use client'

import { useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, Grid3X3, List } from 'lucide-react'
import { useRealtimeData } from '@/hooks/use-realtime-data'
import { getSitesWithStats } from '@/app/actions/sites-actions'
import { SitesFilters } from './sites-filters'
import { SitesGrid } from './sites-grid'
import { SitesList } from './sites-list'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Site {
  id: number
  name: string
  slug: string
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

type ViewMode = 'grid' | 'list'

export function SitesContent() {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'name',
  })
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const fetchSites = useCallback(async () => {
    const result = await getSitesWithStats(filters)
    return result
  }, [filters])

  const { data, isLoading, error, lastUpdated, refresh } = useRealtimeData<{
    success: boolean
    sites: Site[]
    error?: string
  }>(fetchSites, 60000)

  const handleRefresh = () => {
    refresh()
  }

  if (error) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-500">Failed to load sites</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  const sites = data?.sites || []

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SitesFilters filters={filters} onFiltersChange={setFilters} />

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

      {/* Sites Display */}
      {viewMode === 'grid' ? (
        <SitesGrid sites={sites} isLoading={isLoading} />
      ) : (
        <SitesList sites={sites} isLoading={isLoading} />
      )}

      {/* Results Count */}
      {!isLoading && sites.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {sites.length} site{sites.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
