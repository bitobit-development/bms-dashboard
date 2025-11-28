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
  max: 1, // Maximum connections in pool (Vercel serverless)
  idle_timeout: 10, // Close idle connections after 10 seconds
  connect_timeout: 10, // Connection timeout (Vercel limit)
  fetch_types: false, // Disable type fetching for faster connections
})

// Create Drizzle instance
export const db = drizzle(client, { schema })

// Export schema for convenience
export { schema }
