# Telemetry Data Ingestion API

## Overview

The Telemetry API accepts real-time BMS (Battery Management System) data from remote sites and stores it in the PostgreSQL database. The API supports batch inserts, validates data quality, and updates site status.

## Endpoints

### Health Check

**GET** `/api/telemetry`

Returns API status and version information.

**Response:**
```json
{
  "service": "Telemetry Ingestion API",
  "status": "operational",
  "version": "1.0.0",
  "endpoints": {
    "POST": "/api/telemetry - Ingest telemetry data"
  }
}
```

### Ingest Telemetry Data

**POST** `/api/telemetry`

Accepts telemetry readings from BMS sites.

**Request Body:**
```json
{
  "site_id": 1,
  "readings": [
    {
      "timestamp": "2025-10-29T12:00:00Z",
      "battery_voltage": 495.5,
      "battery_current": 12.3,
      "battery_charge_level": 85.5,
      "battery_temperature": 25.5,
      "battery_health": 98.0,
      "solar_power_kw": 15.2,
      "solar_voltage": 520.0,
      "solar_current": 29.2,
      "solar_efficiency": 92.5,
      "inverter_1_power_kw": 7.5,
      "inverter_1_status": "operational",
      "inverter_1_temperature": 35.2,
      "inverter_1_efficiency": 97.5,
      "inverter_2_power_kw": 7.7,
      "inverter_2_status": "operational",
      "inverter_2_temperature": 36.0,
      "inverter_2_efficiency": 97.8,
      "grid_status": "connected",
      "grid_frequency": 60.0,
      "grid_voltage": 240.0,
      "grid_import_kw": 0,
      "grid_export_kw": 5.2,
      "load_power_kw": 10.0,
      "system_status": "normal",
      "ambient_temperature": 22.0
    }
  ]
}
```

**Field Descriptions:**

| Field | Type | Required | Range | Description |
|-------|------|----------|-------|-------------|
| `site_id` | integer | Yes | > 0 | Site identifier from database |
| `readings` | array | Yes | 1-100 items | Array of telemetry readings |
| `timestamp` | string (ISO 8601) | Yes | - | Reading timestamp |
| `battery_voltage` | number | No | 0-1000 | Battery voltage in volts |
| `battery_current` | number | No | -500 to 500 | Battery current in amps |
| `battery_charge_level` | number | No | 0-100 | State of charge percentage |
| `battery_temperature` | number | No | -40 to 100 | Battery temperature in Celsius |
| `battery_health` | number | No | 0-100 | Battery health percentage |
| `solar_power_kw` | number | No | 0-1000 | Solar generation in kW |
| `inverter_1_power_kw` | number | No | 0-500 | Inverter 1 output in kW |
| `inverter_2_power_kw` | number | No | 0-500 | Inverter 2 output in kW |
| `grid_frequency` | number | No | 0-100 | Grid frequency in Hz |
| `grid_voltage` | number | No | 0-1000 | Grid voltage in volts |
| `grid_import_kw` | number | No | 0-1000 | Power imported from grid in kW |
| `grid_export_kw` | number | No | 0-1000 | Power exported to grid in kW |
| `load_power_kw` | number | No | 0-1000 | Site consumption in kW |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "inserted": 1,
    "site_id": 1,
    "site_updated": true
  }
}
```

**Error Responses:**

**400 Bad Request** - Validation error:
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "too_big",
      "maximum": 1000,
      "type": "number",
      "inclusive": true,
      "message": "Number must be less than or equal to 1000",
      "path": ["readings", 0, "battery_voltage"]
    }
  ]
}
```

**404 Not Found** - Site not found:
```json
{
  "success": false,
  "error": "Site not found",
  "details": {
    "site_id": 999
  }
}
```

**500 Internal Server Error** - Server error:
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Error message"
}
```

## Features

### Batch Insertion
Send up to 100 readings per request for efficient data ingestion:

```bash
curl -X POST http://localhost:3000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": 1,
    "readings": [
      {"timestamp": "2025-10-29T12:00:00Z", "battery_voltage": 495.5},
      {"timestamp": "2025-10-29T12:05:00Z", "battery_voltage": 496.0},
      {"timestamp": "2025-10-29T12:10:00Z", "battery_voltage": 496.5}
    ]
  }'
```

### Duplicate Handling
The API uses upsert logic to handle duplicate timestamps gracefully. If a reading with the same `site_id` and `timestamp` already exists, it will be skipped without error.

### Site Status Updates
Each successful ingestion automatically updates the site's `last_seen_at` timestamp, enabling monitoring of site connectivity.

### Data Quality Tracking
All ingested readings include metadata tracking:
- Data quality indicator
- Received timestamp
- Optional missing sensor flags

## Testing

### Using curl

**Health check:**
```bash
curl http://localhost:3000/api/telemetry
```

**Submit data:**
```bash
curl -X POST http://localhost:3000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": 1,
    "readings": [
      {
        "timestamp": "2025-10-29T12:00:00Z",
        "battery_voltage": 495.5,
        "battery_charge_level": 85.5,
        "solar_power_kw": 15.2,
        "load_power_kw": 10.0
      }
    ]
  }'
```

### Using JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/telemetry', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    site_id: 1,
    readings: [
      {
        timestamp: new Date().toISOString(),
        battery_voltage: 495.5,
        battery_charge_level: 85.5,
        solar_power_kw: 15.2,
        load_power_kw: 10.0,
      },
    ],
  }),
})

const result = await response.json()
console.log(result)
```

## Integration with BMS Sites

Remote BMS sites should:

1. Collect telemetry data at 5-minute intervals
2. Buffer readings locally if connection is unavailable
3. Submit batches of up to 100 readings per request
4. Handle 404 errors (site not configured in system)
5. Retry 5xx errors with exponential backoff
6. Log validation errors (400) for debugging

## Database Schema

Readings are stored in the `telemetry_readings` table with the following key fields:

- `id`: Auto-incrementing primary key
- `site_id`: Foreign key to sites table
- `timestamp`: Reading timestamp (indexed)
- Battery, solar, inverter, grid, and load metrics
- `metadata`: JSONB field for additional data

The table uses a unique constraint on `(site_id, timestamp)` to prevent duplicates.

## Performance Considerations

- Batch insertions are more efficient than individual requests
- The API can handle high-frequency data (5-minute intervals)
- Connection pooling is configured for optimal database performance
- Future: Table partitioning by month for long-term data retention

## Security Notes

**Current Implementation:**
- No authentication required (development only)
- Site validation ensures data goes to valid sites only

**Future Enhancements:**
- API key authentication per site
- Rate limiting per site/API key
- IP whitelisting for production sites
- Request signing for data integrity

## Monitoring

Monitor API health by:
- Checking GET `/api/telemetry` for uptime
- Tracking site `last_seen_at` timestamps
- Reviewing database insert rates
- Monitoring validation error rates

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md)
- [Seed Data Script](./SEED_DATA.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
