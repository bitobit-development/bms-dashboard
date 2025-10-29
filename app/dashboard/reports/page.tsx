import { Suspense } from 'react'
import { ReportsHeader } from '@/components/dashboard/reports/reports-header'
import { ReportsContent } from '@/components/dashboard/reports/reports-content'
import { ReportsSkeleton } from '@/components/dashboard/reports/reports-skeleton'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <ReportsHeader />
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsContent />
      </Suspense>
    </div>
  )
}
