'use client'

import { Suspense } from 'react'
import dynamicImport from 'next/dynamic'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

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
      <div className="flex min-h-screen">
        {/* Desktop sidebar - hidden on mobile */}
        <aside className="hidden md:block md:fixed md:h-screen md:left-0 md:top-0">
          <Suspense fallback={<div className="w-64 lg:w-72 xl:w-80 h-screen border-r" />}>
            <Sidebar />
          </Suspense>
        </aside>

        {/* Main content area for Stack Auth with responsive margin */}
        <main className="flex-1 w-full md:ml-64 lg:ml-72 xl:ml-80 overflow-x-hidden">
          <div className="container max-w-full py-6 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
            <Breadcrumb />
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
