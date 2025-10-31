'use client'

import { AuthPage } from '@stackframe/stack'

export default function LoginForm() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">BMS Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-300">Battery Management System</p>
        </div>
        <AuthPage type="sign-in" />
      </div>
    </div>
  )
}
