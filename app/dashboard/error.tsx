'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  // Check if it's an authentication/organization error
  const isAuthError = error.message?.includes('organization') || error.message?.includes('authenticated')

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>
              {isAuthError ? 'Access Required' : 'Something went wrong'}
            </CardTitle>
          </div>
          <CardDescription>
            {isAuthError 
              ? 'Your account needs to be added to the organization'
              : 'An error occurred while loading the dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthError ? (
            <>
              <p className="text-sm text-muted-foreground">
                You are signed in, but your account is not yet registered in this organization. 
                Please contact an administrator to be added.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <a href="/login">Sign Out</a>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <a href="mailto:admin@demobms.com">Contact Administrator</a>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {error.message || 'An unexpected error occurred'}
              </p>
              <div className="space-y-2">
                <Button onClick={reset} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <a href="/login">Go to Login</a>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
