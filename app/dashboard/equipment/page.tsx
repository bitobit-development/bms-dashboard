import { Suspense } from 'react'
import { EquipmentHeader } from '@/components/dashboard/equipment/equipment-header'
import { EquipmentContent } from '@/components/dashboard/equipment/equipment-content'
import { EquipmentSkeleton } from '@/components/dashboard/equipment/equipment-skeleton'

export default function EquipmentPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<EquipmentSkeleton />}>
        <EquipmentHeader />
        <EquipmentContent />
      </Suspense>
    </div>
  )
}
