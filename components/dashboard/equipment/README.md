# Equipment Form Dialog Component

A comprehensive, accessible form dialog component for creating and editing equipment in the BMS Dashboard.

## Files

- `equipment-form-dialog.tsx` - Main component
- `equipment-form-dialog.example.tsx` - Usage examples

## Features

### Core Functionality
- **Dual Mode Operation**: Create new equipment or edit existing equipment
- **Type-Safe Forms**: Full TypeScript support with Zod validation
- **Server Actions Integration**: Direct integration with equipment CRUD actions
- **Real-time Validation**: Client-side validation with helpful error messages
- **Toast Notifications**: User feedback for success and error states

### Equipment Support
Supports all equipment types:
- Battery (kWh capacity)
- Inverter (kW capacity)
- Solar Panel (kW capacity)
- Charge Controller (kW capacity)
- Grid Meter (kW capacity)

### Form Fields

#### Required Fields
- **Site** (create mode only) - Dropdown of available sites
- **Equipment Type** (create mode only) - Dropdown with icons
- **Name** - Text input for equipment name

#### Optional Fields
- **Manufacturer** - Text input
- **Model** - Text input
- **Serial Number** - Text input
- **Capacity** - Number input (unit changes based on type)
- **Voltage** - Number input (V)
- **Status** - Dropdown (operational, degraded, maintenance, failed, offline)
- **Health Score** - Number input (0-100)
- **Installed Date** - Date picker
- **Warranty Expires** - Date picker

### UI/UX Features

#### Responsive Design
- Mobile-first approach
- Stacked layout on mobile (`grid-cols-1`)
- Side-by-side fields on desktop (`md:grid-cols-2`)
- Maximum width: `max-w-2xl`
- Scrollable content: `max-h-[90vh] overflow-y-auto`

#### Accessibility
- Proper ARIA labels and attributes
- `aria-invalid` on fields with errors
- Screen reader support
- Keyboard navigation
- Focus management
- Semantic HTML structure

#### Visual Feedback
- Equipment type icons (Battery, Zap, Sun, Activity, Gauge)
- Loading spinner during submission
- Error messages below invalid fields
- Disabled states during submission
- Toast notifications for success/error

#### Smart Behavior
- Equipment type locked in edit mode (shown as read-only)
- Site locked when pre-filled or in edit mode
- Capacity unit changes based on equipment type
- Date pickers close automatically after selection
- Form resets when dialog closes

## Props Interface

```typescript
interface EquipmentFormDialogProps {
  open: boolean                  // Controls dialog visibility
  onOpenChange: (open: boolean) => void  // Callback for dialog state changes
  siteId?: number               // Pre-fill site (optional)
  equipmentId?: number          // Equipment ID for edit mode
  equipment?: Equipment         // Existing equipment data for edit mode
  onSuccess?: () => void        // Callback after successful create/update
}
```

## Usage Examples

### 1. Create New Equipment (No Pre-selected Site)

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EquipmentFormDialog } from '@/components/dashboard/equipment/equipment-form-dialog'

export function AddEquipmentButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Add Equipment
      </Button>

      <EquipmentFormDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          // Refresh your equipment list
          console.log('Equipment created!')
        }}
      />
    </>
  )
}
```

### 2. Create Equipment for Specific Site

```tsx
<EquipmentFormDialog
  open={open}
  onOpenChange={setOpen}
  siteId={123}  // Pre-fill site
  onSuccess={() => {
    router.refresh()  // Refresh the page
  }}
/>
```

### 3. Edit Existing Equipment

```tsx
import { getEquipmentById } from '@/app/actions/equipment-actions'

export function EditEquipmentButton({ equipmentId }: { equipmentId: number }) {
  const [open, setOpen] = useState(false)
  const [equipment, setEquipment] = useState(null)

  const handleEdit = async () => {
    const result = await getEquipmentById(equipmentId)
    if (result.success) {
      setEquipment(result.equipment)
      setOpen(true)
    }
  }

  return (
    <>
      <Button onClick={handleEdit}>Edit</Button>

      {equipment && (
        <EquipmentFormDialog
          open={open}
          onOpenChange={setOpen}
          equipmentId={equipment.id}
          equipment={equipment}
          onSuccess={() => {
            // Revalidate or refresh data
            console.log('Equipment updated!')
          }}
        />
      )}
    </>
  )
}
```

### 4. In Equipment List Component

```tsx
export function EquipmentList() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)

  const handleRefresh = () => {
    // Refresh equipment list
    router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <Button onClick={() => setCreateOpen(true)}>
        Add Equipment
      </Button>

      {/* Equipment Grid */}
      {equipment.map((item) => (
        <div key={item.id}>
          <Button onClick={() => {
            setSelectedEquipment(item)
            setEditOpen(true)
          }}>
            Edit
          </Button>
        </div>
      ))}

      {/* Dialogs */}
      <EquipmentFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleRefresh}
      />

      {selectedEquipment && (
        <EquipmentFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          equipmentId={selectedEquipment.id}
          equipment={selectedEquipment}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  )
}
```

## Validation Rules

The component uses Zod schema validation:

- **Site ID**: Required, must be positive number
- **Type**: Required, must be one of the 5 equipment types
- **Name**: Required, 1-100 characters
- **Manufacturer**: Optional, max 100 characters
- **Model**: Optional, max 100 characters
- **Serial Number**: Optional, max 100 characters
- **Capacity**: Optional, must be positive if provided
- **Voltage**: Optional, must be positive if provided
- **Status**: Optional, defaults to 'operational'
- **Health Score**: Optional, must be 0-100 if provided
- **Dates**: Optional, must be valid Date objects

## Server Actions

The component calls these server actions:

### createEquipment(data)
Creates new equipment record.

**Parameters:**
```typescript
{
  siteId: number
  type: 'inverter' | 'battery' | 'solar_panel' | 'charge_controller' | 'grid_meter'
  name: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  capacity?: number
  voltage?: number
  specs?: Record<string, any>
  status?: 'operational' | 'degraded' | 'maintenance' | 'failed' | 'offline'
  healthScore?: number
  installedAt?: Date
  warrantyExpiresAt?: Date
}
```

**Returns:**
```typescript
{
  success: boolean
  equipment?: Equipment
  error?: string
}
```

### updateEquipment(equipmentId, data)
Updates existing equipment record.

**Parameters:**
```typescript
equipmentId: number
data: {
  name?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  capacity?: number
  voltage?: number
  status?: 'operational' | 'degraded' | 'maintenance' | 'failed' | 'offline'
  healthScore?: number
  installedAt?: Date
  warrantyExpiresAt?: Date
}
```

**Returns:**
```typescript
{
  success: boolean
  equipment?: Equipment
  error?: string
}
```

### getSitesForFilter()
Fetches list of sites for the site dropdown.

**Returns:**
```typescript
{
  success: boolean
  sites: Array<{ id: number; name: string }>
}
```

## Styling

The component uses:
- **Tailwind CSS v4** - All styling via utility classes
- **shadcn/ui New York style** - Consistent design system
- **CSS Variables** - Theme-aware colors
- **Dark Mode** - Automatic support via CSS variables

## Accessibility Checklist

- [x] Semantic HTML elements
- [x] Proper ARIA labels on all inputs
- [x] `aria-invalid` on error fields
- [x] Screen reader text for icons
- [x] Keyboard navigation support
- [x] Focus indicators visible
- [x] Error messages announced
- [x] Loading states communicated
- [x] Form labels associated with inputs
- [x] Disabled states properly handled

## Known Limitations

1. **No Image Upload**: Equipment specs don't support image uploads currently
2. **No Bulk Operations**: Single equipment only, no batch create/edit
3. **Simple Specs Field**: The `specs` JSONB field is not exposed in the form (future enhancement)
4. **No Offline Support**: Requires network connection for server actions

## Future Enhancements

- [ ] Add specs field editor (JSON/key-value pairs)
- [ ] Add equipment photo upload
- [ ] Add maintenance schedule configuration
- [ ] Add duplicate equipment feature
- [ ] Add equipment history/audit log view
- [ ] Add QR code generation for equipment
- [ ] Add export equipment data (CSV/PDF)

## Testing

To test the component:

1. **Create Mode**: Click "Add Equipment" button
2. **Edit Mode**: Click "Edit" on existing equipment
3. **Validation**: Try submitting with empty required fields
4. **Site Selection**: Test with and without pre-selected site
5. **Equipment Types**: Test all 5 equipment types
6. **Dates**: Test date pickers for installed/warranty dates
7. **Error Handling**: Test with network failures
8. **Responsive**: Test on mobile, tablet, and desktop
9. **Accessibility**: Test with keyboard navigation and screen reader

## Dependencies

- React 19.2.0
- Zod 4.x
- date-fns 4.x
- sonner (toast notifications)
- lucide-react (icons)
- shadcn/ui components (Dialog, Button, Input, Select, Label, Calendar, Popover)

## File Location

`/components/dashboard/equipment/equipment-form-dialog.tsx`
