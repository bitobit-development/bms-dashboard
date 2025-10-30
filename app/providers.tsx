'use client'

import { Toaster } from 'sonner'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { stackClientApp } from './stack-client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        {children}
        <Toaster position="top-right" richColors />
      </StackTheme>
    </StackProvider>
  )
}
