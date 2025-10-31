import { stackServerApp } from '@/app/stack'
import { db } from '@/src/db'
import { organizationUsers } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export default async function DebugUserPage() {
  const stackUser = await stackServerApp.getUser()

  if (!stackUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-4">🔍 User Debug Info</h1>
          <p className="text-red-600">❌ Not authenticated. Please sign in first.</p>
          <a href="/login" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  // Find user in database
  const dbUser = await db
    .select()
    .from(organizationUsers)
    .where(eq(organizationUsers.stackUserId, stackUser.id))
    .limit(1)

  // Find user by email
  const emailUser = await db
    .select()
    .from(organizationUsers)
    .where(eq(organizationUsers.email, stackUser.primaryEmail || ''))
    .limit(1)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">🔍 User Debug Information</h1>

          {/* Stack Auth User */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-green-600">✅ Stack Auth User (Logged In)</h2>
            <div className="bg-slate-100 dark:bg-slate-700 rounded p-4 font-mono text-sm space-y-2">
              <div><strong>Stack User ID:</strong> <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">{stackUser.id}</code></div>
              <div><strong>Email:</strong> {stackUser.primaryEmail}</div>
              <div><strong>Display Name:</strong> {stackUser.displayName || 'Not set'}</div>
              <div><strong>Email Verified:</strong> {stackUser.primaryEmailVerified ? '✅ Yes' : '❌ No'}</div>
            </div>
          </div>

          {/* Database User by Stack ID */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {dbUser.length > 0 ? '✅' : '❌'} Database User (by Stack User ID)
            </h2>
            {dbUser.length > 0 ? (
              <div className="bg-slate-100 dark:bg-slate-700 rounded p-4 font-mono text-sm space-y-2">
                <div><strong>Database ID:</strong> {dbUser[0].id}</div>
                <div><strong>Stack User ID:</strong> {dbUser[0].stackUserId}</div>
                <div><strong>Email:</strong> {dbUser[0].email}</div>
                <div><strong>Role:</strong> <span className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">{dbUser[0].role}</span></div>
                <div><strong>Status:</strong> <span className="bg-green-200 dark:bg-green-800 px-2 py-1 rounded">{dbUser[0].status}</span></div>
                <div><strong>Organization ID:</strong> {dbUser[0].organizationId}</div>
              </div>
            ) : (
              <div className="bg-red-100 dark:bg-red-900 rounded p-4 text-red-800 dark:text-red-200">
                <p className="font-semibold">⚠️ No user found in database with this Stack User ID!</p>
                <p className="text-sm mt-2">This is why you're getting "Access Denied"</p>
              </div>
            )}
          </div>

          {/* Database User by Email */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {emailUser.length > 0 ? '✅' : '❌'} Database User (by Email)
            </h2>
            {emailUser.length > 0 ? (
              <div className="bg-slate-100 dark:bg-slate-700 rounded p-4 font-mono text-sm space-y-2">
                <div><strong>Database ID:</strong> {emailUser[0].id}</div>
                <div><strong>Stack User ID:</strong> <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">{emailUser[0].stackUserId}</code></div>
                <div><strong>Email:</strong> {emailUser[0].email}</div>
                <div><strong>Role:</strong> <span className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">{emailUser[0].role}</span></div>
                <div><strong>Status:</strong> <span className="bg-green-200 dark:bg-green-800 px-2 py-1 rounded">{emailUser[0].status}</span></div>
              </div>
            ) : (
              <div className="bg-orange-100 dark:bg-orange-900 rounded p-4 text-orange-800 dark:text-orange-200">
                <p className="font-semibold">⚠️ No user found with this email in database!</p>
              </div>
            )}
          </div>

          {/* Problem Diagnosis */}
          {dbUser.length === 0 && emailUser.length > 0 && (
            <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-6 border-2 border-yellow-500">
              <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">🔧 Fix Required</h2>
              <p className="mb-4 text-yellow-800 dark:text-yellow-200">
                Your database has a user with email <strong>{stackUser.primaryEmail}</strong>, but with a different Stack User ID.
              </p>
              <p className="mb-4 text-yellow-800 dark:text-yellow-200">
                Database has: <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">{emailUser[0].stackUserId}</code>
              </p>
              <p className="mb-4 text-yellow-800 dark:text-yellow-200">
                Stack Auth has: <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">{stackUser.id}</code>
              </p>
              <div className="bg-white dark:bg-slate-800 rounded p-4 mt-4">
                <p className="font-semibold mb-2">Run this command to fix:</p>
                <code className="block bg-slate-100 dark:bg-slate-900 p-3 rounded text-sm">
                  pnpm user:sync-stack-id
                </code>
              </div>
            </div>
          )}

          {/* Back Link */}
          <div className="mt-8">
            <a href="/dashboard" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
