import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, XCircle, Ban } from 'lucide-react'

type UserStatus = 'pending' | 'active' | 'inactive' | 'suspended'

interface StatusBadgeProps {
  status: UserStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      variant: 'secondary' as const,
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    active: {
      label: 'Active',
      variant: 'default' as const,
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    inactive: {
      label: 'Inactive',
      variant: 'secondary' as const,
      icon: XCircle,
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    },
    suspended: {
      label: 'Suspended',
      variant: 'destructive' as const,
      icon: Ban,
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
  }

  const config = statusConfig[status] || statusConfig.inactive
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}
