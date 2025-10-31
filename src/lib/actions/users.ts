'use server'

import { db } from '@/src/db'
import { organizationUsers, userActivityLog } from '@/src/db/schema/users'
import { organizations } from '@/src/db/schema/organizations'
import { eq, and } from 'drizzle-orm'
import { stackServerApp } from '@/app/stack'
import { revalidatePath } from 'next/cache'
import { notifyAdminsNewUser, notifyUserApproved, notifyUserRejected } from '@/src/lib/email'

/**
 * Log user activity for audit trail
 */
async function logUserActivity(
  stackUserId: string,
  action: string,
  details?: Record<string, unknown>,
  organizationId?: number | null
) {
  try {
    await db.insert(userActivityLog).values({
      stackUserId,
      organizationId: organizationId || null,
      action,
      resource: 'user',
      details: details || {},
      createdAt: new Date(),
    })
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('Failed to log user activity:', error)
  }
}

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

    // Log user creation for audit trail
    await logUserActivity(user.id, 'user_created', {
      email: user.primaryEmail,
      status: 'pending',
      role: 'viewer',
    }, org.id)

    // Notify admins about new user signup
    await notifyAdminsNewUser(
      user.primaryEmail || '',
      user.displayName || undefined
    )

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

    // Get user being approved
    const userToApprove = await db.query.organizationUsers.findFirst({
      where: eq(organizationUsers.id, userId),
    })

    if (!userToApprove) {
      return { success: false, error: 'User not found' }
    }

    // Approve the user
    await db.update(organizationUsers)
      .set({
        status: 'active',
        acceptedAt: new Date(),
      })
      .where(eq(organizationUsers.id, userId))

    // Log approval action
    await logUserActivity(currentUser.id, 'user_approved', {
      approvedUserId: userId,
      approvedUserEmail: userToApprove.email,
      role: adminUser.role,
    }, adminUser.organizationId)

    // Log event for approved user
    await logUserActivity(userToApprove.stackUserId, 'user_status_changed', {
      oldStatus: 'pending',
      newStatus: 'active',
      approvedBy: currentUser.id,
    }, userToApprove.organizationId)

    // Notify user about approval
    const userName = [userToApprove.firstName, userToApprove.lastName]
      .filter(Boolean)
      .join(' ') || undefined
    await notifyUserApproved(userToApprove.email, userName)

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

    // Get user being rejected
    const userToReject = await db.query.organizationUsers.findFirst({
      where: eq(organizationUsers.id, userId),
    })

    if (!userToReject) {
      return { success: false, error: 'User not found' }
    }

    // Update user status to inactive
    await db.update(organizationUsers)
      .set({ status: 'inactive' })
      .where(eq(organizationUsers.id, userId))

    // Log rejection action
    await logUserActivity(currentUser.id, 'user_rejected', {
      rejectedUserId: userId,
      rejectedUserEmail: userToReject.email,
      role: adminUser.role,
    }, adminUser.organizationId)

    // Log event for rejected user
    await logUserActivity(userToReject.stackUserId, 'user_status_changed', {
      oldStatus: userToReject.status,
      newStatus: 'inactive',
      rejectedBy: currentUser.id,
    }, userToReject.organizationId)

    // Notify user about rejection
    const userName = [userToReject.firstName, userToReject.lastName]
      .filter(Boolean)
      .join(' ') || undefined
    await notifyUserRejected(userToReject.email, userName)

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

/**
 * Get count of pending users (for dashboard metrics)
 */
export async function getPendingUsersCount() {
  try {
    const currentUser = await stackServerApp.getUser()

    if (!currentUser) {
      return { success: false, count: 0 }
    }

    // Check if current user is admin
    const adminUser = await db.query.organizationUsers.findFirst({
      where: eq(organizationUsers.stackUserId, currentUser.id),
    })

    if (!adminUser || !['owner', 'admin'].includes(adminUser.role)) {
      return { success: false, count: 0 }
    }

    const pendingUsers = await db.query.organizationUsers.findMany({
      where: and(
        eq(organizationUsers.organizationId, adminUser.organizationId),
        eq(organizationUsers.status, 'pending')
      ),
    })

    return { success: true, count: pendingUsers.length }
  } catch (error) {
    console.error('Error getting pending users count:', error)
    return { success: false, count: 0 }
  }
}
