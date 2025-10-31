'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-react'
import { EquipmentFormDialog } from './equipment-form-dialog'
import { useRouter } from 'next/navigation'

export function EquipmentHeader() {
  const router = useRouter()
  const [showAddDialog, setShowAddDialog] = useState(false)

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export equipment data')
  }

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
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
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </div>

      <EquipmentFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleSuccess}
      />
    </>
  )
}
