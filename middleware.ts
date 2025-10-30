import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { stackServerApp } from '@/app/stack'

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

      // User is authenticated, allow access
      // Approval check will happen in dashboard layout
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
