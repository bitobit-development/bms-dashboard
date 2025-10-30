/**
 * Permission System
 *
 * Role-based access control for the BMS Dashboard.
 */

export type Role = 'owner' | 'admin' | 'operator' | 'viewer'
export type Permission =
  | 'manage_users'
  | 'approve_users'
  | 'change_roles'
  | 'view_audit'
  | 'view_users'
  | 'invite_users'
  | 'suspend_users'
  | 'delete_users'
  | 'view_own_profile'
  | 'manage_sites'
  | 'edit_sites'
  | 'delete_sites'
  | 'view_sites'
  | 'manage_equipment'
  | 'edit_equipment'
  | 'view_equipment'
  | 'acknowledge_alerts'
  | 'dismiss_alerts'
  | 'view_alerts'
  | 'edit_settings'
  | 'view_settings'

/**
 * Permission matrix defining what each role can do
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    // User management (full)
    'manage_users',
    'approve_users',
    'change_roles',
    'view_audit',
    'view_users',
    'invite_users',
    'suspend_users',
    'delete_users',
    'view_own_profile',
    // Site management (full)
    'manage_sites',
    'edit_sites',
    'delete_sites',
    'view_sites',
    // Equipment management (full)
    'manage_equipment',
    'edit_equipment',
    'view_equipment',
    // Alerts (full)
    'acknowledge_alerts',
    'dismiss_alerts',
    'view_alerts',
    // Settings (full)
    'edit_settings',
    'view_settings',
  ],
  admin: [
    // User management (limited - cannot manage owners)
    'approve_users',
    'change_roles',
    'view_audit',
    'view_users',
    'invite_users',
    'suspend_users',
    'view_own_profile',
    // Site management (full)
    'manage_sites',
    'edit_sites',
    'delete_sites',
    'view_sites',
    // Equipment management (full)
    'manage_equipment',
    'edit_equipment',
    'view_equipment',
    // Alerts (full)
    'acknowledge_alerts',
    'dismiss_alerts',
    'view_alerts',
    // Settings (limited)
    'view_settings',
  ],
  operator: [
    // User management (view only)
    'view_users',
    'view_own_profile',
    // Site management (view only)
    'view_sites',
    // Equipment management (view and edit)
    'edit_equipment',
    'view_equipment',
    // Alerts (acknowledge only)
    'acknowledge_alerts',
    'view_alerts',
    // Settings (view only)
    'view_settings',
  ],
  viewer: [
    // User management (own profile only)
    'view_own_profile',
    // Site management (view only)
    'view_sites',
    // Equipment management (view only)
    'view_equipment',
    // Alerts (view only)
    'view_alerts',
    // Settings (view only)
    'view_settings',
  ],
}

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: Role, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

/**
 * Check if a role can manage another role
 * Owners can manage anyone
 * Admins can manage operators and viewers
 * Operators and viewers cannot manage anyone
 */
export const canManageRole = (managerRole: Role, targetRole: Role): boolean => {
  if (managerRole === 'owner') return true
  if (managerRole === 'admin' && (targetRole === 'operator' || targetRole === 'viewer')) return true
  return false
}

/**
 * Get all permissions for a role
 */
export const getPermissions = (role: Role): Permission[] => {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if a user has access to the management section
 */
export const canAccessManagement = (role: Role): boolean => {
  return hasPermission(role, 'view_users') || hasPermission(role, 'approve_users')
}

/**
 * Validate role value
 */
export const isValidRole = (role: string): role is Role => {
  return ['owner', 'admin', 'operator', 'viewer'].includes(role)
}
