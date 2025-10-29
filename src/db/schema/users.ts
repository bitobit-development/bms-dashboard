/**
 * Users Schema
 *
 * User management for BMS platform. This complements Stack Auth for additional
 * application-specific user data and organization memberships.
 *
 * Stack Auth handles authentication, this schema handles authorization
 * and application-specific user data.
 */

import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'

/**
 * Organization users - maps users to organizations with roles
 */
export const organizationUsers = pgTable('organization_users', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // User identification (from Stack Auth)
  stackUserId: text('stack_user_id').notNull(), // Stack Auth user ID
  email: text('email').notNull(),

  // User profile
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  avatar: text('avatar'), // URL to avatar image

  // Role and permissions
  role: text('role', {
    enum: ['owner', 'admin', 'operator', 'viewer']
  }).notNull().default('viewer'),

  // Permissions can override role defaults
  permissions: jsonb('permissions').$type<{
    sites?: {
      view?: boolean
      edit?: boolean
      delete?: boolean
    }
    alerts?: {
      view?: boolean
      acknowledge?: boolean
      dismiss?: boolean
    }
    equipment?: {
      view?: boolean
      edit?: boolean
      maintain?: boolean
    }
    users?: {
      view?: boolean
      invite?: boolean
      remove?: boolean
    }
    settings?: {
      view?: boolean
      edit?: boolean
    }
  }>(),

  // Site access control (optional - restrict user to specific sites)
  siteAccess: jsonb('site_access').$type<{
    allSites?: boolean
    siteIds?: number[]
  }>().default({ allSites: true }),

  // Status
  status: text('status', { enum: ['active', 'inactive', 'suspended'] })
    .notNull()
    .default('active'),

  // Invitation tracking
  invitedBy: text('invited_by'), // Stack user ID of inviter
  invitedAt: timestamp('invited_at'),
  acceptedAt: timestamp('accepted_at'),

  // User preferences
  preferences: jsonb('preferences').$type<{
    timezone?: string
    language?: string
    notifications?: {
      email?: boolean
      sms?: boolean
      push?: boolean
    }
    dashboardLayout?: any
  }>().default({}),

  // Last activity
  lastLoginAt: timestamp('last_login_at'),
  lastActiveAt: timestamp('last_active_at'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: user can only belong to org once
  uniqueOrgUser: unique('org_user_unique').on(table.organizationId, table.stackUserId),

  // Index for querying users by organization
  orgIdIdx: index('org_users_org_id_idx').on(table.organizationId),

  // Index for looking up user by Stack Auth ID
  stackUserIdx: index('org_users_stack_user_idx').on(table.stackUserId),

  // Index for email lookups
  emailIdx: index('org_users_email_idx').on(table.email),

  // Index for role-based queries
  roleIdx: index('org_users_role_idx').on(table.role),
}))

/**
 * User activity log - track important user actions
 */
export const userActivityLog = pgTable('user_activity_log', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' }),
  stackUserId: text('stack_user_id').notNull(),

  // Activity details
  action: text('action').notNull(), // e.g., 'login', 'view_site', 'acknowledge_alert'
  resource: text('resource'), // e.g., 'site', 'alert', 'equipment'
  resourceId: integer('resource_id'),

  // Context
  details: jsonb('details').$type<{
    ip?: string
    userAgent?: string
    location?: string
    [key: string]: any
  }>(),

  // Timestamp
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Index for user's activity history
  userCreatedIdx: index('user_activity_user_created_idx')
    .on(table.stackUserId, table.createdAt.desc()),

  // Index for organization activity
  orgCreatedIdx: index('user_activity_org_created_idx')
    .on(table.organizationId, table.createdAt.desc()),

  // Index for recent activity
  createdAtIdx: index('user_activity_created_at_idx').on(table.createdAt.desc()),
}))

// Relations
export const organizationUsersRelations = relations(organizationUsers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationUsers.organizationId],
    references: [organizations.id],
  }),
}))

export type OrganizationUser = typeof organizationUsers.$inferSelect
export type NewOrganizationUser = typeof organizationUsers.$inferInsert
export type UserActivityLog = typeof userActivityLog.$inferSelect
export type NewUserActivityLog = typeof userActivityLog.$inferInsert

/**
 * Role Permission Matrix
 *
 * OWNER:
 * - Full access to everything
 * - Can manage users and billing
 * - Can delete organization
 *
 * ADMIN:
 * - Can manage sites, equipment, and settings
 * - Can invite/remove users (except owners)
 * - Can acknowledge/dismiss alerts
 *
 * OPERATOR:
 * - Can view all data
 * - Can acknowledge alerts
 * - Can update equipment maintenance status
 * - Cannot change settings or manage users
 *
 * VIEWER:
 * - Read-only access to sites and data
 * - Can view alerts but not acknowledge
 * - Cannot make any changes
 */
