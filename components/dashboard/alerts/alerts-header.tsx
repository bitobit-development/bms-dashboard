'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AlertsHeader() {
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export alerts data')
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage system alerts and notifications
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  )
}
