import { Suspense } from 'react'
import { AlertsHeader } from '@/components/dashboard/alerts/alerts-header'
import { AlertsContent } from '@/components/dashboard/alerts/alerts-content'
import { AlertsSkeleton } from '@/components/dashboard/alerts/alerts-skeleton'

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <AlertsHeader />
      <Suspense fallback={<AlertsSkeleton />}>
        <AlertsContent />
      </Suspense>
    </div>
  )
}
