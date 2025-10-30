'use client'

import { Suspense } from 'react'
import dynamicImport from 'next/dynamic'

const DashboardNav = dynamicImport(
  () => import('@/components/dashboard/nav').then(mod => ({ default: mod.DashboardNav })),
  { ssr: false }
)
const Sidebar = dynamicImport(
  () => import('@/components/dashboard/sidebar').then(mod => ({ default: mod.Sidebar })),
  { ssr: false }
)

export default function HandlerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile navigation bar */}
      <Suspense fallback={<div className="h-16 border-b md:hidden" />}>
        <DashboardNav />
      </Suspense>

      {/* Desktop layout with sidebar */}
      <div className="flex">
        {/* Desktop sidebar - hidden on mobile */}
        <aside className="hidden md:block">
          <Suspense fallback={<div className="w-64 h-screen border-r" />}>
            <Sidebar />
          </Suspense>
        </aside>

        {/* Main content area for Stack Auth */}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
