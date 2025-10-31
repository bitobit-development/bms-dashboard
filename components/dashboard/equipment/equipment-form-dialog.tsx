'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Battery,
  Zap,
  Sun,
  Activity,
  Gauge,
  CalendarIcon,
  Loader2
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

import {
  createEquipment,
  updateEquipment,
  getSitesForFilter
} from '@/app/actions/equipment-actions'

// Equipment types and icons
const EQUIPMENT_TYPES = {
  battery: { label: 'Battery', icon: Battery, unit: 'kWh' },
  inverter: { label: 'Inverter', icon: Zap, unit: 'kW' },
  solar_panel: { label: 'Solar Panel', icon: Sun, unit: 'kW' },
  charge_controller: { label: 'Charge Controller', icon: Activity, unit: 'kW' },
  grid_meter: { label: 'Grid Meter', icon: Gauge, unit: 'kW' },
} as const

// Equipment statuses
const EQUIPMENT_STATUSES = [
  { value: 'operational', label: 'Operational' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'failed', label: 'Failed' },
  { value: 'offline', label: 'Offline' },
] as const

// Validation schema
const equipmentSchema = z.object({
  siteId: z.number({ message: 'Site is required' }).positive({ message: 'Please select a site' }),
  type: z.enum(['inverter', 'battery', 'solar_panel', 'charge_controller', 'grid_meter'], {
    message: 'Equipment type is required',
  }),
  name: z.string().min(1, { message: 'Name is required' }).max(100, { message: 'Name must be less than 100 characters' }),
  manufacturer: z.string().max(100, { message: 'Manufacturer must be less than 100 characters' }).optional(),
  model: z.string().max(100, { message: 'Model must be less than 100 characters' }).optional(),
  serialNumber: z.string().max(100, { message: 'Serial number must be less than 100 characters' }).optional(),
  capacity: z.number().positive({ message: 'Capacity must be positive' }).optional(),
  voltage: z.number().positive({ message: 'Voltage must be positive' }).optional(),
  status: z.enum(['operational', 'degraded', 'maintenance', 'failed', 'offline']).default('operational'),
  healthScore: z.number().min(0, { message: 'Health score must be between 0 and 100' }).max(100, { message: 'Health score must be between 0 and 100' }).optional(),
  installedAt: z.date().optional(),
  warrantyExpiresAt: z.date().optional(),
})

type EquipmentFormData = z.infer<typeof equipmentSchema>

interface Site {
  id: number
  name: string
}

interface Equipment {
  id: number
  name: string
  type: 'inverter' | 'battery' | 'solar_panel' | 'charge_controller' | 'grid_meter'
  manufacturer?: string | null
  model?: string | null
  serialNumber?: string | null
  capacity?: number | null
  voltage?: number | null
  status: 'operational' | 'degraded' | 'maintenance' | 'failed' | 'offline'
  healthScore?: number | null
  installedAt?: Date | null
  warrantyExpiresAt?: Date | null
  siteId: number
}

interface EquipmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId?: number
  equipmentId?: number
  equipment?: Equipment
  onSuccess?: () => void
}

export const EquipmentFormDialog = ({
  open,
  onOpenChange,
  siteId,
  equipmentId,
  equipment,
  onSuccess,
}: EquipmentFormDialogProps) => {
  const isEditMode = Boolean(equipmentId && equipment)

  // Form state
  const [formData, setFormData] = useState<Partial<EquipmentFormData>>({
    siteId: siteId || equipment?.siteId,
    type: equipment?.type || 'battery',
    name: equipment?.name || '',
    manufacturer: equipment?.manufacturer || '',
    model: equipment?.model || '',
    serialNumber: equipment?.serialNumber || '',
    capacity: equipment?.capacity || undefined,
    voltage: equipment?.voltage || undefined,
    status: equipment?.status || 'operational',
    healthScore: equipment?.healthScore || undefined,
    installedAt: equipment?.installedAt ? new Date(equipment.installedAt) : undefined,
    warrantyExpiresAt: equipment?.warrantyExpiresAt ? new Date(equipment.warrantyExpiresAt) : undefined,
  })

  // Sites list
  const [sites, setSites] = useState<Site[]>([])
  const [loadingSites, setLoadingSites] = useState(true)

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [installedDateOpen, setInstalledDateOpen] = useState(false)
  const [warrantyDateOpen, setWarrantyDateOpen] = useState(false)

  // Load sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const result = await getSitesForFilter()
        if (result.success && result.sites) {
          setSites(result.sites)
        }
      } catch (error) {
        console.error('Failed to load sites:', error)
        toast.error('Failed to load sites')
      } finally {
        setLoadingSites(false)
      }
    }

    if (open) {
      fetchSites()
    }
  }, [open])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        siteId: siteId || equipment?.siteId,
        type: equipment?.type || 'battery',
        name: equipment?.name || '',
        manufacturer: equipment?.manufacturer || '',
        model: equipment?.model || '',
        serialNumber: equipment?.serialNumber || '',
        capacity: equipment?.capacity || undefined,
        voltage: equipment?.voltage || undefined,
        status: equipment?.status || 'operational',
        healthScore: equipment?.healthScore || undefined,
        installedAt: equipment?.installedAt ? new Date(equipment.installedAt) : undefined,
        warrantyExpiresAt: equipment?.warrantyExpiresAt ? new Date(equipment.warrantyExpiresAt) : undefined,
      })
      setErrors({})
    }
  }, [open, siteId, equipment])

  // Update form field
  const updateField = (field: keyof EquipmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    try {
      equipmentSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    setIsSubmitting(true)

    try {
      let result

      if (isEditMode && equipmentId) {
        // Update existing equipment
        result = await updateEquipment(equipmentId, {
          name: formData.name,
          manufacturer: formData.manufacturer || undefined,
          model: formData.model || undefined,
          serialNumber: formData.serialNumber || undefined,
          capacity: formData.capacity,
          voltage: formData.voltage,
          status: formData.status,
          healthScore: formData.healthScore,
          installedAt: formData.installedAt,
          warrantyExpiresAt: formData.warrantyExpiresAt,
        })
      } else {
        // Create new equipment
        result = await createEquipment({
          siteId: formData.siteId!,
          type: formData.type!,
          name: formData.name!,
          manufacturer: formData.manufacturer,
          model: formData.model,
          serialNumber: formData.serialNumber,
          capacity: formData.capacity,
          voltage: formData.voltage,
          status: formData.status,
          healthScore: formData.healthScore,
          installedAt: formData.installedAt,
          warrantyExpiresAt: formData.warrantyExpiresAt,
        })
      }

      if (result.success) {
        toast.success(isEditMode ? 'Equipment updated successfully' : 'Equipment created successfully')
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to save equipment')
      }
    } catch (error) {
      console.error('Error saving equipment:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get capacity unit based on equipment type
  const getCapacityUnit = () => {
    if (!formData.type) return 'kW'
    return EQUIPMENT_TYPES[formData.type].unit
  }

  // Get type icon
  const TypeIcon = formData.type ? EQUIPMENT_TYPES[formData.type].icon : Battery

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Equipment' : 'Add New Equipment'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the equipment details below.'
              : 'Fill in the details to add new equipment to your site.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Site Selection (only for create mode) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="siteId" className="text-sm font-medium">
                Site <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.siteId?.toString()}
                onValueChange={(value) => updateField('siteId', parseInt(value))}
                disabled={loadingSites || Boolean(siteId)}
              >
                <SelectTrigger
                  id="siteId"
                  className={cn("w-full", errors.siteId && "border-destructive")}
                  aria-invalid={Boolean(errors.siteId)}
                >
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.siteId && (
                <p className="text-sm text-destructive">{errors.siteId}</p>
              )}
            </div>
          )}

          {/* Equipment Type (only for create mode) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Equipment Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => updateField('type', value)}
              >
                <SelectTrigger
                  id="type"
                  className={cn("w-full", errors.type && "border-destructive")}
                  aria-invalid={Boolean(errors.type)}
                >
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EQUIPMENT_TYPES).map(([value, { label, icon: Icon }]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type}</p>
              )}
            </div>
          )}

          {/* Edit mode: Show current type */}
          {isEditMode && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Equipment Type</Label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted">
                <TypeIcon className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm">{formData.type && EQUIPMENT_TYPES[formData.type].label}</span>
              </div>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={cn(errors.name && "border-destructive")}
              aria-invalid={Boolean(errors.name)}
              placeholder="e.g., Main Battery Bank"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Manufacturer and Model - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer" className="text-sm font-medium">
                Manufacturer
              </Label>
              <Input
                id="manufacturer"
                type="text"
                value={formData.manufacturer}
                onChange={(e) => updateField('manufacturer', e.target.value)}
                placeholder="e.g., Tesla"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium">
                Model
              </Label>
              <Input
                id="model"
                type="text"
                value={formData.model}
                onChange={(e) => updateField('model', e.target.value)}
                placeholder="e.g., Powerwall 2"
              />
            </div>
          </div>

          {/* Serial Number */}
          <div className="space-y-2">
            <Label htmlFor="serialNumber" className="text-sm font-medium">
              Serial Number
            </Label>
            <Input
              id="serialNumber"
              type="text"
              value={formData.serialNumber}
              onChange={(e) => updateField('serialNumber', e.target.value)}
              placeholder="e.g., SN123456789"
            />
          </div>

          {/* Capacity and Voltage - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-sm font-medium">
                Capacity ({getCapacityUnit()})
              </Label>
              <Input
                id="capacity"
                type="number"
                step="0.01"
                min="0"
                value={formData.capacity || ''}
                onChange={(e) => updateField('capacity', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={cn(errors.capacity && "border-destructive")}
                aria-invalid={Boolean(errors.capacity)}
                placeholder="e.g., 13.5"
              />
              {errors.capacity && (
                <p className="text-sm text-destructive">{errors.capacity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="voltage" className="text-sm font-medium">
                Voltage (V)
              </Label>
              <Input
                id="voltage"
                type="number"
                step="0.1"
                min="0"
                value={formData.voltage || ''}
                onChange={(e) => updateField('voltage', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={cn(errors.voltage && "border-destructive")}
                aria-invalid={Boolean(errors.voltage)}
                placeholder="e.g., 500"
              />
              {errors.voltage && (
                <p className="text-sm text-destructive">{errors.voltage}</p>
              )}
            </div>
          </div>

          {/* Status and Health Score - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => updateField('status', value)}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthScore" className="text-sm font-medium">
                Health Score (0-100)
              </Label>
              <Input
                id="healthScore"
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.healthScore || ''}
                onChange={(e) => updateField('healthScore', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={cn(errors.healthScore && "border-destructive")}
                aria-invalid={Boolean(errors.healthScore)}
                placeholder="e.g., 95"
              />
              {errors.healthScore && (
                <p className="text-sm text-destructive">{errors.healthScore}</p>
              )}
            </div>
          </div>

          {/* Installed Date and Warranty Expiry - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installedAt" className="text-sm font-medium">
                Installed Date
              </Label>
              <Popover open={installedDateOpen} onOpenChange={setInstalledDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="installedAt"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.installedAt && "text-muted-foreground"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    {formData.installedAt ? (
                      format(formData.installedAt, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.installedAt}
                    onSelect={(date) => {
                      updateField('installedAt', date)
                      setInstalledDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyExpiresAt" className="text-sm font-medium">
                Warranty Expires
              </Label>
              <Popover open={warrantyDateOpen} onOpenChange={setWarrantyDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="warrantyExpiresAt"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.warrantyExpiresAt && "text-muted-foreground"
                    )}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    {formData.warrantyExpiresAt ? (
                      format(formData.warrantyExpiresAt, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.warrantyExpiresAt}
                    onSelect={(date) => {
                      updateField('warrantyExpiresAt', date)
                      setWarrantyDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Equipment' : 'Create Equipment'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
