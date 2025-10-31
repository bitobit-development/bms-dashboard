'use client'

import { useRouter } from 'next/navigation'
import { CircleCheck, Mail, LogOut, LayoutDashboard, Settings, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStackApp } from '@stackframe/stack'

interface AlreadySignedInProps {
  userEmail?: string | null
  userName?: string | null
  dashboardUrl?: string
  showSignOut?: boolean
}

export function AlreadySignedIn({
  userEmail,
  userName,
  dashboardUrl = '/dashboard',
  showSignOut = true,
}: AlreadySignedInProps) {
  const router = useRouter()
  const app = useStackApp()

  const handleSignOut = async () => {
    // Type assertion needed due to Stack Auth type inference issue
    await (app as any).signOut()
  }

  const handleDashboard = () => {
    router.push(dashboardUrl)
  }

  const displayName = userName || userEmail?.split('@')[0] || 'there'
  const displayEmail = userEmail || 'your account'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2">
            <CircleCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">You're Already Signed In</h1>
          <p className="text-muted-foreground">
            Welcome back, {displayName}! You're currently logged into your account.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Details */}
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong className="block mb-1">Signed in as:</strong>
              <div className="text-sm text-muted-foreground">{displayEmail}</div>
            </AlertDescription>
          </Alert>

          {/* Status Message */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              You're already authenticated and have access to the BMS Dashboard.
              You can continue to your dashboard or sign out if you need to switch accounts.
            </p>
          </div>

          {/* What would you like to do? */}
          <Alert variant="default" className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
            <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <strong className="block mb-1">What would you like to do?</strong>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <LayoutDashboard className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Go to your dashboard to view sites and telemetry</span>
                </li>
                <li className="flex items-start gap-2">
                  <Settings className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Manage your account settings and preferences</span>
                </li>
                {showSignOut && (
                  <li className="flex items-start gap-2">
                    <LogOut className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>Sign out to switch to a different account</span>
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleDashboard}
              className="w-full"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>

            {showSignOut && (
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            Need help? <a href="/support" className="font-medium text-primary hover:underline">Contact support</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
