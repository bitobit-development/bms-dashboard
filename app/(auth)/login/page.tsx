'use client'

import { AuthPage } from '@stackframe/stack'
import { Suspense } from 'react'

function LoginContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">BMS Dashboard</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Battery Management System</p>
        </div>
        <AuthPage type="sign-in" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">BMS Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
