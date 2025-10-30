'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Battery, User, Zap, LogOut, Shield, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { MobileNav } from './mobile-nav'
import { useUser, useStackApp } from '@stackframe/stack'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function DashboardNav() {
  const user = useUser()
  const app = useStackApp()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [signOutType, setSignOutType] = useState<'current' | 'all'>('current')

  if (!user) {
    return null
  }

  const displayName = user.displayName || user.primaryEmail || 'User'
  const email = user.primaryEmail || ''
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  // Keyboard shortcut: Cmd/Ctrl + Shift + Q
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Q') {
        e.preventDefault()
        setSignOutType('current')
        setShowConfirmDialog(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSignOut = async () => {
    setShowConfirmDialog(false)
    setIsSigningOut(true)

    try {
      if (signOutType === 'all') {
        // Sign out from all devices
        await user.signOut()
        toast.success('Signed out from all devices successfully')
      } else {
        // Sign out from current device only
        await user.signOut()
        toast.success('Signed out successfully')
      }
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out. Please try again.')
      setIsSigningOut(false)
    }
  }

  const promptSignOut = (type: 'current' | 'all') => {
    setSignOutType(type)
    setShowConfirmDialog(true)
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
            <div className="relative">
              <Battery className="h-6 w-6 text-purple-600" />
              <Zap className="h-3 w-3 text-yellow-500 absolute -right-0.5 -top-0.5" />
            </div>
            <span>BMS Dashboard</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild suppressHydrationWarning>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/handler/account-settings">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/management">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Management</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => promptSignOut('current')}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  <span>Sign Out</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => promptSignOut('all')}
                  disabled={isSigningOut}
                  className="text-red-600"
                >
                  {isSigningOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  <span>Sign Out from All Devices</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Sign Out</DialogTitle>
            <DialogDescription>
              {signOutType === 'all'
                ? 'Are you sure you want to sign out from all devices? You will need to sign in again on all your devices.'
                : 'Are you sure you want to sign out? You can press Cmd/Ctrl + Shift + Q to sign out quickly.'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSigningOut}
            >
              Cancel
            </Button>
            <Button
              variant={signOutType === 'all' ? 'destructive' : 'default'}
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  )
}
