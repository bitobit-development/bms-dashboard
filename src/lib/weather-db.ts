/**
 * Weather Database Operations
 *
 * Handles saving and retrieving weather data from the database.
 */

import { db } from '../db/index'
import { weather, sites } from '../db/schema/index'
import { eq, desc, and, gte } from 'drizzle-orm'
import type { WeatherData } from './weather-service'

/**
 * Saves weather data to the database
 *
 * @param siteId - Site ID
 * @param weatherData - Weather data from API
 * @param dataSource - Data source identifier (default: 'open-meteo')
 * @returns Inserted weather record
 */
export const saveWeatherData = async (
  siteId: number,
  weatherData: WeatherData,
  dataSource: string = 'open-meteo'
) => {
  return await db
    .insert(weather)
    .values({
      siteId,
      timestamp: new Date(),
      temperature: weatherData.temperature,
      feelsLike: weatherData.feelsLike ?? null,
      condition: weatherData.condition,
      conditionCode: weatherData.conditionCode ?? null,
      description: weatherData.description ?? null,
      humidity: weatherData.humidity,
      pressure: weatherData.pressure ?? null,
      cloudCover: weatherData.cloudCover ?? null,
      uvIndex: weatherData.uvIndex ?? null,
      windSpeed: weatherData.windSpeed ?? null,
      windDirection: weatherData.windDirection ?? null,
      sunrise: weatherData.sunrise ?? null,
      sunset: weatherData.sunset ?? null,
      solarRadiation: weatherData.solarRadiation ?? null,
      dataSource,
    })
    .returning()
}

/**
 * Gets the latest weather data for a site
 *
 * @param siteId - Site ID
 * @returns Latest weather record or undefined
 */
export const getLatestWeather = async (siteId: number) => {
  const result = await db
    .select()
    .from(weather)
    .where(eq(weather.siteId, siteId))
    .orderBy(desc(weather.timestamp))
    .limit(1)

  return result[0]
}

/**
 * Gets weather history for a site
 *
 * @param siteId - Site ID
 * @param hours - Number of hours to look back (default: 24)
 * @returns Array of weather records
 */
export const getWeatherHistory = async (siteId: number, hours: number = 24) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  return await db
    .select()
    .from(weather)
    .where(and(eq(weather.siteId, siteId), gte(weather.timestamp, since)))
    .orderBy(desc(weather.timestamp))
}

/**
 * Gets all sites with their latest weather data
 *
 * @returns Array of sites with weather data
 */
export const getAllSitesWithWeather = async () => {
  const allSites = await db.select().from(sites)

  const sitesWithWeather = await Promise.all(
    allSites.map(async (site) => {
      const latestWeather = await getLatestWeather(site.id)
      return {
        ...site,
        weather: latestWeather || null,
      }
    })
  )

  return sitesWithWeather
}

/**
 * Deletes old weather data beyond retention period
 *
 * @param retentionDays - Number of days to retain (default: 30)
 * @returns Number of deleted records
 */
export const cleanOldWeatherData = async (retentionDays: number = 30) => {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

  const deleted = await db
    .delete(weather)
    .where(gte(weather.timestamp, cutoffDate))
    .returning()

  return deleted.length
}
