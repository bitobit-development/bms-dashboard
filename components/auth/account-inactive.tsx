'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { XCircle, Mail } from 'lucide-react'
import { useStackApp } from '@stackframe/stack'

interface AccountInactiveProps {
  status: string
  userEmail?: string | null
  userName?: string | null
}

export function AccountInactive({ status, userEmail, userName }: AccountInactiveProps) {
  const app = useStackApp()

  const handleSignOut = async () => {
    // Type assertion needed due to Stack Auth type inference issue
    await (app as any).signOut()
  }

  const statusMessages: Record<string, { title: string; description: string }> = {
    inactive: {
      title: 'Account Inactive',
      description: 'Your account has been deactivated. Please contact an administrator to reactivate it.'
    },
    suspended: {
      title: 'Account Suspended',
      description: 'Your account has been suspended. Please contact an administrator for more information.'
    },
    rejected: {
      title: 'Account Rejected',
      description: 'Your access request was not approved. Please contact an administrator if you believe this is an error.'
    }
  }

  const message = statusMessages[status] || {
    title: 'Account Unavailable',
    description: `Your account status is "${status}". Please contact an administrator.`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-2">
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">{message.title}</CardTitle>
          <CardDescription>
            You cannot access the BMS Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          {(userName || userEmail) && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong className="block mb-1">Account Details:</strong>
                {userName && <div className="text-sm">{userName}</div>}
                {userEmail && <div className="text-sm text-muted-foreground">{userEmail}</div>}
              </AlertDescription>
            </Alert>
          )}

          {/* Status Message */}
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong className="block mb-1">Status: {status}</strong>
              <p className="text-sm">{message.description}</p>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Contact your administrator for assistance
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
