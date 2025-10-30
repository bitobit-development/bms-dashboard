'use server'

import { db } from '@/src/db'
import { organizationUsers, userAuditLog } from '@/src/db/schema'
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm'
import { hasPermission, canManageRole, isValidRole, type Role } from '@/lib/auth/permissions'
import { stackServerApp } from '@/app/stack'

// Types
export type UserFilters = {
  status?: 'pending' | 'active' | 'inactive' | 'suspended'
  role?: Role
  search?: string
  limit?: number
  offset?: number
}

export type UserWithDetails = typeof organizationUsers.$inferSelect

/**
 * Get current authenticated user from Stack Auth
 */
async function getCurrentUser() {
  const user = await stackServerApp.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user exists in organization_users table
  const [orgUser] = await db
    .select()
    .from(organizationUsers)
    .where(eq(organizationUsers.stackUserId, user.id))
    .limit(1)

  if (!orgUser) {
    throw new Error('User not found in organization')
  }

  if (orgUser.status !== 'active') {
    throw new Error('User account is not active')
  }

  return {
    id: user.id,
    name: `${orgUser.firstName || ''} ${orgUser.lastName || ''}`.trim() || user.displayName || user.primaryEmail || 'Unknown User',
    email: user.primaryEmail || orgUser.email,
    role: orgUser.role as Role,
  }
}

/**
 * Create audit log entry
 */
async function createAuditLog(params: {
  userId: number
  action: 'approve' | 'reject' | 'role_change' | 'invite' | 'suspend' | 'activate' | 'delete'
  performedBy: string
  performedByName: string
  details?: Record<string, any>
}) {
  await db.insert(userAuditLog).values({
    userId: params.userId,
    action: params.action,
    performedBy: params.performedBy,
    performedByName: params.performedByName,
    details: params.details,
  })
}

/**
 * Get users with filters
 */
export async function getUsers(filters: UserFilters = {}) {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'view_users')) {
    throw new Error('Unauthorized: You do not have permission to view users')
  }

  const conditions = []

  if (filters.status) {
    conditions.push(eq(organizationUsers.status, filters.status))
  }

  if (filters.role) {
    conditions.push(eq(organizationUsers.role, filters.role))
  }

  if (filters.search) {
    conditions.push(
      or(
        ilike(organizationUsers.email, `%${filters.search}%`),
        ilike(organizationUsers.firstName, `%${filters.search}%`),
        ilike(organizationUsers.lastName, `%${filters.search}%`)
      )
    )
  }

  const query = db
    .select()
    .from(organizationUsers)
    .orderBy(desc(organizationUsers.createdAt))

  if (conditions.length > 0) {
    query.where(and(...conditions))
  }

  if (filters.limit) {
    query.limit(filters.limit)
  }

  if (filters.offset) {
    query.offset(filters.offset)
  }

  const users = await query

  return {
    success: true,
    users,
  }
}

/**
 * Get pending users (approval queue)
 */
export async function getPendingUsers() {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'approve_users')) {
    throw new Error('Unauthorized: You do not have permission to approve users')
  }

  const users = await db
    .select()
    .from(organizationUsers)
    .where(eq(organizationUsers.status, 'pending'))
    .orderBy(organizationUsers.invitedAt)

  return {
    success: true,
    users,
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'view_users')) {
    throw new Error('Unauthorized: You do not have permission to view users')
  }

  const [user] = await db
    .select()
    .from(organizationUsers)
    .where(eq(organizationUsers.id, userId))
    .limit(1)

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    }
  }

  return {
    success: true,
    user,
  }
}

/**
 * Approve a pending user
 */
export async function approveUser(userId: number) {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'approve_users')) {
    throw new Error('Unauthorized: You do not have permission to approve users')
  }

  try {
    // Get the user
    const [user] = await db
      .select()
      .from(organizationUsers)
      .where(eq(organizationUsers.id, userId))
      .limit(1)

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    if (user.status !== 'pending') {
      return {
        success: false,
        error: 'User is not pending approval',
      }
    }

    // Update user status
    const [updatedUser] = await db
      .update(organizationUsers)
      .set({
        status: 'active',
        acceptedAt: new Date(),
      })
      .where(eq(organizationUsers.id, userId))
      .returning()

    // Create audit log
    await createAuditLog({
      userId,
      action: 'approve',
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: {
        email: user.email,
        role: user.role,
      },
    })

    return {
      success: true,
      user: updatedUser,
      message: 'User approved successfully',
    }
  } catch (error) {
    console.error('Error approving user:', error)
    return {
      success: false,
      error: 'Failed to approve user',
    }
  }
}

/**
 * Reject a pending user
 */
export async function rejectUser(userId: number, reason?: string) {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'approve_users')) {
    throw new Error('Unauthorized: You do not have permission to reject users')
  }

  try {
    // Get the user
    const [user] = await db
      .select()
      .from(organizationUsers)
      .where(eq(organizationUsers.id, userId))
      .limit(1)

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    if (user.status !== 'pending') {
      return {
        success: false,
        error: 'User is not pending approval',
      }
    }

    // Update user status
    const [updatedUser] = await db
      .update(organizationUsers)
      .set({
        status: 'suspended',
      })
      .where(eq(organizationUsers.id, userId))
      .returning()

    // Create audit log
    await createAuditLog({
      userId,
      action: 'reject',
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: {
        email: user.email,
        reason,
      },
    })

    return {
      success: true,
      user: updatedUser,
      message: 'User rejected successfully',
    }
  } catch (error) {
    console.error('Error rejecting user:', error)
    return {
      success: false,
      error: 'Failed to reject user',
    }
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: number, newRole: string) {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'change_roles')) {
    throw new Error('Unauthorized: You do not have permission to change user roles')
  }

  if (!isValidRole(newRole)) {
    return {
      success: false,
      error: 'Invalid role',
    }
  }

  try {
    // Get the user
    const [user] = await db
      .select()
      .from(organizationUsers)
      .where(eq(organizationUsers.id, userId))
      .limit(1)

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    // Check if current user can manage the target role
    if (!canManageRole(currentUser.role, user.role as Role)) {
      return {
        success: false,
        error: 'You cannot manage users with this role',
      }
    }

    if (!canManageRole(currentUser.role, newRole)) {
      return {
        success: false,
        error: 'You cannot assign this role',
      }
    }

    // Update user role
    const [updatedUser] = await db
      .update(organizationUsers)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(eq(organizationUsers.id, userId))
      .returning()

    // Create audit log
    await createAuditLog({
      userId,
      action: 'role_change',
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: {
        oldValue: user.role,
        newValue: newRole,
        email: user.email,
      },
    })

    return {
      success: true,
      user: updatedUser,
      message: 'User role updated successfully',
    }
  } catch (error) {
    console.error('Error updating user role:', error)
    return {
      success: false,
      error: 'Failed to update user role',
    }
  }
}

/**
 * Invite new user
 */
export async function inviteUser(email: string, role: string, organizationId: number = 1) {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'invite_users')) {
    throw new Error('Unauthorized: You do not have permission to invite users')
  }

  if (!isValidRole(role)) {
    return {
      success: false,
      error: 'Invalid role',
    }
  }

  if (!canManageRole(currentUser.role, role)) {
    return {
      success: false,
      error: 'You cannot invite users with this role',
    }
  }

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.email, email),
          eq(organizationUsers.organizationId, organizationId)
        )
      )
      .limit(1)

    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists in the organization',
      }
    }

    // Create new user
    const [newUser] = await db
      .insert(organizationUsers)
      .values({
        organizationId,
        stackUserId: `temp-${Date.now()}`, // Temporary - will be updated when user accepts
        email,
        role,
        status: 'pending',
        invitedBy: currentUser.id,
        invitedAt: new Date(),
      })
      .returning()

    // Create audit log
    await createAuditLog({
      userId: newUser.id,
      action: 'invite',
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: {
        email,
        role,
      },
    })

    return {
      success: true,
      user: newUser,
      message: 'User invited successfully',
    }
  } catch (error) {
    console.error('Error inviting user:', error)
    return {
      success: false,
      error: 'Failed to invite user',
    }
  }
}

/**
 * Suspend user
 */
export async function suspendUser(userId: number, reason?: string) {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'suspend_users')) {
    throw new Error('Unauthorized: You do not have permission to suspend users')
  }

  try {
    const [user] = await db
      .select()
      .from(organizationUsers)
      .where(eq(organizationUsers.id, userId))
      .limit(1)

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    if (!canManageRole(currentUser.role, user.role as Role)) {
      return {
        success: false,
        error: 'You cannot suspend users with this role',
      }
    }

    const [updatedUser] = await db
      .update(organizationUsers)
      .set({
        status: 'suspended',
        updatedAt: new Date(),
      })
      .where(eq(organizationUsers.id, userId))
      .returning()

    await createAuditLog({
      userId,
      action: 'suspend',
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: {
        email: user.email,
        reason,
      },
    })

    return {
      success: true,
      user: updatedUser,
      message: 'User suspended successfully',
    }
  } catch (error) {
    console.error('Error suspending user:', error)
    return {
      success: false,
      error: 'Failed to suspend user',
    }
  }
}

/**
 * Activate suspended user
 */
export async function activateUser(userId: number) {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'suspend_users')) {
    throw new Error('Unauthorized: You do not have permission to activate users')
  }

  try {
    const [user] = await db
      .select()
      .from(organizationUsers)
      .where(eq(organizationUsers.id, userId))
      .limit(1)

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    if (!canManageRole(currentUser.role, user.role as Role)) {
      return {
        success: false,
        error: 'You cannot activate users with this role',
      }
    }

    const [updatedUser] = await db
      .update(organizationUsers)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(organizationUsers.id, userId))
      .returning()

    await createAuditLog({
      userId,
      action: 'activate',
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: {
        email: user.email,
      },
    })

    return {
      success: true,
      user: updatedUser,
      message: 'User activated successfully',
    }
  } catch (error) {
    console.error('Error activating user:', error)
    return {
      success: false,
      error: 'Failed to activate user',
    }
  }
}

/**
 * Get audit log for a user (or all users)
 */
export async function getAuditLog(userId?: number, limit: number = 50) {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'view_audit')) {
    throw new Error('Unauthorized: You do not have permission to view audit logs')
  }

  try {
    const query = db
      .select()
      .from(userAuditLog)
      .orderBy(desc(userAuditLog.createdAt))
      .limit(limit)

    if (userId) {
      query.where(eq(userAuditLog.userId, userId))
    }

    const logs = await query

    return {
      success: true,
      logs,
    }
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return {
      success: false,
      error: 'Failed to fetch audit log',
    }
  }
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  const currentUser = await getCurrentUser()

  if (!hasPermission(currentUser.role, 'view_users')) {
    throw new Error('Unauthorized: You do not have permission to view user statistics')
  }

  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        active: sql<number>`count(*) filter (where status = 'active')::int`,
        suspended: sql<number>`count(*) filter (where status = 'suspended')::int`,
        adminCount: sql<number>`count(*) filter (where role = 'admin')::int`,
        operatorCount: sql<number>`count(*) filter (where role = 'operator')::int`,
        viewerCount: sql<number>`count(*) filter (where role = 'viewer')::int`,
      })
      .from(organizationUsers)

    return {
      success: true,
      stats,
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {
      success: false,
      error: 'Failed to fetch user statistics',
    }
  }
}
