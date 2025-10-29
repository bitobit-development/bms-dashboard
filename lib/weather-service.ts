/**
 * Weather Service - Current Weather API Client
 *
 * Fetches current weather data from Open-Meteo API (free, no API key required).
 * Designed for live weather monitoring of BMS sites.
 *
 * API: https://open-meteo.com/en/docs
 */

import { z } from 'zod'

/**
 * Weather data schema for validation
 */
export const WeatherDataSchema = z.object({
  temperature: z.number(),
  feelsLike: z.number().optional(),
  humidity: z.number(),
  condition: z.string(),
  conditionCode: z.number().optional(),
  description: z.string().optional(),
  windSpeed: z.number().optional(),
  windDirection: z.number().optional(),
  cloudCover: z.number().optional(),
  uvIndex: z.number().optional(),
  pressure: z.number().optional(),
  sunrise: z.date().optional(),
  sunset: z.date().optional(),
  solarRadiation: z.number().optional(),
})

export type WeatherData = z.infer<typeof WeatherDataSchema>

/**
 * Open-Meteo weather codes to human-readable descriptions
 * Source: https://open-meteo.com/en/docs
 */
const WEATHER_CODE_MAP: Record<number, { condition: string; description: string }> = {
  0: { condition: 'Clear', description: 'Clear sky' },
  1: { condition: 'Mainly Clear', description: 'Mainly clear' },
  2: { condition: 'Partly Cloudy', description: 'Partly cloudy' },
  3: { condition: 'Cloudy', description: 'Overcast' },
  45: { condition: 'Foggy', description: 'Fog' },
  48: { condition: 'Foggy', description: 'Depositing rime fog' },
  51: { condition: 'Drizzle', description: 'Light drizzle' },
  53: { condition: 'Drizzle', description: 'Moderate drizzle' },
  55: { condition: 'Drizzle', description: 'Dense drizzle' },
  61: { condition: 'Rain', description: 'Slight rain' },
  63: { condition: 'Rain', description: 'Moderate rain' },
  65: { condition: 'Rain', description: 'Heavy rain' },
  71: { condition: 'Snow', description: 'Slight snow' },
  73: { condition: 'Snow', description: 'Moderate snow' },
  75: { condition: 'Snow', description: 'Heavy snow' },
  77: { condition: 'Snow', description: 'Snow grains' },
  80: { condition: 'Rain Showers', description: 'Slight rain showers' },
  81: { condition: 'Rain Showers', description: 'Moderate rain showers' },
  82: { condition: 'Rain Showers', description: 'Violent rain showers' },
  85: { condition: 'Snow Showers', description: 'Slight snow showers' },
  86: { condition: 'Snow Showers', description: 'Heavy snow showers' },
  95: { condition: 'Thunderstorm', description: 'Thunderstorm' },
  96: { condition: 'Thunderstorm', description: 'Thunderstorm with slight hail' },
  99: { condition: 'Thunderstorm', description: 'Thunderstorm with heavy hail' },
}

/**
 * Open-Meteo API response for current weather
 */
type OpenMeteoCurrentResponse = {
  current: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    weather_code: number
    cloud_cover: number
    surface_pressure: number
    wind_speed_10m: number
    wind_direction_10m: number
    uv_index: number
    shortwave_radiation: number
  }
  daily: {
    sunrise: string[]
    sunset: string[]
  }
}

/**
 * Weather Service Class
 *
 * Handles fetching current weather data from Open-Meteo API
 */
export class WeatherService {
  private baseUrl = 'https://api.open-meteo.com/v1/forecast'

  /**
   * Fetches current weather for a given location
   *
   * @param lat - Latitude in decimal degrees
   * @param lon - Longitude in decimal degrees
   * @returns Current weather data
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'weather_code',
          'cloud_cover',
          'surface_pressure',
          'wind_speed_10m',
          'wind_direction_10m',
          'uv_index',
          'shortwave_radiation'
        ].join(','),
        daily: 'sunrise,sunset',
        timezone: 'Africa/Johannesburg', // SAST timezone for South Africa
      })

      const url = `${this.baseUrl}?${params.toString()}`

      const response = await fetch(url, {
        next: { revalidate: 300 }, // Cache for 5 minutes (300 seconds)
      })

      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`)
      }

      const data: OpenMeteoCurrentResponse = await response.json()
      const current = data.current
      const daily = data.daily

      // Map weather code to condition
      const weatherInfo = WEATHER_CODE_MAP[current.weather_code] || {
        condition: 'Unknown',
        description: 'Unknown conditions',
      }

      return {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        condition: weatherInfo.condition,
        conditionCode: current.weather_code,
        description: weatherInfo.description,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        cloudCover: current.cloud_cover,
        uvIndex: current.uv_index,
        pressure: Math.round(current.surface_pressure),
        sunrise: daily?.sunrise?.[0] ? new Date(daily.sunrise[0]) : undefined,
        sunset: daily?.sunset?.[0] ? new Date(daily.sunset[0]) : undefined,
        solarRadiation: current.shortwave_radiation,
      }
    } catch (error) {
      console.error('Failed to fetch current weather:', error)
      throw error
    }
  }

  /**
   * Batch fetch current weather for multiple locations
   *
   * @param locations - Array of {lat, lon} objects
   * @returns Array of weather data (same order as input)
   */
  async getCurrentWeatherBatch(
    locations: Array<{ lat: number; lon: number }>
  ): Promise<WeatherData[]> {
    const results = await Promise.allSettled(
      locations.map(({ lat, lon }) => this.getCurrentWeather(lat, lon))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(
          `Failed to fetch weather for location ${index}:`,
          result.reason
        )
        // Return fallback data
        return {
          temperature: 20,
          humidity: 50,
          condition: 'Unknown',
          description: 'Weather data unavailable',
        }
      }
    })
  }
}

/**
 * Singleton instance
 */
export const weatherService = new WeatherService()

/**
 * Helper function to get battery temperature impact classification
 *
 * @param temperature - Temperature in Celsius
 * @returns Impact level: 'optimal' | 'acceptable' | 'warning'
 */
export const getBatteryTemperatureImpact = (
  temperature: number
): 'optimal' | 'acceptable' | 'warning' => {
  if (temperature >= 15 && temperature <= 25) {
    return 'optimal' // Green: 15-25°C
  } else if (temperature >= 5 && temperature <= 35) {
    return 'acceptable' // Yellow: 5-15°C or 25-35°C
  } else {
    return 'warning' // Red: <5°C or >35°C
  }
}

/**
 * Helper function to get weather condition emoji
 *
 * @param condition - Weather condition string
 * @returns Emoji representation
 */
export const getWeatherEmoji = (condition: string): string => {
  const lowerCondition = condition.toLowerCase()

  if (lowerCondition.includes('clear')) return '☀️'
  if (lowerCondition.includes('partly')) return '⛅'
  if (lowerCondition.includes('cloud')) return '☁️'
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return '🌧️'
  if (lowerCondition.includes('snow')) return '🌨️'
  if (lowerCondition.includes('thunder')) return '⛈️'
  if (lowerCondition.includes('fog')) return '🌫️'

  return '🌡️' // Default
}
