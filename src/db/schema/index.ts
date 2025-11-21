/**
 * Database Schema Index
 *
 * Exports all schema definitions for the BMS platform.
 */

// Organizations
export * from './organizations'

// Sites and Equipment
export * from './sites'

// Telemetry (Time-series data)
export * from './telemetry'

// Alerts and Events
export * from './alerts'

// Users and Access Control
export * from './users'
export * from './user-audit-log'

// Weather
export * from './weather'

// Network Telemetry (Data Usage Reports)
export * from './network-telemetry'

// PDF Export Jobs
export * from './pdf-exports'

/**
 * Schema Summary:
 *
 * 1. ORGANIZATIONS
 *    - organizations: Multi-tenant organization management
 *
 * 2. SITES & EQUIPMENT
 *    - sites: Physical locations with BMS equipment
 *    - equipment: Individual components (inverters, batteries, panels)
 *
 * 3. TELEMETRY (Time-series)
 *    - telemetry_readings: 5-minute interval readings (partitioned)
 *    - telemetry_hourly: Hourly aggregations
 *    - telemetry_daily: Daily aggregations
 *
 * 4. ALERTS & EVENTS
 *    - alerts: System alerts and notifications
 *    - events: Operational event log
 *    - maintenance_records: Equipment maintenance tracking
 *
 * 5. USERS
 *    - organization_users: User memberships and roles
 *    - user_activity_log: Audit trail
 *
 * 6. WEATHER
 *    - weather: Current weather data for sites
 *
 * 7. PDF EXPORTS
 *    - pdf_export_jobs: Asynchronous PDF generation tracking
 *
 * Total Tables: 12
 * Partitioned Tables: 1 (telemetry_readings)
 */
