'use client'

import { Toaster } from 'sonner'
import { StackProvider, stackClientApp } from '@stackframe/stack'

const stackApp = stackClientApp({
  tokenStore: 'nextjs-cookie',
  urls: {
    home: '/dashboard',
    signIn: '/login',
    signUp: '/login',
    afterSignIn: '/dashboard',
    afterSignUp: '/dashboard',
    afterSignOut: '/',
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackApp}>
      {children}
      <Toaster position="top-right" richColors />
    </StackProvider>
  )
}
