import { Suspense } from 'react'
import { AnalyticsHeader } from '@/components/dashboard/analytics/analytics-header'
import { AnalyticsContent } from '@/components/dashboard/analytics/analytics-content'
import { AnalyticsSkeleton } from '@/components/dashboard/analytics/analytics-skeleton'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <AnalyticsHeader />
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  )
}
