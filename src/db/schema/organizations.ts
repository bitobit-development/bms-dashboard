/**
 * Organizations Schema
 *
 * Multi-tenancy support for BMS platform.
 * Each organization can have multiple sites and users.
 */

import { pgTable, serial, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),

  // Contact information
  email: text('email'),
  phone: text('phone'),

  // Address
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country').notNull().default('US'),
  postalCode: text('postal_code'),

  // Settings and configuration
  settings: jsonb('settings').$type<{
    timezone?: string
    alertEmail?: string[]
    maintenanceWindow?: { start: string; end: string }
    dataRetentionDays?: number
  }>().default({}),

  // Status
  status: text('status', { enum: ['active', 'inactive', 'suspended'] })
    .notNull()
    .default('active'),

  // Subscription/billing (if applicable)
  subscriptionTier: text('subscription_tier', {
    enum: ['trial', 'basic', 'professional', 'enterprise']
  }).default('trial'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Relations will be defined in each respective schema file
export const organizationsRelations = relations(organizations, ({ many }) => ({
  sites: many('sites' as any),
  users: many('organizationUsers' as any),
}))

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
