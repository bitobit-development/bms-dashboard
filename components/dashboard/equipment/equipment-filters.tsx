'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { getSitesForFilter } from '@/app/actions/equipment-actions'

interface EquipmentFiltersProps {
  filters: {
    search: string
    type: string
    status: string
    site: string
    sortBy: string
  }
  onFiltersChange: (filters: any) => void
}

export function EquipmentFilters({ filters, onFiltersChange }: EquipmentFiltersProps) {
  const [sites, setSites] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    const fetchSites = async () => {
      const result = await getSitesForFilter()
      if (result.success) {
        setSites(result.sites)
      }
    }
    fetchSites()
  }, [])

  return (
    <div className="flex gap-3 flex-wrap">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search equipment..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.type}
        onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="inverter">Inverter</SelectItem>
          <SelectItem value="battery">Battery</SelectItem>
          <SelectItem value="solar_panel">Solar Panel</SelectItem>
          <SelectItem value="charge_controller">Charge Controller</SelectItem>
          <SelectItem value="grid_meter">Grid Meter</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="operational">Operational</SelectItem>
          <SelectItem value="degraded">Degraded</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="offline">Offline</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.site}
        onValueChange={(value) => onFiltersChange({ ...filters, site: value })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Site" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sites</SelectItem>
          {sites.map((site) => (
            <SelectItem key={site.id} value={site.id.toString()}>
              {site.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sortBy}
        onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="health">Health Score</SelectItem>
          <SelectItem value="maintenance">Next Maintenance</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
