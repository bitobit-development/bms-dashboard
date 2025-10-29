'use client'

import { useEffect, useState, useCallback } from 'react'

export function useRealtimeData<T>(
  fetchFunction: () => Promise<T>,
  intervalMs: number = 60000 // Default 60 seconds
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await fetchFunction()
      setData(result)
      setLastUpdated(new Date())
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
      setIsLoading(false)
    }
  }, [fetchFunction])

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Set up polling
    const interval = setInterval(fetchData, intervalMs)

    return () => clearInterval(interval)
  }, [fetchData, intervalMs])

  const refresh = useCallback(() => {
    setIsLoading(true)
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, lastUpdated, refresh }
}
