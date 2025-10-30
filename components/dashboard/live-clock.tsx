'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

export function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial time on mount (client-side only)
    setTime(new Date())

    // Update time every second
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  // Prevent hydration mismatch by not rendering until client-side
  if (!time) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">--:--:--</span>
        <span className="hidden sm:inline">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="font-medium">
        {format(time, 'HH:mm:ss')}
      </span>
      <span className="hidden sm:inline">
        {format(time, 'EEE, MMM d, yyyy')}
      </span>
    </div>
  )
}
