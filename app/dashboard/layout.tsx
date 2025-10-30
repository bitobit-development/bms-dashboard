'use client'

import dynamicImport from 'next/dynamic'

const DashboardNav = dynamicImport(() => import('@/components/dashboard/nav').then(mod => ({ default: mod.DashboardNav })), { ssr: false })
const Sidebar = dynamicImport(() => import('@/components/dashboard/sidebar').then(mod => ({ default: mod.Sidebar })), { ssr: false })

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile navigation bar */}
      <DashboardNav />

      {/* Desktop layout with sidebar */}
      <div className="flex">
        {/* Desktop sidebar - hidden on mobile */}
        <aside className="hidden md:block">
          <Sidebar />
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
