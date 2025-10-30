'use server'

import { db } from '@/src/db'
import { organizationUsers } from '@/src/db/schema/users'
import { organizations } from '@/src/db/schema/organizations'
import { eq, and } from 'drizzle-orm'
import { stackServerApp } from '@/app/stack'
import { revalidatePath } from 'next/cache'

/**
 * Sync Stack Auth user to database as pending
 * Called when a user signs up
 */
export async function syncUserToDatabase() {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if user already exists
    const existingUser = await db.query.organizationUsers.findFirst({
      where: eq(organizationUsers.stackUserId, user.id),
    })

    if (existingUser) {
      return { success: true, user: existingUser }
    }

    // Get or create default organization
    let org = await db.query.organizations.findFirst()

    if (!org) {
      // Create default organization
      const [newOrg] = await db.insert(organizations).values({
        name: 'Default Organization',
        slug: 'default',
        settings: {},
      }).returning()
      org = newOrg
    }

    // Create user in database with pending status
    const [newUser] = await db.insert(organizationUsers).values({
      organizationId: org.id,
      stackUserId: user.id,
      email: user.primaryEmail || '',
      firstName: user.displayName?.split(' ')[0] || null,
      lastName: user.displayName?.split(' ').slice(1).join(' ') || null,
      role: 'viewer',
      status: 'pending',
    }).returning()

    return { success: true, user: newUser }
  } catch (error) {
    console.error('Error syncing user to database:', error)
    return { success: false, error: 'Failed to sync user' }
  }
}

/**
 * Approve a pending user
 */
export async function approveUser(userId: number) {
  try {
    const currentUser = await stackServerApp.getUser()

    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if current user is admin
    const adminUser = await db.query.organizationUsers.findFirst({
      where: eq(organizationUsers.stackUserId, currentUser.id),
    })

    if (!adminUser || !['owner', 'admin'].includes(adminUser.role)) {
      return { success: false, error: 'Not authorized' }
    }

    // Approve the user
    await db.update(organizationUsers)
      .set({
        status: 'active',
        acceptedAt: new Date(),
      })
      .where(eq(organizationUsers.id, userId))

    revalidatePath('/management/users')
    revalidatePath('/management/users/pending')

    return { success: true }
  } catch (error) {
    console.error('Error approving user:', error)
    return { success: false, error: 'Failed to approve user' }
  }
}

/**
 * Reject a pending user
 */
export async function rejectUser(userId: number) {
  try {
    const currentUser = await stackServerApp.getUser()

    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if current user is admin
    const adminUser = await db.query.organizationUsers.findFirst({
      where: eq(organizationUsers.stackUserId, currentUser.id),
    })

    if (!adminUser || !['owner', 'admin'].includes(adminUser.role)) {
      return { success: false, error: 'Not authorized' }
    }

    // Update user status to inactive
    await db.update(organizationUsers)
      .set({ status: 'inactive' })
      .where(eq(organizationUsers.id, userId))

    revalidatePath('/management/users')
    revalidatePath('/management/users/pending')

    return { success: true }
  } catch (error) {
    console.error('Error rejecting user:', error)
    return { success: false, error: 'Failed to reject user' }
  }
}

/**
 * Get pending users
 */
export async function getPendingUsers() {
  try {
    const currentUser = await stackServerApp.getUser()

    if (!currentUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if current user is admin
    const adminUser = await db.query.organizationUsers.findFirst({
      where: eq(organizationUsers.stackUserId, currentUser.id),
    })

    if (!adminUser || !['owner', 'admin'].includes(adminUser.role)) {
      return { success: false, error: 'Not authorized' }
    }

    const pendingUsers = await db.query.organizationUsers.findMany({
      where: and(
        eq(organizationUsers.organizationId, adminUser.organizationId),
        eq(organizationUsers.status, 'pending')
      ),
    })

    return { success: true, users: pendingUsers }
  } catch (error) {
    console.error('Error getting pending users:', error)
    return { success: false, error: 'Failed to get pending users' }
  }
}
