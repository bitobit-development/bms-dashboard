'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteEquipment } from '@/app/actions/equipment-actions'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export interface EquipmentDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipmentId: number
  equipmentName: string
  equipmentType: string
  onSuccess?: () => void
}

export function EquipmentDeleteDialog({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
  equipmentType,
  onSuccess,
}: EquipmentDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteEquipment(equipmentId)

      if (result.success) {
        toast.success('Equipment deleted', {
          description: `${equipmentName} has been deleted successfully.`,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error('Failed to delete equipment', {
          description: result.error || 'An unexpected error occurred.',
        })
      }
    } catch (error) {
      console.error('Delete equipment error:', error)
      toast.error('Failed to delete equipment', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>{equipmentName}</strong> ({equipmentType})?
            </p>
            <p className="text-red-600 dark:text-red-400 font-medium">
              This action cannot be undone. All telemetry data associated with this equipment will remain in the system, but the equipment record will be permanently deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Equipment
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
