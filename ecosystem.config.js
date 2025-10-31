/**
 * PM2 Ecosystem Configuration
 *
 * Process manager configuration for running the telemetry generator
 * as a background service in production.
 *
 * Usage:
 *   pnpm telemetry:pm2:start    # Start the service
 *   pnpm telemetry:pm2:stop     # Stop the service
 *   pnpm telemetry:pm2:restart  # Restart the service
 *   pnpm telemetry:pm2:logs     # View logs
 *   pnpm telemetry:pm2:status   # Check status
 *
 * Direct PM2 commands:
 *   pm2 start ecosystem.config.js
 *   pm2 stop bms-telemetry-generator
 *   pm2 restart bms-telemetry-generator
 *   pm2 logs bms-telemetry-generator
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'bms-telemetry-generator',

      // Script to run (use dotenv-cli to load .env.local)
      script: './node_modules/.bin/dotenv',
      args: '-e .env.local -- tsx src/scripts/run-telemetry-generator.ts 5',

      // Interpreter mode
      interpreter: 'none',

      // Working directory
      cwd: './',

      // Environment variables
      env: {
        NODE_ENV: 'production',
      },

      // Log configuration
      error_file: './logs/telemetry-err.log',
      out_file: './logs/telemetry-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,

      // PM2 settings
      instances: 1, // Single instance only
      autorestart: true, // Auto-restart on crash
      watch: false, // Don't watch for file changes
      max_memory_restart: '500M', // Restart if memory exceeds 500MB

      // Restart policy
      exp_backoff_restart_delay: 100, // Exponential backoff on restart
      min_uptime: '10s', // Min uptime before considering stable
      max_restarts: 10, // Max restarts within min_uptime

      // Process management
      kill_timeout: 5000, // Time to wait before force kill (ms)
      listen_timeout: 3000, // Time to wait for listen event
      shutdown_with_message: true,

      // Advanced settings
      combine_logs: true, // Combine stdout and stderr
      merge_logs: true, // Merge logs from different instances
    },
  ],
}
