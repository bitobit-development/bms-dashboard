/**
 * Site Status Utilities
 *
 * Helper functions for tracking site connectivity and status
 */

import { formatDistanceToNow } from 'date-fns'

/**
 * Calculate site status based on last seen timestamp
 *
 * @param lastSeenAt - Last time site reported telemetry
 * @returns Status object with color, label, and description
 */
export function getSiteStatus(lastSeenAt: Date | null) {
  if (!lastSeenAt) {
    return {
      status: 'unknown' as const,
      color: 'gray',
      label: 'Never Seen',
      description: 'No telemetry data received yet',
    }
  }

  const now = new Date()
  const minutesSinceLastSeen = (now.getTime() - new Date(lastSeenAt).getTime()) / 1000 / 60

  // Online: Last seen within 10 minutes
  if (minutesSinceLastSeen <= 10) {
    return {
      status: 'online' as const,
      color: 'green',
      label: 'Online',
      description: `Active ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`,
      lastSeenText: formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true }),
    }
  }

  // Warning: Last seen within 30 minutes
  if (minutesSinceLastSeen <= 30) {
    return {
      status: 'warning' as const,
      color: 'yellow',
      label: 'Delayed',
      description: `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`,
      lastSeenText: formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true }),
    }
  }

  // Offline: Last seen more than 30 minutes ago
  return {
    status: 'offline' as const,
    color: 'red',
    label: 'Offline',
    description: `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`,
    lastSeenText: formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true }),
  }
}

/**
 * Get CSS classes for site status badge
 */
export function getSiteStatusClasses(status: ReturnType<typeof getSiteStatus>['status']) {
  const baseClasses = 'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium'

  switch (status) {
    case 'online':
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`
    case 'warning':
      return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`
    case 'offline':
      return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`
    case 'unknown':
      return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`
  }
}

/**
 * Get status indicator dot
 */
export function getStatusIndicator(status: ReturnType<typeof getSiteStatus>['status']) {
  const baseClasses = 'h-2 w-2 rounded-full'

  switch (status) {
    case 'online':
      return `${baseClasses} bg-green-500 animate-pulse`
    case 'warning':
      return `${baseClasses} bg-yellow-500`
    case 'offline':
      return `${baseClasses} bg-red-500`
    case 'unknown':
      return `${baseClasses} bg-gray-400`
  }
}
