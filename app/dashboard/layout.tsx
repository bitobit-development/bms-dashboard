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
      <div className="flex min-h-screen">
        {/* Desktop sidebar - hidden on mobile */}
        <aside className="hidden md:block md:fixed md:h-screen md:left-0 md:top-0">
          <Sidebar />
        </aside>

        {/* Main content area with proper spacing and responsive margin */}
        <main className="flex-1 w-full md:ml-64 lg:ml-72 xl:ml-80 overflow-x-hidden">
          <div className="container max-w-full py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
