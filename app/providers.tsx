'use client'

import { Toaster } from 'sonner'
import { StackProvider } from '@stackframe/stack'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider
      app={{
        id: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
        publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
      }}
    >
      {children}
      <Toaster position="top-right" richColors />
    </StackProvider>
  )
}
