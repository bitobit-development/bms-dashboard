/**
 * Database Connection
 *
 * Drizzle ORM instance for the BMS platform.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create postgres client with connection pooling
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
})

// Create Drizzle instance
export const db = drizzle(client, { schema })

// Export schema for convenience
export { schema }
