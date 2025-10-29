# Weather-Aware Data Seeding Guide

Complete guide to the weather-aware data seeding system for the BMS Dashboard. This system generates realistic telemetry data using real historical weather data and physics-based simulations.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Components](#components)
- [How It Works](#how-it-works)
- [Formulas and Calculations](#formulas-and-calculations)
- [Usage](#usage)
- [Validation](#validation)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

---

## Overview

The weather-aware seeding system generates realistic BMS telemetry data by:

1. **Fetching real historical weather** from OpenMeteo API
2. **Calculating solar production** using physics-based models
3. **Simulating battery behavior** with temperature effects and charge/discharge cycles
4. **Generating load patterns** based on site type and time of day
5. **Maintaining energy balance** across the entire system

### Key Features

- ✅ **Physics-based calculations** - Solar irradiance, sun angle, temperature effects
- ✅ **Real weather data** - Historical data from Harry Gwala District, South Africa
- ✅ **Battery simulation** - Realistic charge/discharge, temperature, health degradation
- ✅ **Load patterns** - Residential, commercial, industrial profiles
- ✅ **Energy balance** - Solar + Grid = Load + Storage + Export
- ✅ **Time-series aggregations** - Hourly and daily rollups
- ✅ **High performance** - Batch insertions, ~1 minute per site for 30 days

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Weather-Aware Seeding                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   1. Fetch Historical Weather Data      │
        │      (OpenMeteo API + Caching)          │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   2. For Each Site (5-min intervals)    │
        └─────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │  Solar    │  │  Load     │  │  Battery  │
        │Calculator │  │ Simulator │  │ Simulator │
        └───────────┘  └───────────┘  └───────────┘
                │             │             │
                └─────────────┼─────────────┘
                              ▼
        ┌─────────────────────────────────────────┐
        │   3. Generate Telemetry Reading         │
        │      (Battery, Solar, Grid, Load)       │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   4. Batch Insert to Database           │
        │      (500 readings at a time)           │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   5. Generate Aggregations              │
        │      • Hourly (12 readings)             │
        │      • Daily (24 hours)                 │
        └─────────────────────────────────────────┘
```

---

## Components

### 1. Solar Production Calculator (`src/lib/solar-calculator.ts`)

Calculates realistic solar power production using physics-based models.

**Key Features:**
- Solar irradiance normalization (W/m²)
- Sun angle factor (sine curve from sunrise to sunset)
- Temperature effects on panel efficiency (-0.5%/°C above 25°C)
- Cloud cover impact (up to 30% additional loss)
- Inverter efficiency (97%)
- System losses (14% - wiring, soiling, shading)
- Realistic noise (±5%)

**Main Functions:**
- `calculateSolarProduction()` - Calculates power output in kW
- `calculateSunAngleFactor()` - Models sun's path across sky
- `calculateSolarEfficiency()` - Actual vs theoretical efficiency
- `getDefaultSolarConfig()` - Site-specific configuration

### 2. Battery Simulator (`src/lib/battery-simulator.ts`)

Simulates realistic battery behavior over time.

**Key Features:**
- State of Charge (SOC) management (20-95% range)
- Non-linear voltage curve (Li-ion characteristics)
- Charge/discharge rate limits (0.5C charge, 1C discharge)
- Temperature effects and battery heating
- Self-discharge (~0.87% per day)
- Health degradation over time
- Efficiency losses (95% charging/discharging)

**Main Class:**
- `BatterySimulator` - Stateful battery simulation
- `simulate()` - Simulates time step with power flows
- `getState()` / `setState()` - State management

### 3. Load Pattern Simulator (`src/lib/load-simulator.ts`)

Generates realistic electrical load patterns.

**Key Features:**
- Three site types: residential, commercial, industrial
- Time-of-day patterns (peak, shoulder, off-peak)
- Weekend vs weekday differences
- Temperature-sensitive loads (AC usage)
- Realistic noise (±10%)

**Load Profiles:**

| Site Type    | Base Load | Peak Load | Peak Hours       | Weekend Factor | Temp Sensitivity |
|--------------|-----------|-----------|------------------|----------------|------------------|
| Residential  | 30%       | 3.0x avg  | 7-8am, 5-10pm    | 1.2 (20% more) | 0.15 kW/°C      |
| Commercial   | 20%       | 2.5x avg  | 9am-4pm          | 0.3 (70% less) | 0.25 kW/°C      |
| Industrial   | 70%       | 1.5x avg  | 8am-5pm          | 0.5 (50%)      | 0.05 kW/°C      |

### 4. Weather Integration (`src/lib/weather.ts`)

Fetches and caches historical weather data.

**Key Features:**
- OpenMeteo Archive API integration
- Hourly weather data (temperature, humidity, irradiance, etc.)
- Linear interpolation for 5-minute intervals
- File-based caching to minimize API calls
- Location: Harry Gwala District, South Africa (-29.5°, 29.8°)

### 5. Seeding Script (`src/db/seed-weather.ts`)

Main orchestration script that ties everything together.

**Key Features:**
- Batch processing (500 readings at a time)
- Progress reporting
- Hourly and daily aggregations
- Energy balance validation
- Configurable date ranges and options

---

## How It Works

### Step-by-Step Process

#### 1. Initialize Weather Data
```typescript
// Fetch 30 days of historical weather
const startDate = addDays(new Date(), -30)
const endDate = new Date()
const weatherData = await fetchHistoricalWeather(startDate, endDate)
// Returns 720 hourly readings (30 days × 24 hours)
```

#### 2. Initialize Site Simulators
```typescript
// For each site:
const solarConfig = getDefaultSolarConfig(site)
const loadProfile = getLoadProfile(site)
const batterySimulator = new BatterySimulator(site, {
  soc: 0.85,      // Start at 85%
  temperature: 25,
  health: 98
})
```

#### 3. Generate Readings (5-minute intervals)
```typescript
// For each timestamp (every 5 minutes):
const weather = interpolateWeatherData(weatherData, timestamp)

// Calculate solar production
const solarPowerKw = calculateSolarProduction(weather, solarConfig, timestamp)

// Calculate load consumption
const loadPowerKw = calculateLoadPower(timestamp, weather, loadProfile)

// Simulate battery (returns grid import/export)
const simulation = batterySimulator.simulate(
  5,              // 5 minutes
  solarPowerKw,
  loadPowerKw,
  weather.temperature,
  true            // grid available
)

// Create telemetry reading with all metrics
const reading = {
  timestamp,
  batteryVoltage: simulation.batteryState.voltage,
  batteryCurrent: simulation.batteryState.current,
  batteryChargeLevel: simulation.batteryState.soc * 100,
  solarPowerKw,
  loadPowerKw,
  gridImportKw: simulation.gridImportKw,
  gridExportKw: simulation.gridExportKw,
  // ... more fields
}
```

#### 4. Batch Insert
```typescript
// Insert in batches of 500
if (readings.length >= 500) {
  await db.insert(telemetryReadings).values(readings)
  readings.length = 0
}
```

#### 5. Generate Aggregations
```typescript
// Hourly: Aggregate 12 readings (5-min × 12 = 1 hour)
await generateHourlyAggregations(siteId, startDate, endDate)

// Daily: Aggregate 24 hourly records
await generateDailySummaries(siteId, startDate, endDate)
```

---

## Formulas and Calculations

### Solar Production

```
P_solar = Capacity × (Irradiance/1000) × SunAngle × TempFactor × CloudFactor × InverterEff × (1 - Losses) × Noise
```

Where:
- **Capacity**: Panel capacity in kW (e.g., 15 kW)
- **Irradiance**: Solar irradiance in W/m² (0-1000)
- **SunAngle**: `sin(π × dayFraction)` where `dayFraction = (time - sunrise) / (sunset - sunrise)`
- **TempFactor**: `1 + coeff × (temp - 25°C)` where `coeff = -0.005`
- **CloudFactor**: `1 - (cloudCover/100) × 0.3` (up to 30% additional loss)
- **InverterEff**: 0.97 (97%)
- **Losses**: 0.14 (14% - wiring, soiling, shading)
- **Noise**: `1 + random(-0.05, +0.05)` (±5%)

**Returns 0 if:**
- Before sunrise or after sunset
- Solar irradiance = 0

### Battery Simulation

**Energy Balance:**
```
Solar + Grid Import = Load + Grid Export + Battery Change
```

**SOC Update:**
```
SOC_new = SOC_old + (Energy_in - Energy_out - Self_discharge) / Capacity
```

Where:
- **Energy_in**: Charging energy × efficiency (95%)
- **Energy_out**: Discharging energy ÷ efficiency (95%)
- **Self_discharge**: `SOC × Capacity × 0.00001 × minutes` (~0.87% per day)

**Voltage Curve (Li-ion):**
```
V = V_min + (V_max - V_min) × sqrt(SOC)
```

Where:
- **V_min**: 480V (96% of nominal 500V)
- **V_max**: 520V (104% of nominal 500V)
- Square root provides non-linear curve

**Current:**
```
I = P / V  (where P is in watts, V in volts)
```
- Negative current = charging
- Positive current = discharging

**C-Rate Limits:**
- Max charge rate: 0.5C (0.5 × capacity in kW)
- Max discharge rate: 1.0C (1.0 × capacity in kW)

### Load Patterns

**Base Formula:**
```
Load = (BaseLoad + (PeakLoad - BaseLoad) × TOD_Factor + TempLoad) × WeekendFactor × Noise
```

Where:
- **BaseLoad**: Minimum load (20-70% of average based on type)
- **PeakLoad**: Maximum load (1.5-3.0x average based on type)
- **TOD_Factor**: Time-of-day factor (1.0 = peak, 0.7 = shoulder, 0.4 = off-peak)
- **TempLoad**: `TempSensitivity × max(0, Temperature - 25°C)`
- **WeekendFactor**: Site-specific (0.3-1.2)
- **Noise**: `1 + random(-0.1, +0.1)` (±10%)

### Energy Conservation

**Validation:**
```
Input = Solar + Grid Import
Output = Load + Grid Export + Battery Change
Loss = (Input - Output) / Input × 100%
```

**Expected Loss:** 5-20% (accounting for inefficiencies)

---

## Usage

### Basic Usage

```bash
# Generate 30 days of weather-aware data for all sites
pnpm db:seed:weather
```

### View Generated Data

```bash
# Open Drizzle Studio to explore data
pnpm db:studio
```

Navigate to:
- `telemetry_readings` - 5-minute interval data
- `telemetry_hourly` - Hourly aggregations
- `telemetry_daily` - Daily summaries

### Programmatic Usage

```typescript
import { seedWeatherAwareData } from './src/db/seed-weather'

// Custom options
await seedWeatherAwareData({
  daysToGenerate: 7,   // Generate 7 days
  batchSize: 1000,     // Larger batches
  verbose: true        // Show progress
})
```

### Prerequisites

1. **Database must be set up:**
   ```bash
   pnpm db:push  # Push schema to database
   ```

2. **Sites must exist:**
   ```bash
   pnpm db:seed  # Create sites and equipment
   ```

3. **Environment variables:**
   ```env
   DATABASE_URL=postgresql://...
   ```

---

## Validation

### Manual Verification Checklist

#### 1. Solar Production
- ✅ Solar power is 0 at night (before sunrise, after sunset)
- ✅ Solar power peaks around noon (12:00-14:00)
- ✅ Solar power correlates with weather (lower on cloudy days)
- ✅ Solar efficiency is 70-95% during daylight

**SQL Query:**
```sql
SELECT
  timestamp,
  solar_power_kw,
  solar_efficiency,
  metadata->>'weatherCondition' as weather
FROM telemetry_readings
WHERE site_id = 1
  AND timestamp::date = CURRENT_DATE - INTERVAL '1 day'
ORDER BY timestamp;
```

#### 2. Battery Behavior
- ✅ Battery charge level stays between 20-95%
- ✅ Battery charges during surplus solar production
- ✅ Battery discharges during evening load peaks
- ✅ Battery voltage follows SOC curve (480-520V)
- ✅ Battery health degrades slowly (98% → ~97.9% over 30 days)

**SQL Query:**
```sql
SELECT
  timestamp,
  battery_charge_level,
  battery_voltage,
  battery_current,
  battery_power_kw
FROM telemetry_readings
WHERE site_id = 1
ORDER BY timestamp DESC
LIMIT 100;
```

#### 3. Load Patterns
- ✅ Residential: Peaks morning (7-9am) and evening (6-10pm)
- ✅ Commercial: High during business hours (9am-4pm), low on weekends
- ✅ Industrial: Consistent with peak during day shift
- ✅ Load increases with temperature (AC usage)

**SQL Query:**
```sql
SELECT
  EXTRACT(HOUR FROM timestamp) as hour,
  AVG(load_power_kw) as avg_load,
  MAX(load_power_kw) as max_load,
  MIN(load_power_kw) as min_load
FROM telemetry_readings
WHERE site_id = 1
  AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```

#### 4. Energy Balance
- ✅ Solar + Grid Import ≈ Load + Grid Export + Battery Change
- ✅ System losses are 5-20%
- ✅ Grid import occurs when solar + battery insufficient
- ✅ Grid export occurs when solar exceeds load + battery capacity

**SQL Query:**
```sql
SELECT
  site_id,
  SUM(solar_energy_kwh) as total_solar,
  SUM(CASE WHEN grid_power_kw > 0 THEN grid_energy_kwh ELSE 0 END) as total_grid_import,
  SUM(CASE WHEN grid_power_kw < 0 THEN grid_energy_kwh ELSE 0 END) as total_grid_export,
  SUM(load_energy_kwh) as total_load,
  -- Energy balance
  (SUM(solar_energy_kwh) + SUM(CASE WHEN grid_power_kw > 0 THEN grid_energy_kwh ELSE 0 END)) as input,
  (SUM(load_energy_kwh) + SUM(CASE WHEN grid_power_kw < 0 THEN grid_energy_kwh ELSE 0 END)) as output
FROM telemetry_readings
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY site_id;
```

#### 5. Aggregations
- ✅ Hourly totals match sum of 12 5-minute readings
- ✅ Daily totals match sum of 24 hourly readings
- ✅ No duplicate timestamps for same site

**SQL Query:**
```sql
-- Verify hourly aggregation
SELECT
  h.timestamp,
  h.total_solar_energy_kwh as hourly_solar,
  SUM(r.solar_energy_kwh) as readings_solar,
  h.reading_count
FROM telemetry_hourly h
JOIN telemetry_readings r
  ON r.site_id = h.site_id
  AND r.timestamp >= h.timestamp
  AND r.timestamp < h.timestamp + INTERVAL '1 hour'
WHERE h.site_id = 1
  AND h.timestamp::date = CURRENT_DATE - INTERVAL '1 day'
GROUP BY h.timestamp, h.total_solar_energy_kwh, h.reading_count
ORDER BY h.timestamp;
```

### Expected Data Ranges

| Metric                    | Residential | Commercial | Industrial |
|---------------------------|-------------|------------|------------|
| Solar Power (kW)          | 0-15        | 0-20       | 0-25       |
| Load Power (kW)           | 1-8         | 2-10       | 3-12       |
| Battery SOC (%)           | 20-95       | 20-95      | 20-95      |
| Battery Voltage (V)       | 480-520     | 480-520    | 480-520    |
| Battery Temperature (°C)  | 20-40       | 20-40      | 20-40      |
| Solar Efficiency (%)      | 70-95       | 70-95      | 70-95      |
| Grid Import (kW)          | 0-5         | 0-8        | 0-10       |

---

## Troubleshooting

### Common Issues

#### 1. "No active sites found"

**Cause:** Database is empty.

**Solution:**
```bash
# Run basic seeding first
pnpm db:seed

# Then run weather seeding
pnpm db:seed:weather
```

#### 2. "OpenMeteo API error: 429 Too Many Requests"

**Cause:** Rate limit exceeded (10,000 requests/day).

**Solution:**
- Weather data is cached in `/tmp/weather-cache-*.json`
- Delete cache files if data is stale
- Reduce `daysToGenerate` to fetch less data

#### 3. "Energy balance validation failed"

**Cause:** Physics calculation mismatch.

**Solution:**
- Check battery capacity is set correctly in sites table
- Verify solar capacity matches site specifications
- Expected losses are 5-20% (accounting for inefficiencies)

#### 4. Performance Issues

**Symptoms:** Seeding takes >5 minutes per site.

**Solutions:**
- Increase `batchSize` to 1000 (default: 500)
- Check database connection (use `DATABASE_URL` not `POSTGRES_URL_NO_SSL`)
- Ensure proper indexes on `telemetry_readings` table

#### 5. TypeScript Errors

**Common errors:**
```typescript
// Error: Type 'null' is not assignable to type 'number'
// Solution: Add null checks
const solarPower = site.solarCapacityKw || 0

// Error: Cannot find module '@/lib/weather'
// Solution: Check tsconfig.json path aliases
"paths": {
  "@/*": ["./*"]
}
```

---

## Advanced Configuration

### Custom Site Types

Add new site types to `src/lib/load-simulator.ts`:

```typescript
const LOAD_PROFILES: Record<SiteType, LoadProfile> = {
  // ... existing profiles
  datacenter: {
    peakHours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    shoulderHours: [],
    offPeakHours: [],
    weekendFactor: 1.0,  // 24/7 operation
    temperatureSensitivity: 0.5,  // High cooling needs
  },
}
```

### Custom Weather Location

Change location in `src/lib/weather.ts`:

```typescript
const DEFAULT_LOCATION: WeatherLocation = {
  latitude: -33.9249,    // Cape Town
  longitude: 18.4241,
  timezone: 'Africa/Johannesburg'
}
```

### Custom Simulation Parameters

Modify battery behavior in `src/lib/battery-simulator.ts`:

```typescript
const DEFAULT_CONFIG = {
  minSoc: 0.10,             // Allow 10% minimum
  maxSoc: 1.00,             // Allow 100% maximum
  maxChargeRateC: 1.0,      // Faster charging
  maxDischargeRateC: 2.0,   // Faster discharging
  // ... other parameters
}
```

### Seeding Specific Date Range

```typescript
import { seedWeatherAwareData } from './src/db/seed-weather'
import { addMonths } from 'date-fns'

// Seed specific month
const endDate = new Date('2024-10-01')
const startDate = addMonths(endDate, -1)

await seedWeatherAwareData({
  daysToGenerate: 30,
  batchSize: 500,
  verbose: true
})
```

### Performance Tuning

**For faster seeding:**

```typescript
await seedWeatherAwareData({
  daysToGenerate: 7,     // Fewer days
  batchSize: 1000,       // Larger batches
  verbose: false         // Disable progress output
})
```

**For better data quality:**

```typescript
// Reduce noise in calculations
const noiseFactor = 1 + (Math.random() * 0.02 - 0.01)  // ±1% instead of ±5%
```

---

## Summary

The weather-aware seeding system provides:

1. **Realistic data** using real weather and physics-based models
2. **Complete integration** from solar to battery to load to grid
3. **Energy balance** with proper accounting for system losses
4. **High performance** with batch processing and caching
5. **Easy validation** with expected ranges and SQL queries
6. **Flexibility** with configurable options and extensible design

### Next Steps

1. ✅ Run `pnpm db:seed` to create sites
2. ✅ Run `pnpm db:seed:weather` to generate telemetry
3. ✅ Open `pnpm db:studio` to explore data
4. ✅ Validate energy balance using SQL queries
5. ✅ Build dashboard visualizations using real data

---

## References

- [OpenMeteo API Documentation](https://open-meteo.com/en/docs/historical-weather-api)
- [Solar Irradiance Calculations](https://en.wikipedia.org/wiki/Solar_irradiance)
- [Li-ion Battery Characteristics](https://en.wikipedia.org/wiki/Lithium-ion_battery)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Next.js 16 Documentation](https://nextjs.org/docs)

---

**Last Updated:** 2025-10-29
**Version:** 1.0.0
**Maintainer:** Adi (Fullstack Engineer)
