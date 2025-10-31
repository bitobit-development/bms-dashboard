import {
  LayoutDashboard,
  Building2,
  Map,
  BarChart3,
  AlertCircle,
  FileText,
  Cpu,
  Wrench,
  CloudSun,
  Settings,
  Book,
  HelpCircle,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
}

export interface NavSection {
  title?: string // Optional - if not provided, no header will be shown
  items: NavItem[]
}

export const mainNavigation: NavSection[] = [
  {
    // Primary section (no header)
    items: [
      {
        title: 'Home',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Sites',
        href: '/dashboard/sites',
        icon: Building2,
      },
      {
        title: 'Map View',
        href: '/dashboard/sites/map',
        icon: Map,
      },
      {
        title: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
      },
      {
        title: 'Alerts',
        href: '/dashboard/alerts',
        icon: AlertCircle,
        badge: 3,
      },
      {
        title: 'Reports',
        href: '/dashboard/reports',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Equipment',
        href: '/dashboard/equipment',
        icon: Cpu,
      },
      {
        title: 'Maintenance',
        href: '/dashboard/maintenance',
        icon: Wrench,
      },
      {
        title: 'Weather',
        href: '/dashboard/weather',
        icon: CloudSun,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'Management',
        href: '/management',
        icon: Users,
      },
      {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
    ],
  },
]

export const footerNavigation: NavItem[] = [
  {
    title: 'Documentation',
    href: '/dashboard/docs',
    icon: Book,
  },
  {
    title: 'Support',
    href: '/dashboard/support',
    icon: HelpCircle,
  },
]
