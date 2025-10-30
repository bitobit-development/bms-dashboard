import { DashboardNav } from '@/components/dashboard/nav'
import { Sidebar } from '@/components/dashboard/sidebar'
import { stackServerApp } from '@/app/stack'
import { redirect } from 'next/navigation'
import { db } from '@/src/db'
import { organizationUsers } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  // Check if user is authenticated
  const user = await stackServerApp.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user exists in organization and has admin role
  const [orgUser] = await db
    .select()
    .from(organizationUsers)
    .where(eq(organizationUsers.stackUserId, user.id))
    .limit(1)

  if (!orgUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Your account is not registered in this organization. Please contact an administrator.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  if (orgUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            You do not have permission to access the management section. Admin role required.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  if (orgUser.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Account Inactive
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Your account is {orgUser.status}. Please contact an administrator.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

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
