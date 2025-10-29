/**
 * Weather Server Actions
 *
 * Server-side actions for fetching and managing weather data.
 */

'use server'

import { db } from '@/src/db'
import { sites, weather } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { weatherService } from '@/lib/weather-service'
import {
  saveWeatherData,
  getLatestWeather,
  getAllSitesWithWeather,
} from '@/lib/weather-db'
import { revalidatePath } from 'next/cache'

/**
 * Gets all sites with their latest weather data
 *
 * @returns Sites with weather data or error
 */
export const getSitesWithWeather = async () => {
  try {
    const sitesWithWeather = await getAllSitesWithWeather()

    return { success: true, data: sitesWithWeather }
  } catch (error) {
    console.error('Failed to fetch sites with weather:', error)
    return {
      success: false,
      error: 'Failed to fetch weather data',
    }
  }
}

/**
 * Refreshes weather data for a specific site
 *
 * @param siteId - Site ID
 * @returns Updated weather data or error
 */
export const refreshSiteWeather = async (siteId: number) => {
  try {
    // Get site details
    const [site] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (!site) {
      return { success: false, error: 'Site not found' }
    }

    if (!site.latitude || !site.longitude) {
      return {
        success: false,
        error: 'Site does not have location coordinates',
      }
    }

    // Fetch current weather from API
    const weatherData = await weatherService.getCurrentWeather(
      site.latitude,
      site.longitude
    )

    // Save to database
    await saveWeatherData(siteId, weatherData)

    // Revalidate the weather page
    revalidatePath('/dashboard/weather')

    return { success: true, data: weatherData }
  } catch (error) {
    console.error(`Failed to refresh weather for site ${siteId}:`, error)
    return {
      success: false,
      error: 'Failed to refresh weather',
    }
  }
}

/**
 * Refreshes weather data for all sites
 *
 * @returns Results for each site or error
 */
export const refreshAllWeather = async () => {
  try {
    const allSites = await db.select().from(sites)
    const results = []

    for (const site of allSites) {
      if (!site.latitude || !site.longitude) {
        results.push({
          siteId: site.id,
          siteName: site.name,
          success: false,
          error: 'No coordinates',
        })
        continue
      }

      try {
        const weatherData = await weatherService.getCurrentWeather(
          site.latitude,
          site.longitude
        )
        await saveWeatherData(site.id, weatherData)

        results.push({
          siteId: site.id,
          siteName: site.name,
          success: true,
          temperature: weatherData.temperature,
          condition: weatherData.condition,
        })

        // Rate limit: wait 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        results.push({
          siteId: site.id,
          siteName: site.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Revalidate the weather page
    revalidatePath('/dashboard/weather')

    return { success: true, data: results }
  } catch (error) {
    console.error('Failed to refresh all weather:', error)
    return {
      success: false,
      error: 'Failed to refresh weather data',
    }
  }
}

/**
 * Gets the latest weather for a specific site
 *
 * @param siteId - Site ID
 * @returns Weather data or error
 */
export const getSiteWeather = async (siteId: number) => {
  try {
    const weatherData = await getLatestWeather(siteId)

    if (!weatherData) {
      return {
        success: false,
        error: 'No weather data available for this site',
      }
    }

    return { success: true, data: weatherData }
  } catch (error) {
    console.error(`Failed to get weather for site ${siteId}:`, error)
    return {
      success: false,
      error: 'Failed to fetch weather data',
    }
  }
}
