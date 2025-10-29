import { Suspense } from 'react'
import { SitesHeader } from '@/components/dashboard/sites/sites-header'
import { SitesContent } from '@/components/dashboard/sites/sites-content'
import { SitesSkeleton } from '@/components/dashboard/sites/sites-skeleton'

export default function SitesPage() {
  return (
    <div className="space-y-6">
      <SitesHeader />
      <Suspense fallback={<SitesSkeleton />}>
        <SitesContent />
      </Suspense>
    </div>
  )
}
