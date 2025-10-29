# Weather Module Documentation

## Overview

The Weather Module provides real-time and historical weather data integration for the BMS Dashboard. It fetches weather data from the OpenMeteo API and provides intelligent caching and interpolation capabilities for generating realistic battery performance simulations.

**Location**: Harry Gwala District, KwaZulu-Natal, South Africa
- Latitude: -29.5°
- Longitude: 29.8°
- Timezone: Africa/Johannesburg (SAST, UTC+2)

## Features

- ✅ Fetch historical weather data from OpenMeteo API
- ✅ Intelligent caching system (24-hour cache duration)
- ✅ Linear interpolation for 5-minute interval data
- ✅ Weather condition classification
- ✅ Sunrise/sunset calculation
- ✅ Full TypeScript support with strict types

## Architecture

### Files Structure

```
src/
├── types/
│   └── weather.ts          # TypeScript types and interfaces
├── lib/
│   ├── weather.ts          # Main weather API client
│   └── weather-cache.ts    # Caching system
└── scripts/
    └── test-weather.ts     # Test script
```

### Data Flow

```
1. Request weather data
   ↓
2. Check cache
   ↓
3. If cached & valid → Return cached data
   ↓
4. If not cached → Fetch from OpenMeteo API
   ↓
5. Transform & validate data
   ↓
6. Cache for future use
   ↓
7. Return weather data
```

## API Details

### OpenMeteo Archive API

**Endpoint**: `https://archive-api.open-meteo.com/v1/archive`

**Features**:
- No API key required
- Free tier available
- Historical weather data dating back to 1940
- Hourly resolution data

**Parameters**:
- `latitude`, `longitude` - Geographic coordinates
- `start_date`, `end_date` - Date range (yyyy-MM-dd format)
- `timezone` - IANA timezone identifier
- `hourly` - Comma-separated list of weather variables

**Variables Used**:
- `temperature_2m` - Temperature at 2 meters (°C)
- `relative_humidity_2m` - Relative humidity at 2 meters (%)
- `cloud_cover` - Cloud cover percentage (0-100%)
- `wind_speed_10m` - Wind speed at 10 meters (m/s)
- `precipitation` - Precipitation (mm)
- `shortwave_radiation` - Solar irradiance (W/m²)
- `uv_index` - UV index (0-11+)

### Example Request

```
https://archive-api.open-meteo.com/v1/archive?latitude=-29.5&longitude=29.8&start_date=2025-10-01&end_date=2025-10-29&hourly=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,precipitation,shortwave_radiation,uv_index&timezone=Africa/Johannesburg
```

### Response Format

```json
{
  "latitude": -29.5,
  "longitude": 29.8,
  "hourly": {
    "time": ["2025-10-01T00:00", "2025-10-01T01:00", ...],
    "temperature_2m": [18.5, 17.8, ...],
    "relative_humidity_2m": [75, 78, ...],
    "cloud_cover": [30, 40, ...],
    "wind_speed_10m": [3.2, 2.8, ...],
    "precipitation": [0, 0, ...],
    "shortwave_radiation": [0, 0, ...],
    "uv_index": [0, 0, ...]
  }
}
```

## Caching Strategy

### Cache Location
`.cache/weather/`

### Cache File Format
`{startDate}_{endDate}.json`

Example: `2025-10-01_2025-10-29.json`

### Cache Duration
24 hours (historical weather data rarely changes)

### Cache Structure

```json
{
  "cachedAt": 1730189400000,
  "startDate": "2025-10-01",
  "endDate": "2025-10-29",
  "data": [
    {
      "timestamp": "2025-10-01T00:00:00.000Z",
      "temperature": 18.5,
      "humidity": 75,
      "cloudCover": 30,
      "solarIrradiance": 0,
      "windSpeed": 3.2,
      "precipitation": 0,
      "uvIndex": 0,
      "sunrise": "2025-10-01T05:30:00.000Z",
      "sunset": "2025-10-01T18:30:00.000Z",
      "weatherCondition": "partly_cloudy"
    }
  ]
}
```

### Cache Management Functions

```typescript
// Get cached weather (returns null if not found or expired)
const cached = await getCachedWeather(startDate, endDate)

// Cache weather data
await cacheWeather(startDate, endDate, weatherData)

// Clear all cached data
const deletedCount = await clearWeatherCache()

// Get cache statistics
const stats = await getCacheStats()
```

## Interpolation Logic

The module provides linear interpolation to generate 5-minute interval data from hourly data.

### Algorithm

1. Find two surrounding hourly data points (before and after target)
2. Calculate interpolation ratio: `ratio = (target - before) / (after - before)`
3. Apply linear interpolation: `value = beforeValue + (afterValue - beforeValue) * ratio`

### Interpolated Fields

- ✅ Temperature
- ✅ Humidity
- ✅ Cloud cover
- ✅ Solar irradiance
- ✅ Wind speed
- ✅ UV index

### Non-Interpolated Fields

- ❌ Precipitation (uses current hour value)
- ❌ Sunrise/sunset (uses current hour values)
- ❌ Weather condition (uses current hour classification)

### Example

```typescript
// Hourly data points
// 14:00 - Temp: 22.0°C, Solar: 800 W/m²
// 15:00 - Temp: 23.0°C, Solar: 750 W/m²

// Target: 14:35 (35 minutes = 0.583 ratio)
const interpolated = interpolateWeatherData(hourlyData, targetTimestamp)

// Result:
// Temp: 22.0 + (23.0 - 22.0) * 0.583 = 22.583°C
// Solar: 800 + (750 - 800) * 0.583 = 770.85 W/m²
```

## Weather Condition Classification

Weather conditions are automatically classified based on cloud cover and precipitation:

| Condition | Cloud Cover | Precipitation |
|-----------|-------------|---------------|
| `clear` | < 20% | 0 mm |
| `partly_cloudy` | 20-60% | 0 mm |
| `cloudy` | > 60% | 0 mm |
| `rainy` | Any | 0-5 mm |
| `stormy` | Any | > 5 mm |

## TypeScript Types

### WeatherData

```typescript
interface WeatherData {
  timestamp: Date              // Timestamp for this reading
  temperature: number          // °C (ambient)
  humidity: number             // 0-100%
  cloudCover: number          // 0-100%
  solarIrradiance: number     // W/m² (shortwave radiation)
  windSpeed: number           // m/s
  precipitation: number       // mm
  uvIndex: number             // 0-11+
  sunrise: Date               // Local time
  sunset: Date                // Local time
  weatherCondition: WeatherCondition
}
```

### WeatherCondition

```typescript
type WeatherCondition = 'clear' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy'
```

### WeatherLocation

```typescript
interface WeatherLocation {
  latitude: number      // Decimal degrees
  longitude: number     // Decimal degrees
  timezone: string      // IANA timezone
}
```

## Usage Examples

### Basic Usage

```typescript
import { fetchHistoricalWeather } from '@/lib/weather'
import { addDays } from 'date-fns'

// Fetch last 7 days of weather
const endDate = new Date()
const startDate = addDays(endDate, -7)

const weatherData = await fetchHistoricalWeather(startDate, endDate)

console.log(`Fetched ${weatherData.length} hourly data points`)
```

### Get Weather at Specific Timestamp

```typescript
import { getWeatherAtTimestamp } from '@/lib/weather'

// Get weather at a specific time with 5-minute precision
const timestamp = new Date('2025-10-15T14:35:00')
const weather = await getWeatherAtTimestamp(timestamp)

console.log(`Temperature: ${weather.temperature}°C`)
console.log(`Solar Irradiance: ${weather.solarIrradiance} W/m²`)
```

### Manual Interpolation

```typescript
import { fetchHistoricalWeather, interpolateWeatherData } from '@/lib/weather'

// Fetch hourly data
const weatherData = await fetchHistoricalWeather(startDate, endDate)

// Interpolate for 5-minute intervals
const timestamp = new Date('2025-10-15T14:25:00')
const interpolated = interpolateWeatherData(weatherData, timestamp)
```

### Custom Location

```typescript
import { fetchHistoricalWeather } from '@/lib/weather'
import type { WeatherLocation } from '@/types/weather'

const customLocation: WeatherLocation = {
  latitude: -33.9249,
  longitude: 18.4241,
  timezone: 'Africa/Johannesburg'
}

const weatherData = await fetchHistoricalWeather(
  startDate,
  endDate,
  customLocation
)
```

### Cache Management

```typescript
import { clearWeatherCache, getCacheStats } from '@/lib/weather-cache'

// Clear all cached weather data
const deletedFiles = await clearWeatherCache()
console.log(`Deleted ${deletedFiles} cache files`)

// Get cache statistics
const stats = await getCacheStats()
console.log(`Cache files: ${stats.fileCount}`)
console.log(`Total size: ${stats.totalSizeBytes} bytes`)
```

## Testing

### Run Test Script

```bash
pnpm weather:test
```

The test script will:
1. Clear existing cache
2. Fetch weather data for last 7 days
3. Display statistics (avg temp, solar, etc.)
4. Demonstrate interpolation with example
5. Verify cache functionality
6. Show sample data points

### Expected Output

```
🌤️  Testing Weather Integration

============================================================

📦 Test 1: Cache Management
------------------------------------------------------------
✓ Cleared cache: 1 file(s) deleted

🌍 Test 2: Fetch Historical Weather Data
------------------------------------------------------------
Location: Harry Gwala District, South Africa
Coordinates: -29.5°, 29.8°
Timezone: Africa/Johannesburg
Date Range: 2025-10-22 to 2025-10-29

⟳ Fetching weather from OpenMeteo API...
✓ Fetched 169 hourly data points in 1.23s

📊 Test 3: Weather Data Statistics
------------------------------------------------------------
Temperature:
  Average: 18.5°C
  Range: 12.3°C - 25.7°C

Solar Irradiance:
  Average: 245 W/m²
  Peak: 892 W/m²

Other Metrics:
  Average Humidity: 65.3%
  Average Wind Speed: 3.2 m/s

Weather Conditions Breakdown:
  clear: 48 hours (28.4%)
  partly_cloudy: 67 hours (39.6%)
  cloudy: 42 hours (24.9%)
  rainy: 12 hours (7.1%)

✅ All tests passed successfully!
```

## Error Handling

All functions include proper error handling:

```typescript
try {
  const weather = await fetchHistoricalWeather(startDate, endDate)
} catch (error) {
  console.error('Failed to fetch weather:', error)
  // Handle error appropriately
}
```

Common errors:
- API request failures (network, rate limits)
- Invalid date ranges (start > end)
- Missing or invalid API response data
- Cache read/write failures (non-critical, logged only)

## Performance Considerations

### API Calls
- First fetch: ~1-2 seconds for 7 days of data
- Cached fetch: ~10-50ms (100x faster)

### Cache Size
- ~10-20 KB per day of weather data
- 7 days ≈ 70-140 KB
- 30 days ≈ 300-600 KB

### Memory Usage
- Hourly data for 7 days: ~170 data points
- Hourly data for 30 days: ~720 data points
- Each data point: ~200 bytes

## Integration with BMS System

The weather module is designed to integrate with the BMS data seeding system:

1. **Battery Performance Simulation**
   - Solar irradiance → Solar panel output
   - Temperature → Battery efficiency
   - Weather conditions → Usage patterns

2. **Data Seeding**
   - Generate realistic battery data based on weather
   - Correlate SoC with solar production
   - Simulate temperature effects on performance

3. **Future Enhancements**
   - Real-time weather forecasts
   - Weather-based predictive maintenance
   - Climate-adjusted battery sizing

## Limitations

1. **Historical Data Only**
   - OpenMeteo Archive API provides past weather data
   - For forecasts, use OpenMeteo Forecast API (future enhancement)

2. **Hourly Resolution**
   - Raw data is hourly
   - 5-minute data is interpolated (approximation)

3. **Simplified Calculations**
   - Sunrise/sunset uses simple astronomical formulas
   - Not accounting for terrain, elevation, or atmospheric effects

4. **Location-Specific**
   - Optimized for Harry Gwala District
   - Can be used for other locations with custom parameters

## Future Enhancements

- [ ] Weather forecast integration (next 7 days)
- [ ] Multiple location support
- [ ] Advanced astronomical calculations (suncalc library)
- [ ] Weather pattern analysis
- [ ] Extreme weather alerts
- [ ] Integration with battery performance models

## Troubleshooting

### Cache Not Working

Check if `.cache/weather/` directory exists:
```bash
ls -la .cache/weather/
```

Clear cache and retry:
```bash
rm -rf .cache/weather/
pnpm weather:test
```

### API Rate Limits

OpenMeteo has generous rate limits, but if you hit them:
- Wait a few minutes
- Use cached data when available
- Reduce date ranges in requests

### Invalid Data

Verify API response structure:
```typescript
const response = await fetch(url)
const data = await response.json()
console.log(JSON.stringify(data, null, 2))
```

## Resources

- [OpenMeteo API Documentation](https://open-meteo.com/en/docs/historical-weather-api)
- [OpenMeteo Archive API](https://open-meteo.com/en/docs/historical-weather-api)
- [date-fns Documentation](https://date-fns.org/)

## License

This module is part of the BMS Dashboard project.
