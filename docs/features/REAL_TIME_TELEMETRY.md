# Real-Time Telemetry Generator Feature

## Quick Reference

### Start the Generator

```bash
# Development (5-minute interval)
pnpm telemetry:5min

# Fast testing (1-minute interval)
pnpm telemetry:1min

# Production (with PM2)
pnpm telemetry:pm2:start
```

### Check Status

```bash
# View latest telemetry readings
pnpm dotenv -e .env.local -- tsx src/scripts/check-telemetry.ts

# Watch database (Drizzle Studio)
pnpm db:studio

# PM2 status
pnpm telemetry:pm2:status

# PM2 logs
pnpm telemetry:pm2:logs
```

### Stop the Generator

```bash
# Direct run: Press Ctrl+C

# PM2:
pnpm telemetry:pm2:stop
```

## What It Does

The real-time telemetry generator simulates live BMS operations by:

1. **Fetching real weather data** from OpenMeteo API
2. **Calculating solar production** based on sun angle, irradiance, and temperature
3. **Simulating load consumption** based on time of day and site type
4. **Maintaining battery state** across readings for realistic charge/discharge
5. **Calculating grid import/export** automatically
6. **Generating inverter metrics** for complete system simulation
7. **Inserting telemetry readings** into PostgreSQL every 1 or 5 minutes

## Example Output

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
```

## Key Features

✅ **Continuous Operation** - Runs indefinitely until stopped
✅ **Stateful Simulation** - Battery state persists between readings
✅ **Real Weather Data** - Uses actual weather from OpenMeteo API
✅ **Multi-Site Support** - Generates data for all active sites
✅ **Error Recovery** - Continues on failures
✅ **Graceful Shutdown** - Handles Ctrl+C cleanly
✅ **Production Ready** - PM2 support for 24/7 operation

## Documentation

- **Full Documentation**: [`docs/REALTIME_TELEMETRY.md`](../REALTIME_TELEMETRY.md)
- **Implementation Summary**: [`docs/IMPLEMENTATION_SUMMARY.md`](../IMPLEMENTATION_SUMMARY.md)

## Quick Troubleshooting

**No active sites found**:
```bash
pnpm db:seed
```

**Database connection error**:
- Check `.env.local` has `DATABASE_URL`
- Verify database is running

**Weather API rate limit**:
- Generator caches weather for 1 hour
- Wait a few minutes before restarting

## Files

| File | Description |
|------|-------------|
| `src/services/telemetry-generator.ts` | Core generator service |
| `src/scripts/run-telemetry-generator.ts` | CLI runner |
| `src/scripts/check-telemetry.ts` | Database verification |
| `ecosystem.config.js` | PM2 configuration |

## Related Features

- **Historical Seeding**: `pnpm db:seed:weather` - Generate historical data
- **Weather Testing**: `pnpm weather:test` - Test weather API
- **Database Studio**: `pnpm db:studio` - View telemetry data
