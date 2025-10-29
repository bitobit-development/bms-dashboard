'use client'

import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  // Future: Add Stack Auth provider here when authentication is needed
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  )
}
