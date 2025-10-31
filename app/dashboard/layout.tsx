import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { stackServerApp } from '@/app/stack'
import { db } from '@/src/db'
import { organizationUsers } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { PendingApproval } from '@/components/auth/pending-approval'
import { AccountInactive } from '@/components/auth/account-inactive'
import { DashboardNav } from '@/components/dashboard/nav'
import { Sidebar } from '@/components/dashboard/sidebar'
import { syncUserToDatabase } from '@/src/lib/actions/users'

function LoadingNav() {
  return (
    <div className="h-16 border-b bg-background flex items-center justify-center md:hidden">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
    </div>
  )
}

function LoadingSidebar() {
  return (
    <div className="w-64 lg:w-72 xl:w-80 h-screen border-r bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Check if user is authenticated
  const user = await stackServerApp.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user exists in organization and verify status
  let [orgUser] = await db
    .select()
    .from(organizationUsers)
    .where(eq(organizationUsers.stackUserId, user.id))
    .limit(1)

  if (!orgUser) {
    // User authenticated but not in database - sync them now
    const syncResult = await syncUserToDatabase()
    if (!syncResult.success || !syncResult.user) {
      redirect('/login?error=sync_failed')
    }
    orgUser = syncResult.user
  }

  // 🔒 CRITICAL: Block pending users from accessing dashboard
  if (orgUser.status === 'pending') {
    return (
      <PendingApproval
        userEmail={user.primaryEmail}
        userName={user.displayName}
      />
    )
  }

  // Block inactive, suspended, or rejected users
  if (orgUser.status !== 'active') {
    return (
      <AccountInactive
        status={orgUser.status}
        userEmail={user.primaryEmail}
        userName={user.displayName}
      />
    )
  }

  // User is active - allow access to dashboard
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile navigation bar */}
      <Suspense fallback={<LoadingNav />}>
        <DashboardNav />
      </Suspense>

      {/* Desktop layout with sidebar */}
      <div className="flex min-h-screen">
        {/* Desktop sidebar - hidden on mobile */}
        <aside className="hidden md:block md:fixed md:h-screen md:left-0 md:top-0">
          <Suspense fallback={<LoadingSidebar />}>
            <Sidebar />
          </Suspense>
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
