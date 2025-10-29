import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertStats {
  critical: number
  error: number
  warning: number
  resolved24h: number
}

interface AlertsStatsProps {
  stats: AlertStats | null
  isLoading?: boolean
}

const statConfig = [
  {
    key: 'critical' as const,
    title: 'Critical Alerts',
    icon: AlertCircle,
    colorClasses: {
      bg: 'bg-red-100 dark:bg-red-950',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-900 dark:text-red-100',
    },
  },
  {
    key: 'error' as const,
    title: 'Error Alerts',
    icon: AlertTriangle,
    colorClasses: {
      bg: 'bg-orange-100 dark:bg-orange-950',
      icon: 'text-orange-600 dark:text-orange-400',
      text: 'text-orange-900 dark:text-orange-100',
    },
  },
  {
    key: 'warning' as const,
    title: 'Warning Alerts',
    icon: Info,
    colorClasses: {
      bg: 'bg-yellow-100 dark:bg-yellow-950',
      icon: 'text-yellow-600 dark:text-yellow-400',
      text: 'text-yellow-900 dark:text-yellow-100',
    },
  },
  {
    key: 'resolved24h' as const,
    title: 'Resolved (24h)',
    icon: CheckCircle,
    colorClasses: {
      bg: 'bg-green-100 dark:bg-green-950',
      icon: 'text-green-600 dark:text-green-400',
      text: 'text-green-900 dark:text-green-100',
    },
  },
]

export function AlertsStats({ stats, isLoading }: AlertsStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statConfig.map((stat) => (
          <Card key={stat.key}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((stat) => {
        const Icon = stat.icon
        const count = stats[stat.key]

        return (
          <Card key={stat.key}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    stat.colorClasses.bg
                  )}
                >
                  <Icon className={cn('h-6 w-6', stat.colorClasses.icon)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className={cn('text-3xl font-bold', stat.colorClasses.text)}>
                    {count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
