'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

export function LiveClock() {
  const [time, setTime] = useState<Date>(new Date())

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

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
