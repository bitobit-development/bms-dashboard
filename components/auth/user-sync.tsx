import { syncUserToDatabase } from '@/src/lib/actions/users'

/**
 * Server component that ensures Stack Auth users are synced to the database
 * This runs on every dashboard page load to catch new signups
 */
export async function UserSync() {
  // Silently sync the user - this will:
  // 1. Check if user exists in database
  // 2. If not, create them with 'pending' status
  // 3. If they exist, do nothing
  await syncUserToDatabase()

  return null
}
