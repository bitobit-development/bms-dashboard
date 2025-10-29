'use client'

import { Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SitesHeader() {
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export sites data')
  }

  const handleAddSite = () => {
    // TODO: Implement add site functionality
    console.log('Add new site')
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor all BMS installations
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button onClick={handleAddSite}>
          <Plus className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </div>
    </div>
  )
}
