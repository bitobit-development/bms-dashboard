'use client'

import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  // TODO: Add Stack Auth provider when authentication is fully configured
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  )
}
