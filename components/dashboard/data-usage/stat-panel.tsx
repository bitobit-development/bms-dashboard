'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatPanelProps {
  title: string
  value: string | number
  unit?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  className?: string
  variant?: 'default' | 'compact'
}

export function StatPanel({
  title,
  value,
  unit,
  trend,
  className,
  variant = 'default',
}: StatPanelProps) {
  const getTrendIcon = () => {
    if (!trend) return null

    const iconClass = 'h-3 w-3'
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className={cn(iconClass, 'text-green-500')} aria-hidden="true" />
      case 'down':
        return <TrendingDown className={cn(iconClass, 'text-red-500')} aria-hidden="true" />
      default:
        return <Minus className={cn(iconClass, 'text-muted-foreground')} aria-hidden="true" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    switch (trend.direction) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold tabular-nums">{value}</span>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs', getTrendColor())}>
            {getTrendIcon()}
            <span className="tabular-nums">{trend.value}%</span>
            {trend.label && (
              <span className="text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
