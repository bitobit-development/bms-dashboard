/**
 * User Audit Log Schema
 *
 * Tracks all user management actions for compliance and auditing.
 */

import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizationUsers } from './users'

/**
 * User audit log - tracks all user management actions
 */
export const userAuditLog = pgTable('user_audit_log', {
  id: serial('id').primaryKey(),

  // User being acted upon
  userId: integer('user_id')
    .notNull()
    .references(() => organizationUsers.id, { onDelete: 'cascade' }),

  // Action performed
  action: text('action', {
    enum: ['approve', 'reject', 'role_change', 'invite', 'suspend', 'activate', 'delete']
  }).notNull(),

  // Who performed the action
  performedBy: text('performed_by').notNull(), // Stack user ID or email
  performedByName: text('performed_by_name'), // Display name for UI

  // Action details
  details: jsonb('details').$type<{
    reason?: string
    oldValue?: string
    newValue?: string
    email?: string
    role?: string
    [key: string]: any
  }>(),

  // Timestamp
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Index for user's audit history
  userIdIdx: index('user_audit_log_user_id_idx').on(table.userId),

  // Index for action type queries
  actionIdx: index('user_audit_log_action_idx').on(table.action),

  // Index for chronological queries
  createdAtIdx: index('user_audit_log_created_at_idx').on(table.createdAt.desc()),

  // Index for performer queries
  performedByIdx: index('user_audit_log_performed_by_idx').on(table.performedBy),
}))

// Relations
export const userAuditLogRelations = relations(userAuditLog, ({ one }) => ({
  user: one(organizationUsers, {
    fields: [userAuditLog.userId],
    references: [organizationUsers.id],
  }),
}))

export type UserAuditLog = typeof userAuditLog.$inferSelect
export type NewUserAuditLog = typeof userAuditLog.$inferInsert
