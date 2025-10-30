import { DashboardNav } from '@/components/dashboard/nav'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile navigation bar */}
      <Suspense fallback={null}>
        <DashboardNav />
      </Suspense>

      {/* Desktop layout with sidebar */}
      <div className="flex">
        {/* Desktop sidebar - hidden on mobile */}
        <aside className="hidden md:block">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
        </aside>

        {/* Main content area with proper spacing */}
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6 px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
