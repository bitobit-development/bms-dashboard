/**
 * CLI Script: Real-Time Telemetry Generator
 *
 * Runs the telemetry generator as a standalone process.
 *
 * Usage:
 *   pnpm telemetry:run [interval]
 *   pnpm telemetry:1min
 *   pnpm telemetry:5min
 *
 * Examples:
 *   pnpm telemetry:run 5     # 5-minute interval (default)
 *   pnpm telemetry:run 1     # 1-minute interval
 */

import { TelemetryGenerator } from '../services/telemetry-generator'

/**
 * Parses command line arguments
 */
const parseArgs = (): { intervalMinutes: number } => {
  const intervalArg = process.argv[2] || '5'
  const intervalMinutes = parseInt(intervalArg, 10)

  if (isNaN(intervalMinutes) || ![1, 5].includes(intervalMinutes)) {
    console.error('❌ Invalid interval. Must be 1 or 5 minutes.')
    console.log('\nUsage:')
    console.log('  pnpm telemetry:run [interval]')
    console.log('\nExamples:')
    console.log('  pnpm telemetry:run 5    # Generate every 5 minutes (default)')
    console.log('  pnpm telemetry:run 1    # Generate every 1 minute')
    console.log('  pnpm telemetry:1min     # Shortcut for 1-minute interval')
    console.log('  pnpm telemetry:5min     # Shortcut for 5-minute interval')
    process.exit(1)
  }

  return { intervalMinutes }
}

/**
 * Main entry point
 */
const main = async (): Promise<void> => {
  const { intervalMinutes } = parseArgs()

  // Create generator
  const generator = new TelemetryGenerator({
    intervalMinutes,
    verbose: true,
  })

  // Handle graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n\n📡 Received ${signal}, shutting down gracefully...`)
    await generator.stop()
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('\n❌ Uncaught exception:', error)
    generator.stop().then(() => process.exit(1))
  })

  process.on('unhandledRejection', (reason) => {
    console.error('\n❌ Unhandled rejection:', reason)
    generator.stop().then(() => process.exit(1))
  })

  // Start generator
  try {
    await generator.start()
  } catch (error) {
    console.error('\n❌ Failed to start generator:', error)
    process.exit(1)
  }
}

// Run
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
