/**
 * Example Usage of EquipmentFormDialog Component
 *
 * This file demonstrates how to use the EquipmentFormDialog component
 * in different scenarios.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit } from 'lucide-react'
import { EquipmentFormDialog } from './equipment-form-dialog'

// Example 1: Create New Equipment (No Pre-selected Site)
export function CreateEquipmentExample() {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    console.log('Equipment created successfully!')
    // Refresh equipment list, revalidate, etc.
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Equipment
      </Button>

      <EquipmentFormDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}

// Example 2: Create New Equipment (Pre-selected Site)
export function CreateEquipmentForSiteExample() {
  const [open, setOpen] = useState(false)
  const siteId = 1 // Your site ID

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Equipment to Site
      </Button>

      <EquipmentFormDialog
        open={open}
        onOpenChange={setOpen}
        siteId={siteId}
        onSuccess={() => {
          console.log('Equipment created for site:', siteId)
        }}
      />
    </>
  )
}

// Example 3: Edit Existing Equipment
export function EditEquipmentExample() {
  const [open, setOpen] = useState(false)

  // Your equipment data from server
  const equipment = {
    id: 1,
    name: 'Main Battery Bank',
    type: 'battery' as const,
    manufacturer: 'Tesla',
    model: 'Powerwall 2',
    serialNumber: 'SN123456789',
    capacity: 13.5,
    voltage: 500,
    status: 'operational' as const,
    healthScore: 95,
    installedAt: new Date('2023-01-15'),
    warrantyExpiresAt: new Date('2033-01-15'),
    siteId: 1,
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Equipment
      </Button>

      <EquipmentFormDialog
        open={open}
        onOpenChange={setOpen}
        equipmentId={equipment.id}
        equipment={equipment}
        onSuccess={() => {
          console.log('Equipment updated:', equipment.id)
        }}
      />
    </>
  )
}

// Example 4: Usage in Equipment List/Grid Component
export function EquipmentListWithDialog() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null)

  const handleEdit = (equipment: any) => {
    setSelectedEquipment(equipment)
    setEditDialogOpen(true)
  }

  const handleSuccess = () => {
    // Trigger refresh of equipment list
    console.log('Refreshing equipment list...')
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipment</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      {/* Equipment list/grid here */}
      <div className="grid gap-4">
        {/* Your equipment items with edit buttons */}
        {/* Each item calls handleEdit(equipment) */}
      </div>

      {/* Create Dialog */}
      <EquipmentFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />

      {/* Edit Dialog */}
      {selectedEquipment && (
        <EquipmentFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          equipmentId={selectedEquipment.id}
          equipment={selectedEquipment}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
