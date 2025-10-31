'use client'

import { AuthPage } from '@stackframe/stack'
import { Logo } from '@/components/ui/logo'

export default function LoginForm() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo
            size="xl"
            variant="full"
            showText={true}
            clickable={false}
            className="mx-auto justify-center"
          />
          <p className="text-slate-600 dark:text-slate-300 mt-4">Battery Management System</p>
        </div>
        <AuthPage type="sign-in" />
      </div>
    </div>
  )
}
