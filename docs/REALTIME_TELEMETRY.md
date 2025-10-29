# Real-Time Telemetry Generator

The BMS Dashboard includes a **real-time telemetry generator** that continuously simulates battery operations, solar production, and load consumption using actual weather data. This background service generates new telemetry readings at configurable intervals (1 or 5 minutes) and maintains battery state across readings for realistic simulation.

## Overview

### What It Does

The telemetry generator:

- ✅ **Runs continuously** without exiting
- ✅ **Generates new readings** every 1 or 5 minutes
- ✅ **Maintains battery state** between readings (stateful simulation)
- ✅ **Uses real weather data** from OpenMeteo API
- ✅ **Simulates all active sites** in the database
- ✅ **Automatically inserts** data into PostgreSQL
- ✅ **Handles errors gracefully** and continues operation
- ✅ **Supports graceful shutdown** (Ctrl+C)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  TelemetryGenerator                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Weather    │  │   Battery    │  │   Solar      │    │
│  │   Service    │  │  Simulator   │  │ Calculator   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Load      │  │   Database   │  │   Console    │    │
│  │  Simulator   │  │   Writer     │  │   Logger     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  PostgreSQL   │
                    │ (Telemetry DB)│
                    └───────────────┘
```

## Getting Started

### Prerequisites

1. **Database seeded** with sites:
   ```bash
   pnpm db:seed
   ```

2. **Environment variables** configured in `.env.local`:
   ```env
   DATABASE_URL=postgresql://...
   ```

3. **Active sites** in the database (status = 'active')

### Quick Start

#### Option 1: Run Directly (Development)

```bash
# 5-minute interval (recommended for development)
pnpm telemetry:5min

# 1-minute interval (for faster testing)
pnpm telemetry:1min

# Custom interval
pnpm telemetry:run 5
```

**Console Output:**
```
🚀 Starting Real-Time Telemetry Generator
⏱️  Interval: 5 minute(s)
📍 Initializing sites...
   Found 3 active site(s)
   ✓ Residential Backup System (Battery SOC: 50.0%)
   ✓ Small Commercial Site (Battery SOC: 50.0%)
   ✓ Industrial Facility (Battery SOC: 50.0%)
✅ Initialized 3 site simulators

[14:00:00] 🔄 Generating telemetry...
   ✅ Residential Backup System: Solar 12.5kW, Battery 75%, Load 8.2kW
   ✅ Small Commercial Site: Solar 18.3kW, Battery 82%, Load 15.1kW
   ✅ Industrial Facility: Solar 25.7kW, Battery 68%, Load 22.3kW
   📊 Inserted 3 reading(s)

[14:05:00] 🔄 Generating telemetry...
   ✅ Residential Backup System: Solar 13.1kW, Battery 77%, Load 7.8kW
   ✅ Small Commercial Site: Solar 19.2kW, Battery 85%, Load 14.5kW
   ✅ Industrial Facility: Solar 26.4kW, Battery 71%, Load 21.8kW
   📊 Inserted 3 reading(s)
```

**To Stop:**
- Press `Ctrl+C` for graceful shutdown

#### Option 2: Run with PM2 (Production)

PM2 is a production-grade process manager that keeps the generator running continuously, restarts it on crashes, and provides monitoring.

**Install PM2 (if not installed):**
```bash
npm install -g pm2
```

**Start the service:**
```bash
pnpm telemetry:pm2:start
```

**Manage the service:**
```bash
# View status
pnpm telemetry:pm2:status

# View logs (live tail)
pnpm telemetry:pm2:logs

# Restart service
pnpm telemetry:pm2:restart

# Stop service
pnpm telemetry:pm2:stop
```

**PM2 Dashboard:**
```bash
pm2 monit
```

## How It Works

### 1. Initialization

On startup, the generator:

1. **Loads all active sites** from the database
2. **Creates battery simulators** for each site
3. **Restores battery state** from the last telemetry reading
4. **Caches weather data** to minimize API calls

### 2. Generation Loop

Every N minutes (1 or 5):

1. **Fetch weather data**:
   - Gets current/recent historical weather from OpenMeteo
   - Caches for 1 hour to reduce API calls
   - Falls back to cached data if API fails

2. **For each site**:
   - Calculate solar production (based on weather, time, sun angle)
   - Calculate load consumption (based on site type, time, temperature)
   - Simulate battery (maintains state across readings)
   - Calculate grid import/export
   - Generate inverter metrics
   - Create telemetry reading
   - Insert into database

3. **Log results** to console

### 3. Battery State Management

The generator maintains battery state across readings:

- **State of Charge (SOC)**: Gradually changes based on charge/discharge
- **Temperature**: Affected by ambient temperature and power flow
- **Voltage**: Follows non-linear SOC curve
- **Health**: Very slow degradation over time
- **Cycle Count**: Tracks total charge/discharge cycles

This creates realistic battery behavior where:
- Battery charges during solar surplus
- Battery discharges during solar deficit
- Grid imports when battery depleted
- Grid exports when battery full
- SOC gradually changes over time

### 4. Weather Integration

The generator uses real historical weather data:

- **Temperature**: Affects solar panel efficiency and load consumption (AC usage)
- **Solar Irradiance**: Directly drives solar production
- **Cloud Cover**: Reduces solar production beyond irradiance
- **Sunrise/Sunset**: Solar production only during daylight
- **Time of Day**: Affects sun angle and solar output

Weather data is interpolated for precise 5-minute intervals.

## Configuration

### Generator Configuration

Edit `/Users/haim/Projects/bms-dashboard/src/services/telemetry-generator.ts`:

```typescript
export interface GeneratorConfig {
  intervalMinutes: number    // 1 or 5
  sites?: number[]          // Specific site IDs (optional)
  verbose: boolean          // Console logging
}
```

### Site-Specific Settings

Each site has configurable parameters in the database:

```typescript
// sites table
{
  nominalVoltage: 500,           // Battery voltage (V)
  batteryCapacityKwh: 50,        // Battery capacity (kWh)
  solarCapacityKw: 30,           // Solar capacity (kW)
  dailyConsumptionKwh: 65,       // Expected daily load (kWh)
}
```

### Simulation Parameters

Default values can be adjusted in library files:

- **Battery**: `/Users/haim/Projects/bms-dashboard/src/lib/battery-simulator.ts`
  - Charge/discharge rates
  - Efficiency
  - Temperature model
  - Health degradation

- **Solar**: `/Users/haim/Projects/bms-dashboard/src/lib/solar-calculator.ts`
  - Panel efficiency
  - Temperature coefficient
  - Inverter efficiency
  - System losses

- **Load**: `/Users/haim/Projects/bms-dashboard/src/lib/load-simulator.ts`
  - Peak/off-peak patterns
  - Weekend factors
  - Temperature sensitivity

## Monitoring

### Console Logs

The generator provides detailed console output:

```
[14:05:00] 🔄 Generating telemetry...
   ✅ Site Name: Solar XkW, Battery Y%, Load ZkW
   ✅ Site Name: Solar XkW, Battery Y%, Load ZkW, Grid Import/Export
   📊 Inserted N reading(s)
```

### Database Monitoring

Watch telemetry data in real-time:

```bash
# Terminal 1: Run generator
pnpm telemetry:5min

# Terminal 2: Watch database
pnpm db:studio
```

Navigate to `telemetry_readings` table in Drizzle Studio to see new readings.

### PM2 Monitoring

```bash
# View process status
pm2 status

# View live logs
pm2 logs bms-telemetry-generator

# View dashboard
pm2 monit
```

### Log Files (PM2)

PM2 saves logs to:
- `./logs/telemetry-out.log` - Standard output
- `./logs/telemetry-err.log` - Error output

## Troubleshooting

### Generator Won't Start

**Error: "No active sites found"**

Solution:
```bash
# Seed the database
pnpm db:seed

# Or manually activate sites
# UPDATE sites SET status = 'active' WHERE id = 1;
```

**Error: "DATABASE_URL environment variable is not set"**

Solution:
```bash
# Ensure .env.local exists with DATABASE_URL
# Run with: pnpm telemetry:run (includes dotenv)
```

### Weather API Errors

**Error: "OpenMeteo API error: 429"**

- Rate limit exceeded
- Generator caches weather for 1 hour
- Wait a few minutes before restarting

**Error: "Failed to fetch weather data"**

- Network issue or API down
- Generator falls back to cached weather
- Check internet connection

### Database Errors

**Error: "Duplicate key violates unique constraint"**

- Telemetry reading already exists for site + timestamp
- This shouldn't happen with proper interval timing
- Check if another generator instance is running

**Error: "Connection timeout"**

- Database connection issue
- Check `DATABASE_URL` in `.env.local`
- Verify database is accessible

### Memory Issues

**PM2: "Max memory restart"**

- Generator restarted due to memory usage > 500MB
- Normal after long runtime (weather cache)
- Increase limit in `ecosystem.config.js`:
  ```javascript
  max_memory_restart: '1G'
  ```

## Performance Considerations

### API Calls

- **Weather API**: ~1 call per hour (cached)
- **Database**: 1 insert per site per interval
- **Network**: Minimal (only weather fetches)

### Resource Usage

- **CPU**: Low (~1-5% on modern hardware)
- **Memory**: ~50-200MB (depends on weather cache)
- **Disk**: Grows with telemetry data (plan for ~1GB/month per site)

### Scaling

For many sites (>100):

1. **Increase interval** to 5 minutes (reduces load)
2. **Batch database inserts** (modify generator)
3. **Separate generators** for different site groups
4. **Use connection pooling** (already configured)

## Production Deployment

### Recommended Setup

1. **Use PM2** for process management
2. **Run on separate server** or background container
3. **Monitor logs** with PM2 or log aggregation
4. **Set up alerts** for process failures
5. **Configure auto-restart** (PM2 handles this)

### Docker Deployment (Optional)

Create `Dockerfile.telemetry`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "telemetry:5min"]
```

Run:
```bash
docker build -f Dockerfile.telemetry -t bms-telemetry .
docker run -d --name bms-telemetry --env-file .env.local bms-telemetry
```

### Environment Variables

Production `.env` should include:

```env
# Database
DATABASE_URL=postgresql://...

# Node environment
NODE_ENV=production

# Optional: Specific sites to generate
# TELEMETRY_SITES=1,2,3

# Optional: Interval override
# TELEMETRY_INTERVAL=5
```

## API Reference

### TelemetryGenerator Class

```typescript
class TelemetryGenerator {
  constructor(config: GeneratorConfig)

  // Start generating data
  async start(): Promise<void>

  // Stop generating data
  async stop(): Promise<void>

  // Check if running
  isRunning(): boolean

  // Get current config
  getConfig(): GeneratorConfig
}
```

### GeneratorConfig Interface

```typescript
interface GeneratorConfig {
  intervalMinutes: number    // 1 or 5
  sites?: number[]          // Optional site IDs
  verbose: boolean          // Console logging
}
```

### Usage Example

```typescript
import { TelemetryGenerator } from './services/telemetry-generator'

const generator = new TelemetryGenerator({
  intervalMinutes: 5,
  sites: [1, 2, 3], // Optional: specific sites
  verbose: true
})

await generator.start()

// Later...
await generator.stop()
```

## Roadmap

Future enhancements:

- [ ] **Web UI control** - Start/stop via dashboard
- [ ] **Dynamic configuration** - Change interval without restart
- [ ] **Alert generation** - Create alerts based on thresholds
- [ ] **Aggregation updates** - Auto-update hourly/daily rollups
- [ ] **Multiple weather sources** - Fallback weather APIs
- [ ] **Historical replay** - Re-simulate past periods
- [ ] **Load profiles** - Custom load patterns per site
- [ ] **Grid events** - Simulate grid outages

## Support

For issues or questions:

1. Check this documentation
2. Review console logs for errors
3. Check PM2 logs: `pnpm telemetry:pm2:logs`
4. Verify database connectivity
5. Ensure sites are active in database

## License

Part of the BMS Dashboard project.
