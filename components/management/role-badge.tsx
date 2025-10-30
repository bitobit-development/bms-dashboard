import { Badge } from '@/components/ui/badge'
import { Shield, ShieldCheck, User, Eye } from 'lucide-react'
import type { Role } from '@/lib/auth/permissions'

interface RoleBadgeProps {
  role: Role
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const roleConfig = {
    owner: {
      label: 'Owner',
      icon: ShieldCheck,
      className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    },
    admin: {
      label: 'Admin',
      icon: Shield,
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    },
    operator: {
      label: 'Operator',
      icon: User,
      className: 'bg-teal-100 text-teal-800 hover:bg-teal-100',
    },
    viewer: {
      label: 'Viewer',
      icon: Eye,
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    },
  }

  const config = roleConfig[role] || roleConfig.viewer
  const Icon = config.icon

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}
