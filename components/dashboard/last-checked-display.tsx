'use client'

import { formatDistanceToNow } from 'date-fns'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LastCheckedDisplayProps {
  timestamp: Date | string
  className?: string
}

export function LastCheckedDisplay({ timestamp, className }: LastCheckedDisplayProps) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffInMinutes = (now.getTime() - date.getTime()) / 1000 / 60

  // Determine freshness color based on time difference
  const getFreshnessColor = (minutes: number) => {
    if (minutes < 2) return 'text-green-600 dark:text-green-400' // Fresh
    if (minutes < 5) return 'text-yellow-600 dark:text-yellow-400' // Recent
    if (minutes < 15) return 'text-orange-600 dark:text-orange-400' // Aging
    return 'text-red-600 dark:text-red-400' // Stale
  }

  const freshnessColor = getFreshnessColor(diffInMinutes)

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', freshnessColor, className)}>
      <Clock className="h-3 w-3" />
      <span>
        {formatDistanceToNow(date, { addSuffix: true })}
      </span>
    </div>
  )
}
