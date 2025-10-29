/**
 * Weather data caching system
 * Caches historical weather data to minimize API calls
 */

import { promises as fs } from 'fs'
import path from 'path'
import type { WeatherData, WeatherCacheEntry } from '../types/weather'

/**
 * Cache directory for weather data
 */
const CACHE_DIR = path.join(process.cwd(), '.cache', 'weather')

/**
 * Cache duration in milliseconds (24 hours)
 * Historical weather data rarely changes, so we can cache for a long time
 */
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000

/**
 * Ensures the cache directory exists
 */
const ensureCacheDir = async (): Promise<void> => {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create cache directory:', error)
    throw error
  }
}

/**
 * Generates a cache key from date range
 *
 * @param startDate - Start date (yyyy-MM-dd)
 * @param endDate - End date (yyyy-MM-dd)
 * @returns Cache key
 */
const getCacheKey = (startDate: string, endDate: string): string => {
  return `${startDate}_${endDate}`
}

/**
 * Gets the cache file path for a given date range
 *
 * @param startDate - Start date (yyyy-MM-dd)
 * @param endDate - End date (yyyy-MM-dd)
 * @returns Full path to cache file
 */
const getCacheFilePath = (startDate: string, endDate: string): string => {
  const key = getCacheKey(startDate, endDate)
  return path.join(CACHE_DIR, `${key}.json`)
}

/**
 * Checks if cached data is still valid
 *
 * @param cachedAt - Timestamp when data was cached
 * @returns True if cache is still valid
 */
const isCacheValid = (cachedAt: number): boolean => {
  const now = Date.now()
  const age = now - cachedAt
  return age < CACHE_DURATION_MS
}

/**
 * Retrieves cached weather data if available and valid
 *
 * @param startDate - Start date (yyyy-MM-dd)
 * @param endDate - End date (yyyy-MM-dd)
 * @returns Cached weather data or null if not available/expired
 */
export const getCachedWeather = async (
  startDate: string,
  endDate: string
): Promise<WeatherData[] | null> => {
  try {
    const cacheFilePath = getCacheFilePath(startDate, endDate)

    // Check if cache file exists
    try {
      await fs.access(cacheFilePath)
    } catch {
      // Cache file doesn't exist
      return null
    }

    // Read cache file
    const cacheContent = await fs.readFile(cacheFilePath, 'utf-8')
    const cacheEntry: WeatherCacheEntry = JSON.parse(cacheContent)

    // Validate cache entry
    if (!cacheEntry.data || !Array.isArray(cacheEntry.data) || !cacheEntry.cachedAt) {
      console.warn('Invalid cache entry format')
      return null
    }

    // Check if cache is still valid
    if (!isCacheValid(cacheEntry.cachedAt)) {
      console.log('Cache expired, will fetch fresh data')
      // Delete expired cache file
      await fs.unlink(cacheFilePath).catch(() => {})
      return null
    }

    // Parse dates from cached data
    const weatherData: WeatherData[] = cacheEntry.data.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp),
      sunrise: new Date(item.sunrise),
      sunset: new Date(item.sunset)
    }))

    return weatherData
  } catch (error) {
    console.error('Error reading weather cache:', error)
    return null
  }
}

/**
 * Caches weather data for a given date range
 *
 * @param startDate - Start date (yyyy-MM-dd)
 * @param endDate - End date (yyyy-MM-dd)
 * @param data - Weather data to cache
 */
export const cacheWeather = async (
  startDate: string,
  endDate: string,
  data: WeatherData[]
): Promise<void> => {
  try {
    // Ensure cache directory exists
    await ensureCacheDir()

    const cacheFilePath = getCacheFilePath(startDate, endDate)

    const cacheEntry: WeatherCacheEntry = {
      cachedAt: Date.now(),
      startDate,
      endDate,
      data
    }

    // Write cache file
    await fs.writeFile(cacheFilePath, JSON.stringify(cacheEntry, null, 2), 'utf-8')

    console.log(`✓ Cached weather data: ${cacheFilePath}`)
  } catch (error) {
    console.error('Error caching weather data:', error)
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Clears all cached weather data
 *
 * @returns Number of cache files deleted
 */
export const clearWeatherCache = async (): Promise<number> => {
  try {
    // Check if cache directory exists
    try {
      await fs.access(CACHE_DIR)
    } catch {
      // Cache directory doesn't exist, nothing to clear
      return 0
    }

    // Read all files in cache directory
    const files = await fs.readdir(CACHE_DIR)

    // Filter for JSON files (cache files)
    const cacheFiles = files.filter(file => file.endsWith('.json'))

    // Delete all cache files
    await Promise.all(
      cacheFiles.map(file =>
        fs.unlink(path.join(CACHE_DIR, file)).catch(() => {})
      )
    )

    console.log(`✓ Cleared ${cacheFiles.length} cache file(s)`)

    return cacheFiles.length
  } catch (error) {
    console.error('Error clearing weather cache:', error)
    return 0
  }
}

/**
 * Gets cache statistics
 *
 * @returns Cache statistics (file count, total size, etc.)
 */
export const getCacheStats = async (): Promise<{
  fileCount: number
  totalSizeBytes: number
  oldestCacheMs: number | null
  newestCacheMs: number | null
}> => {
  try {
    // Check if cache directory exists
    try {
      await fs.access(CACHE_DIR)
    } catch {
      return {
        fileCount: 0,
        totalSizeBytes: 0,
        oldestCacheMs: null,
        newestCacheMs: null
      }
    }

    // Read all files in cache directory
    const files = await fs.readdir(CACHE_DIR)
    const cacheFiles = files.filter(file => file.endsWith('.json'))

    if (cacheFiles.length === 0) {
      return {
        fileCount: 0,
        totalSizeBytes: 0,
        oldestCacheMs: null,
        newestCacheMs: null
      }
    }

    let totalSize = 0
    let oldestCache: number | null = null
    let newestCache: number | null = null

    // Read each cache file to get stats
    await Promise.all(
      cacheFiles.map(async file => {
        const filePath = path.join(CACHE_DIR, file)
        const stats = await fs.stat(filePath)
        totalSize += stats.size

        try {
          const content = await fs.readFile(filePath, 'utf-8')
          const entry: WeatherCacheEntry = JSON.parse(content)

          if (!oldestCache || entry.cachedAt < oldestCache) {
            oldestCache = entry.cachedAt
          }
          if (!newestCache || entry.cachedAt > newestCache) {
            newestCache = entry.cachedAt
          }
        } catch {
          // Skip invalid cache files
        }
      })
    )

    return {
      fileCount: cacheFiles.length,
      totalSizeBytes: totalSize,
      oldestCacheMs: oldestCache,
      newestCacheMs: newestCache
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return {
      fileCount: 0,
      totalSizeBytes: 0,
      oldestCacheMs: null,
      newestCacheMs: null
    }
  }
}
