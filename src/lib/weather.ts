/**
 * Weather API Client for BMS Dashboard
 * Fetches historical weather data from OpenMeteo API and provides interpolation
 * for 5-minute interval data generation
 */

import { format, parseISO, addHours, addDays } from 'date-fns'
import type {
  WeatherData,
  WeatherCondition,
  WeatherLocation,
  OpenMeteoResponse
} from '../types/weather'
import { getCachedWeather, cacheWeather } from './weather-cache'

/**
 * Default location for weather data (Harry Gwala District)
 */
const DEFAULT_LOCATION: WeatherLocation = {
  latitude: -29.5,
  longitude: 29.8,
  timezone: 'Africa/Johannesburg'
}

/**
 * Fetches historical weather data from OpenMeteo API
 * Uses caching to minimize API calls
 *
 * @param startDate - Start date for weather data
 * @param endDate - End date for weather data
 * @param location - Geographic location (defaults to Harry Gwala District)
 * @returns Array of hourly weather data points
 */
export const fetchHistoricalWeather = async (
  startDate: Date,
  endDate: Date,
  location: WeatherLocation = DEFAULT_LOCATION
): Promise<WeatherData[]> => {
  // Validate date range
  if (startDate >= endDate) {
    throw new Error('Start date must be before end date')
  }

  const startDateStr = format(startDate, 'yyyy-MM-dd')
  const endDateStr = format(endDate, 'yyyy-MM-dd')

  // Check cache first
  const cached = await getCachedWeather(startDateStr, endDateStr)
  if (cached) {
    console.log('✓ Using cached weather data')
    return cached
  }

  console.log('⟳ Fetching weather from OpenMeteo API...')

  try {
    // Build API URL
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      start_date: startDateStr,
      end_date: endDateStr,
      timezone: location.timezone,
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'cloud_cover',
        'wind_speed_10m',
        'precipitation',
        'shortwave_radiation',
        'uv_index'
      ].join(',')
    })

    const url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`OpenMeteo API error: ${response.status} ${response.statusText}`)
    }

    const data: OpenMeteoResponse = await response.json()

    // Validate response structure
    if (!data.hourly || !data.hourly.time || data.hourly.time.length === 0) {
      throw new Error('Invalid API response: missing hourly data')
    }

    // Transform API data to WeatherData format
    const weatherData: WeatherData[] = data.hourly.time.map((timeStr, index) => {
      const timestamp = parseISO(timeStr)
      const temperature = data.hourly.temperature_2m[index]
      const humidity = data.hourly.relative_humidity_2m[index]
      const cloudCover = data.hourly.cloud_cover[index]
      const precipitation = data.hourly.precipitation[index]

      return {
        timestamp,
        temperature,
        humidity,
        cloudCover,
        solarIrradiance: data.hourly.shortwave_radiation[index],
        windSpeed: data.hourly.wind_speed_10m[index],
        precipitation,
        uvIndex: data.hourly.uv_index[index],
        sunrise: calculateSunrise(timestamp, location.latitude),
        sunset: calculateSunset(timestamp, location.latitude),
        weatherCondition: classifyWeatherCondition(cloudCover, precipitation)
      }
    })

    // Cache the weather data
    await cacheWeather(startDateStr, endDateStr, weatherData)

    console.log(`✓ Fetched ${weatherData.length} hourly weather data points`)

    return weatherData
  } catch (error) {
    console.error('Failed to fetch weather data:', error)
    throw error
  }
}

/**
 * Interpolates weather data to a specific timestamp
 * Uses linear interpolation between two hourly data points
 *
 * @param hourlyData - Array of hourly weather data (must be sorted by timestamp)
 * @param targetTimestamp - Target timestamp for interpolation
 * @returns Interpolated weather data
 */
export const interpolateWeatherData = (
  hourlyData: WeatherData[],
  targetTimestamp: Date
): WeatherData => {
  if (hourlyData.length === 0) {
    throw new Error('Cannot interpolate: no hourly data provided')
  }

  const targetTime = targetTimestamp.getTime()

  // Find the two surrounding data points
  let beforeIndex = -1
  let afterIndex = -1

  for (let i = 0; i < hourlyData.length; i++) {
    const dataTime = hourlyData[i].timestamp.getTime()

    if (dataTime <= targetTime) {
      beforeIndex = i
    }

    if (dataTime > targetTime && afterIndex === -1) {
      afterIndex = i
      break
    }
  }

  // If target is before all data points, return first point
  if (beforeIndex === -1) {
    return hourlyData[0]
  }

  // If target is after all data points, return last point
  if (afterIndex === -1) {
    return hourlyData[hourlyData.length - 1]
  }

  const before = hourlyData[beforeIndex]
  const after = hourlyData[afterIndex]

  // Calculate interpolation ratio (0 to 1)
  const beforeTime = before.timestamp.getTime()
  const afterTime = after.timestamp.getTime()
  const ratio = (targetTime - beforeTime) / (afterTime - beforeTime)

  // Linear interpolation for numeric values
  const interpolate = (a: number, b: number): number => a + (b - a) * ratio

  return {
    timestamp: targetTimestamp,
    temperature: interpolate(before.temperature, after.temperature),
    humidity: interpolate(before.humidity, after.humidity),
    cloudCover: interpolate(before.cloudCover, after.cloudCover),
    solarIrradiance: interpolate(before.solarIrradiance, after.solarIrradiance),
    windSpeed: interpolate(before.windSpeed, after.windSpeed),
    precipitation: before.precipitation, // Don't interpolate precipitation
    uvIndex: interpolate(before.uvIndex, after.uvIndex),
    sunrise: before.sunrise,
    sunset: before.sunset,
    weatherCondition: before.weatherCondition
  }
}

/**
 * Classifies weather condition based on cloud cover and precipitation
 *
 * @param cloudCover - Cloud cover percentage (0-100)
 * @param precipitation - Precipitation in mm
 * @returns Weather condition classification
 */
export const classifyWeatherCondition = (
  cloudCover: number,
  precipitation: number
): WeatherCondition => {
  // Stormy: heavy precipitation
  if (precipitation > 5) {
    return 'stormy'
  }

  // Rainy: any precipitation
  if (precipitation > 0) {
    return 'rainy'
  }

  // Clear: minimal cloud cover
  if (cloudCover < 20) {
    return 'clear'
  }

  // Partly cloudy: moderate cloud cover
  if (cloudCover < 60) {
    return 'partly_cloudy'
  }

  // Cloudy: heavy cloud cover
  return 'cloudy'
}

/**
 * Calculates sunrise time for a given date and latitude
 * Uses simplified astronomical calculation
 *
 * @param date - Date to calculate sunrise for
 * @param latitude - Latitude in decimal degrees
 * @returns Approximate sunrise time
 */
export const calculateSunrise = (date: Date, latitude: number): Date => {
  // Simple approximation for sunrise time
  // For South Africa (latitude ~-29.5), sunrise is around 5:30-6:30 AM

  // Day of year (1-365)
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  )

  // Approximate sunrise time variation throughout the year
  // Summer (Dec-Feb): earlier sunrise (~5:30 AM)
  // Winter (Jun-Aug): later sunrise (~6:30 AM)
  const seasonalOffset = Math.sin((dayOfYear - 172) * 2 * Math.PI / 365) * 0.5

  // Base sunrise time: 6:00 AM + seasonal variation
  const sunriseHour = 6 + seasonalOffset

  const sunrise = new Date(date)
  sunrise.setHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0, 0)

  return sunrise
}

/**
 * Calculates sunset time for a given date and latitude
 * Uses simplified astronomical calculation
 *
 * @param date - Date to calculate sunset for
 * @param latitude - Latitude in decimal degrees
 * @returns Approximate sunset time
 */
export const calculateSunset = (date: Date, latitude: number): Date => {
  // Simple approximation for sunset time
  // For South Africa (latitude ~-29.5), sunset is around 5:30-6:30 PM

  // Day of year (1-365)
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  )

  // Approximate sunset time variation throughout the year
  // Summer (Dec-Feb): later sunset (~6:30 PM)
  // Winter (Jun-Aug): earlier sunset (~5:30 PM)
  const seasonalOffset = Math.sin((dayOfYear - 172) * 2 * Math.PI / 365) * 0.5

  // Base sunset time: 6:00 PM + seasonal variation
  const sunsetHour = 18 + seasonalOffset

  const sunset = new Date(date)
  sunset.setHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0, 0)

  return sunset
}

/**
 * Gets weather data for a specific timestamp with interpolation
 *
 * @param timestamp - Target timestamp
 * @param hourlyData - Hourly weather data (will be fetched if not provided)
 * @returns Weather data for the specific timestamp
 */
export const getWeatherAtTimestamp = async (
  timestamp: Date,
  hourlyData?: WeatherData[]
): Promise<WeatherData> => {
  let data = hourlyData

  if (!data) {
    // Fetch weather for the day containing the timestamp
    const startDate = new Date(timestamp)
    startDate.setHours(0, 0, 0, 0)

    const endDate = addDays(startDate, 1)

    data = await fetchHistoricalWeather(startDate, endDate)
  }

  return interpolateWeatherData(data, timestamp)
}
