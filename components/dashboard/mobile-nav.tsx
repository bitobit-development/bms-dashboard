'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Battery, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { mainNavigation, footerNavigation, type NavItem } from '@/lib/navigation'

function MobileNavLink({
  item,
  isActive,
  onClose,
}: {
  item: NavItem
  isActive: boolean
  onClose: () => void
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClose}
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

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleClose = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild suppressHydrationWarning>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          {/* Brand Section */}
          <SheetHeader className="flex h-16 items-center border-b px-6">
            <SheetTitle asChild>
              <Link
                href="/dashboard"
                onClick={handleClose}
                className="flex items-center gap-2 font-semibold text-lg"
              >
                <div className="relative">
                  <Battery className="h-6 w-6 text-purple-600" />
                  <Zap className="h-3 w-3 text-yellow-500 absolute -right-0.5 -top-0.5" />
                </div>
                <span>BMS Dashboard</span>
              </Link>
            </SheetTitle>
          </SheetHeader>

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
                      <MobileNavLink
                        key={item.href}
                        item={item}
                        isActive={isActive(item.href)}
                        onClose={handleClose}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Footer Navigation */}
              <Separator />
              <div className="space-y-1">
                {footerNavigation.map((item) => (
                  <MobileNavLink
                    key={item.href}
                    item={item}
                    isActive={isActive(item.href)}
                    onClose={handleClose}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* User Section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 overflow-hidden">
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">admin@bms.com</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
