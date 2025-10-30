'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
}

export function Breadcrumb() {
  const pathname = usePathname()
  const [items, setItems] = useState<BreadcrumbItem[]>([])

  useEffect(() => {
    const breadcrumbItems: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ]

    // Add breadcrumb items based on current path
    if (pathname.startsWith('/handler/account-settings')) {
      breadcrumbItems.push({ label: 'Account Settings', href: '/handler/account-settings' })
    } else if (pathname.startsWith('/dashboard/sites')) {
      breadcrumbItems.push({ label: 'Sites', href: '/dashboard/sites' })
    } else if (pathname.startsWith('/dashboard/analytics')) {
      breadcrumbItems.push({ label: 'Analytics', href: '/dashboard/analytics' })
    } else if (pathname.startsWith('/dashboard/alerts')) {
      breadcrumbItems.push({ label: 'Alerts', href: '/dashboard/alerts' })
    } else if (pathname.startsWith('/dashboard/reports')) {
      breadcrumbItems.push({ label: 'Reports', href: '/dashboard/reports' })
    } else if (pathname.startsWith('/dashboard/equipment')) {
      breadcrumbItems.push({ label: 'Equipment', href: '/dashboard/equipment' })
    } else if (pathname.startsWith('/dashboard/maintenance')) {
      breadcrumbItems.push({ label: 'Maintenance', href: '/dashboard/maintenance' })
    } else if (pathname.startsWith('/dashboard/weather')) {
      breadcrumbItems.push({ label: 'Weather', href: '/dashboard/weather' })
    } else if (pathname.startsWith('/management')) {
      breadcrumbItems.push({ label: 'Management', href: '/management' })
    } else if (pathname.startsWith('/dashboard/settings')) {
      breadcrumbItems.push({ label: 'Settings', href: '/dashboard/settings' })
    } else if (pathname.startsWith('/dashboard/docs')) {
      breadcrumbItems.push({ label: 'Documentation', href: '/dashboard/docs' })
    } else if (pathname.startsWith('/dashboard/support')) {
      breadcrumbItems.push({ label: 'Support', href: '/dashboard/support' })
    }

    setItems(breadcrumbItems)
  }, [pathname])

  // Don't show breadcrumb on dashboard home
  if (pathname === '/dashboard') {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.slice(1).map((item, index) => (
        <div key={item.href} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {index === items.length - 2 ? (
            // Last item - not clickable
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            // Intermediate items - clickable
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
