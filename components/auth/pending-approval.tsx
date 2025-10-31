'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, Mail, AlertCircle } from 'lucide-react'
import { useStackApp } from '@stackframe/stack'

interface PendingApprovalProps {
  userEmail?: string | null
  userName?: string | null
}

export function PendingApproval({ userEmail, userName }: PendingApprovalProps) {
  const app = useStackApp()

  const handleSignOut = async () => {
    // Type assertion needed due to Stack Auth type inference issue
    await (app as any).signOut()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-2">
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account is waiting for administrator review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong className="block mb-1">Account Details:</strong>
              {userName && <div className="text-sm">{userName}</div>}
              {userEmail && <div className="text-sm text-muted-foreground">{userEmail}</div>}
            </AlertDescription>
          </Alert>

          {/* Status Message */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Your account has been created successfully, but it requires administrator
              approval before you can access the BMS Dashboard.
            </p>
            <p>
              An administrator will review your request shortly. You will receive an
              email notification once your account has been approved.
            </p>
          </div>

          {/* Next Steps */}
          <Alert variant="default" className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <strong className="block mb-1">What happens next?</strong>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Administrator will review your account</li>
                <li>You'll receive an email when approved</li>
                <li>You can then sign in and access the dashboard</li>
              </ul>
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
              If you have questions, please contact your administrator
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
