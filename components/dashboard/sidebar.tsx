'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Battery, Zap, LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { mainNavigation, footerNavigation, type NavItem } from '@/lib/navigation'
import { LiveClock } from './live-clock'
import { useUser, useStackApp } from '@stackframe/stack'
import { Logo } from '@/components/ui/logo'
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
import { toast } from 'sonner'

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <Badge variant="destructive" className="ml-auto">
          {item.badge}
        </Badge>
      )}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const user = useUser()
  const app = useStackApp()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [signOutType, setSignOutType] = useState<'current' | 'all'>('current')

  if (!user) {
    return null
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const isOnAccountSettings = pathname.startsWith('/handler/account-settings')

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
    <div className="flex h-screen w-64 lg:w-72 xl:w-80 flex-col border-r bg-background">
      {/* Brand Section */}
      <div className="flex h-16 items-center border-b px-4 lg:px-6">
        <Logo size="md" showText={true} className="flex-1" />
      </div>

      {/* Live Clock */}
      <div className="flex items-center justify-center border-b px-4 py-3">
        <LiveClock />
      </div>

      {/* Navigation Sections */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {mainNavigation.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
                ))}
              </div>
            </div>
          ))}

          {/* Footer Navigation */}
          <Separator />
          <div className="space-y-1">
            {footerNavigation.map((item) => (
              <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className={cn(
        "border-t p-4 transition-colors",
        isOnAccountSettings && "bg-accent/50"
      )}>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-0 h-auto hover:bg-accent">
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 overflow-hidden text-left">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{email}</p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/handler/account-settings">Account Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/management">Management Console</Link>
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
                Sign Out
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
                Sign Out from All Devices
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 overflow-hidden">
              <p className="text-sm font-medium leading-none">Not signed in</p>
            </div>
          </div>
        )}
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
    </div>
  )
}
