'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { STATUS_COLORS, type MarkerStatus } from '@/lib/map-utils'

interface MapControlsProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string[]
  onStatusFilterChange: (statuses: string[]) => void
  onRefresh: () => void
  isRefreshing: boolean
  lastUpdated: Date | null
}

export function MapControls({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
}: MapControlsProps) {
  const handleStatusToggle = (status: string, checked: boolean) => {
    if (checked) {
      onStatusFilterChange([...statusFilter, status])
    } else {
      onStatusFilterChange(statusFilter.filter((s) => s !== status))
    }
  }

  return (
    <Card className="w-full lg:w-80">
      <CardHeader>
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Sites</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="space-y-2">
            {(Object.keys(STATUS_COLORS) as MarkerStatus[]).map((status) => {
              const statusInfo = STATUS_COLORS[status]
              return (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={statusFilter.includes(status)}
                    onCheckedChange={(checked) =>
                      handleStatusToggle(status, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusInfo.primary }}
                    />
                    {statusInfo.label}
                  </label>
                </div>
              )
            })}
          </div>
        </div>

        {/* Refresh button */}
        <div className="space-y-2">
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full"
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground text-center">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
