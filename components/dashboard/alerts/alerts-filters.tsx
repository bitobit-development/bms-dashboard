'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AlertsFiltersProps {
  filters: {
    severity: string
    category: string
    status: string
    site: string
  }
  sites: Array<{ id: number; name: string }>
  onFiltersChange: (filters: any) => void
}

export function AlertsFilters({
  filters,
  sites,
  onFiltersChange,
}: AlertsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={filters.severity}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, severity: value })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="error">Error</SelectItem>
          <SelectItem value="warning">Warning</SelectItem>
          <SelectItem value="info">Info</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.category}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, category: value })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="battery">Battery</SelectItem>
          <SelectItem value="solar">Solar</SelectItem>
          <SelectItem value="grid">Grid</SelectItem>
          <SelectItem value="inverter">Inverter</SelectItem>
          <SelectItem value="system">System</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
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
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="acknowledged">Acknowledged</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="dismissed">Dismissed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.site}
        onValueChange={(value) => onFiltersChange({ ...filters, site: value })}
      >
        <SelectTrigger className="w-[180px]">
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
    </div>
  )
}
