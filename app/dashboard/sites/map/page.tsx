'use client'

import { useCallback, useState } from 'react'
import { Loader2, AlertCircle, MapPin } from 'lucide-react'
import { getSitesForMap } from '@/app/actions/sites-map'
import { SitesMap } from './components/SitesMap'
import { MapControls } from './components/MapControls'
import { StatusLegend } from './components/StatusLegend'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { useRealtimeData } from '@/hooks/use-realtime-data'

export default function SitesMapPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])

  // Fetch sites data with real-time updates
  const fetchSites = useCallback(async () => {
    return await getSitesForMap()
  }, [])

  const {
    data: sites,
    isLoading,
    error,
    lastUpdated,
    refresh,
  } = useRealtimeData(fetchSites, 60000) // Update every 60 seconds

  // Filter sites based on search and status
  const filteredSites = sites?.filter((site) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.state?.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(site.markerStatus)

    return matchesSearch && matchesStatus
  })

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sites Map</h1>
          <p className="text-muted-foreground">Interactive map of all battery sites</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load map data: {error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Loading state
  if (isLoading && !sites) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sites Map</h1>
          <p className="text-muted-foreground">Interactive map of all battery sites</p>
        </div>
        <Card className="h-[600px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading map data...</p>
          </div>
        </Card>
      </div>
    )
  }

  // No sites with location data
  if (!sites || sites.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sites Map</h1>
          <p className="text-muted-foreground">Interactive map of all battery sites</p>
        </div>
        <Card className="h-[600px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">No sites with location data</p>
              <p className="text-sm text-muted-foreground">
                Add latitude and longitude to sites to display them on the map
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Sites Map</h1>
        <p className="text-muted-foreground">
          Interactive map showing {sites.length} battery sites with real-time status
        </p>
      </div>

      {/* Controls and Legend */}
      <div className="flex flex-col lg:flex-row gap-4">
        <MapControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onRefresh={refresh}
          isRefreshing={isLoading}
          lastUpdated={lastUpdated}
        />
        <StatusLegend sites={sites} />
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <div className="h-[70vh] min-h-[500px]">
          <SitesMap sites={filteredSites || []} />
        </div>
      </Card>
    </div>
  )
}
