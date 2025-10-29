/**
 * Weather data types for BMS Dashboard
 * Location: Harry Gwala District, KwaZulu-Natal, South Africa
 * Timezone: Africa/Johannesburg (SAST, UTC+2)
 */

/**
 * Weather condition classifications based on cloud cover and precipitation
 */
export type WeatherCondition = 'clear' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy'

/**
 * Complete weather data for a single point in time
 */
export interface WeatherData {
  /** Timestamp for this weather reading */
  timestamp: Date
  /** Ambient temperature in degrees Celsius */
  temperature: number
  /** Relative humidity as a percentage (0-100) */
  humidity: number
  /** Cloud cover as a percentage (0-100) */
  cloudCover: number
  /** Solar irradiance in Watts per square meter (shortwave radiation) */
  solarIrradiance: number
  /** Wind speed in meters per second */
  windSpeed: number
  /** Precipitation in millimeters */
  precipitation: number
  /** UV index (0-11+) */
  uvIndex: number
  /** Sunrise time in local timezone */
  sunrise: Date
  /** Sunset time in local timezone */
  sunset: Date
  /** Classified weather condition */
  weatherCondition: WeatherCondition
}

/**
 * Geographic location for weather data
 */
export interface WeatherLocation {
  /** Latitude in decimal degrees */
  latitude: number
  /** Longitude in decimal degrees */
  longitude: number
  /** IANA timezone identifier */
  timezone: string
}

/**
 * Cached weather data entry
 */
export interface WeatherCacheEntry {
  /** Array of weather data points */
  data: WeatherData[]
  /** Timestamp when this data was cached (milliseconds since epoch) */
  cachedAt: number
  /** Start date of the weather data range (yyyy-MM-dd) */
  startDate: string
  /** End date of the weather data range (yyyy-MM-dd) */
  endDate: string
}

/**
 * OpenMeteo API response structure for hourly data
 */
export interface OpenMeteoHourlyResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    cloud_cover: number[]
    wind_speed_10m: number[]
    precipitation: number[]
    shortwave_radiation: number[]
    uv_index: number[]
  }
}

/**
 * OpenMeteo API response structure
 */
export interface OpenMeteoResponse {
  latitude: number
  longitude: number
  hourly: OpenMeteoHourlyResponse['hourly']
}

/**
 * Harry Gwala District location constants
 */
export const HARRY_GWALA_LOCATION: WeatherLocation = {
  latitude: -29.5,
  longitude: 29.8,
  timezone: 'Africa/Johannesburg'
}
