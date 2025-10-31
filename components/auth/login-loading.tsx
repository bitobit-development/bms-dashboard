'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-2">
            <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Signing you in...</CardTitle>
          <CardDescription>
            Please wait while we redirect you to your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>This will only take a moment.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
