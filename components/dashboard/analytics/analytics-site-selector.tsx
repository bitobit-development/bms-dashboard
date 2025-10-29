'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Site = {
  id: number
  name: string
}

type AnalyticsSiteSelectorProps = {
  sites: Site[]
  selectedSite: string
  onSiteChange: (siteId: string) => void
}

export function AnalyticsSiteSelector({
  sites,
  selectedSite,
  onSiteChange,
}: AnalyticsSiteSelectorProps) {
  return (
    <Select value={selectedSite} onValueChange={onSiteChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select site" />
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
  )
}
