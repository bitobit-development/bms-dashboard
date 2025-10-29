'use client'

import { useStackApp, useUser } from '@stackframe/stack'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Battery, Zap } from 'lucide-react'

export default function LoginPage() {
  const app = useStackApp()
  const user = useUser()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSignIn = async () => {
    await app.signInWithRedirect()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center items-center gap-2">
            <div className="relative">
              <Battery className="h-12 w-12 text-purple-600" />
              <Zap className="h-6 w-6 text-yellow-500 absolute -right-1 -top-1" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">BMS Dashboard</CardTitle>
          <CardDescription className="text-base">
            Battery Management System
            <br />
            Monitor your solar installations in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSignIn} className="w-full" size="lg">
            Sign In with Stack Auth
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Secure authentication powered by Stack Auth
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
