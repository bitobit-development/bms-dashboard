'use client'

import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-react'

export function EquipmentHeader() {
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export equipment data')
  }

  const handleAddEquipment = () => {
    // TODO: Implement add equipment functionality
    console.log('Add new equipment')
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipment</h1>
        <p className="text-muted-foreground mt-1">
          Monitor equipment health and maintenance schedules
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button onClick={handleAddEquipment}>
          <Plus className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
      </div>
    </div>
  )
}
