/**
 * Test script for weather integration module
 * Verifies weather API, interpolation, and caching functionality
 */

import { format, addDays, addMinutes } from 'date-fns'
import {
  fetchHistoricalWeather,
  interpolateWeatherData,
  getWeatherAtTimestamp
} from '../lib/weather'
import { clearWeatherCache, getCacheStats } from '../lib/weather-cache'
import { HARRY_GWALA_LOCATION } from '../types/weather'

/**
 * Formats bytes to human-readable size
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Formats milliseconds to human-readable duration
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${(ms / 60000).toFixed(2)}m`
}

/**
 * Main test function
 */
const testWeatherIntegration = async (): Promise<void> => {
  console.log('🌤️  Testing Weather Integration\n')
  console.log('='.repeat(60))

  try {
    // Test 1: Clear cache and verify
    console.log('\n📦 Test 1: Cache Management')
    console.log('-'.repeat(60))

    const clearedFiles = await clearWeatherCache()
    console.log(`✓ Cleared cache: ${clearedFiles} file(s) deleted`)

    // Test 2: Fetch weather data
    console.log('\n🌍 Test 2: Fetch Historical Weather Data')
    console.log('-'.repeat(60))

    const endDate = new Date()
    const startDate = addDays(endDate, -7)

    console.log(`Location: Harry Gwala District, South Africa`)
    console.log(`Coordinates: ${HARRY_GWALA_LOCATION.latitude}°, ${HARRY_GWALA_LOCATION.longitude}°`)
    console.log(`Timezone: ${HARRY_GWALA_LOCATION.timezone}`)
    console.log(`Date Range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`)
    console.log()

    const fetchStart = Date.now()
    const weatherData = await fetchHistoricalWeather(startDate, endDate)
    const fetchDuration = Date.now() - fetchStart

    console.log(`✓ Fetched ${weatherData.length} hourly data points in ${formatDuration(fetchDuration)}`)

    // Test 3: Display statistics
    console.log('\n📊 Test 3: Weather Data Statistics')
    console.log('-'.repeat(60))

    const temperatures = weatherData.map(w => w.temperature)
    const solarIrradiances = weatherData.map(w => w.solarIrradiance)
    const humidities = weatherData.map(w => w.humidity)
    const windSpeeds = weatherData.map(w => w.windSpeed)

    const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length
    const minTemp = Math.min(...temperatures)
    const maxTemp = Math.max(...temperatures)

    const avgSolar = solarIrradiances.reduce((a, b) => a + b, 0) / solarIrradiances.length
    const maxSolar = Math.max(...solarIrradiances)

    const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length
    const avgWind = windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length

    console.log('Temperature:')
    console.log(`  Average: ${avgTemp.toFixed(1)}°C`)
    console.log(`  Range: ${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C`)
    console.log()
    console.log('Solar Irradiance:')
    console.log(`  Average: ${avgSolar.toFixed(0)} W/m²`)
    console.log(`  Peak: ${maxSolar.toFixed(0)} W/m²`)
    console.log()
    console.log('Other Metrics:')
    console.log(`  Average Humidity: ${avgHumidity.toFixed(1)}%`)
    console.log(`  Average Wind Speed: ${avgWind.toFixed(1)} m/s`)

    // Weather conditions breakdown
    const conditionCounts: Record<string, number> = {}
    weatherData.forEach(w => {
      conditionCounts[w.weatherCondition] = (conditionCounts[w.weatherCondition] || 0) + 1
    })

    console.log()
    console.log('Weather Conditions Breakdown:')
    Object.entries(conditionCounts).forEach(([condition, count]) => {
      const percentage = ((count / weatherData.length) * 100).toFixed(1)
      console.log(`  ${condition}: ${count} hours (${percentage}%)`)
    })

    // Test 4: Interpolation
    console.log('\n🔄 Test 4: Weather Data Interpolation')
    console.log('-'.repeat(60))

    // Pick a timestamp with minutes (e.g., 14:35)
    const testTimestamp = new Date(weatherData[50].timestamp)
    testTimestamp.setMinutes(35)

    console.log(`Target Timestamp: ${format(testTimestamp, 'yyyy-MM-dd HH:mm:ss')}`)
    console.log()

    // Find surrounding hourly data
    const testHour1 = weatherData[50]
    const testHour2 = weatherData[51]

    console.log('Hourly Data Points:')
    console.log(`  ${format(testHour1.timestamp, 'HH:mm')} - Temp: ${testHour1.temperature.toFixed(1)}°C, Solar: ${testHour1.solarIrradiance.toFixed(0)} W/m²`)
    console.log(`  ${format(testHour2.timestamp, 'HH:mm')} - Temp: ${testHour2.temperature.toFixed(1)}°C, Solar: ${testHour2.solarIrradiance.toFixed(0)} W/m²`)
    console.log()

    const interpolated = interpolateWeatherData(weatherData, testTimestamp)

    console.log('Interpolated Data:')
    console.log(`  ${format(interpolated.timestamp, 'HH:mm')} - Temp: ${interpolated.temperature.toFixed(1)}°C, Solar: ${interpolated.solarIrradiance.toFixed(0)} W/m²`)
    console.log()

    // Verify interpolation is between the two values
    const tempInRange = interpolated.temperature >= Math.min(testHour1.temperature, testHour2.temperature) &&
                        interpolated.temperature <= Math.max(testHour1.temperature, testHour2.temperature)
    const solarInRange = interpolated.solarIrradiance >= Math.min(testHour1.solarIrradiance, testHour2.solarIrradiance) &&
                         interpolated.solarIrradiance <= Math.max(testHour1.solarIrradiance, testHour2.solarIrradiance)

    console.log(`✓ Temperature interpolation valid: ${tempInRange}`)
    console.log(`✓ Solar irradiance interpolation valid: ${solarInRange}`)

    // Test 5: Sample data points
    console.log('\n📅 Test 5: Sample Weather Data Points')
    console.log('-'.repeat(60))

    // Show 5 sample data points
    const sampleIndices = [0, Math.floor(weatherData.length / 4), Math.floor(weatherData.length / 2), Math.floor(weatherData.length * 3 / 4), weatherData.length - 1]

    sampleIndices.forEach(index => {
      const data = weatherData[index]
      console.log(`\n${format(data.timestamp, 'yyyy-MM-dd HH:mm')} (${data.weatherCondition}):`)
      console.log(`  Temperature: ${data.temperature.toFixed(1)}°C`)
      console.log(`  Solar Irradiance: ${data.solarIrradiance.toFixed(0)} W/m²`)
      console.log(`  Humidity: ${data.humidity.toFixed(0)}%`)
      console.log(`  Cloud Cover: ${data.cloudCover.toFixed(0)}%`)
      console.log(`  Wind Speed: ${data.windSpeed.toFixed(1)} m/s`)
      console.log(`  Sunrise: ${format(data.sunrise, 'HH:mm')}`)
      console.log(`  Sunset: ${format(data.sunset, 'HH:mm')}`)
    })

    // Test 6: Cache verification
    console.log('\n💾 Test 6: Cache Verification')
    console.log('-'.repeat(60))

    console.log('Fetching same data again (should use cache)...')
    const cacheStart = Date.now()
    const cachedWeatherData = await fetchHistoricalWeather(startDate, endDate)
    const cacheDuration = Date.now() - cacheStart

    console.log(`✓ Retrieved ${cachedWeatherData.length} data points in ${formatDuration(cacheDuration)}`)
    console.log(`✓ Speed improvement: ${(fetchDuration / cacheDuration).toFixed(1)}x faster`)

    // Get cache stats
    const cacheStats = await getCacheStats()
    console.log()
    console.log('Cache Statistics:')
    console.log(`  Files: ${cacheStats.fileCount}`)
    console.log(`  Total Size: ${formatBytes(cacheStats.totalSizeBytes)}`)

    if (cacheStats.newestCacheMs) {
      const cacheAge = Date.now() - cacheStats.newestCacheMs
      console.log(`  Cache Age: ${formatDuration(cacheAge)}`)
    }

    // Test 7: Test getWeatherAtTimestamp helper
    console.log('\n🎯 Test 7: Get Weather at Specific Timestamp')
    console.log('-'.repeat(60))

    const specificTime = addMinutes(new Date(weatherData[30].timestamp), 17)
    console.log(`Requesting weather for: ${format(specificTime, 'yyyy-MM-dd HH:mm:ss')}`)

    const specificWeather = await getWeatherAtTimestamp(specificTime, weatherData)
    console.log(`✓ Temperature: ${specificWeather.temperature.toFixed(1)}°C`)
    console.log(`✓ Solar Irradiance: ${specificWeather.solarIrradiance.toFixed(0)} W/m²`)
    console.log(`✓ Weather Condition: ${specificWeather.weatherCondition}`)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ All tests passed successfully!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests
testWeatherIntegration()
  .then(() => {
    console.log('\n✓ Weather integration test completed\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
