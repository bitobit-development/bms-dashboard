import { NextResponse } from 'next/server'
import { stackServerApp } from '@/app/stack'
import { db } from '@/src/db'
import { organizations } from '@/src/db/schema/organizations'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  }

  // Check environment variables
  checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    STACK_SECRET_SERVER_KEY: !!process.env.STACK_SECRET_SERVER_KEY,
    NEXT_PUBLIC_STACK_PROJECT_ID: !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: !!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
  }

  // Check database connection
  try {
    const orgCount = await db.select().from(organizations).limit(1)
    checks.database = {
      status: 'connected',
      hasOrganizations: orgCount.length > 0,
    }
  } catch (error: any) {
    checks.database = {
      status: 'error',
      message: error.message,
    }
  }

  // Check Stack Auth
  try {
    const user = await stackServerApp.getUser()
    checks.stackAuth = {
      status: 'ok',
      hasUser: !!user,
    }
  } catch (error: any) {
    checks.stackAuth = {
      status: 'error',
      message: error.message,
    }
  }

  const allHealthy =
    checks.database.status === 'connected' &&
    checks.stackAuth.status === 'ok' &&
    checks.env.DATABASE_URL &&
    checks.env.STACK_SECRET_SERVER_KEY

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
    },
    {
      status: allHealthy ? 200 : 503,
    }
  )
}
