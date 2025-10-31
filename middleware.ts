import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { stackServerApp } from '@/app/stack'

/**
 * Check if this is a new user session (first request after authentication)
 */
function isNewUserSession(request: NextRequest): boolean {
  // Check for Stack Auth session indicator
  const hasStackSession = request.cookies.has('stack-session')
  const hasSyncCookie = request.cookies.has('user-synced')

  // New session if Stack session exists but sync cookie doesn't
  return hasStackSession && !hasSyncCookie
}

export async function middleware(request: NextRequest) {
  // Only protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      const user = await stackServerApp.getUser()

      if (!user) {
        // No user session, redirect to login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
      }

      // User is authenticated
      // Check if we need to sync this user to the database
      if (isNewUserSession(request)) {
        // Trigger user sync by adding header
        // The actual sync will happen in the dashboard page
        // but we mark it here to avoid duplicate syncs
        const response = NextResponse.next()
        response.cookies.set('user-synced', 'true', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
        return response
      }

      // User is authenticated, allow middleware to pass
      // Authorization and approval checks happen in dashboard layout (server component)
      return NextResponse.next()
    } catch (error) {
      // Error checking authentication, redirect to login
      console.error('Middleware auth error:', error)
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*'
}
