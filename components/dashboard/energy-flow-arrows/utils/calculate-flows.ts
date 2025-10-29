import { ActiveFlow, TelemetryData } from '../types'
import { FLOW_COLORS, POWER_THRESHOLD } from '../constants'

/**
 * Calculate active energy flows based on telemetry data
 * @param telemetry Real-time power measurements
 * @returns Array of active flows with power values and colors
 */
export function calculateActiveFlows(telemetry: TelemetryData): ActiveFlow[] {
  const flows: ActiveFlow[] = []

  const {
    solarPowerKw = 0,
    batteryPowerKw = 0,
    gridImportKw = 0,
    gridExportKw = 0,
    loadPowerKw = 0,
  } = telemetry

  // Solar to Battery (charging from solar)
  if (solarPowerKw > POWER_THRESHOLD && batteryPowerKw < -POWER_THRESHOLD) {
    const chargePower = Math.min(solarPowerKw, Math.abs(batteryPowerKw))
    flows.push({
      from: 'solar',
      to: 'battery',
      powerKw: chargePower,
      color: FLOW_COLORS.batteryCharge,
      flowType: 'solar-to-battery',
    })
  }

  // Solar to Grid (exporting)
  if (solarPowerKw > POWER_THRESHOLD && gridExportKw > POWER_THRESHOLD) {
    flows.push({
      from: 'solar',
      to: 'grid',
      powerKw: gridExportKw,
      color: FLOW_COLORS.gridExport,
      flowType: 'solar-to-grid',
    })
  }

  // Solar to Load (direct consumption)
  if (solarPowerKw > POWER_THRESHOLD && loadPowerKw > POWER_THRESHOLD) {
    // Calculate solar power going directly to load
    const solarToCharging = batteryPowerKw < 0 ? Math.abs(batteryPowerKw) : 0
    const solarToGrid = gridExportKw > 0 ? gridExportKw : 0
    const solarToLoad = Math.max(0, solarPowerKw - solarToCharging - solarToGrid)

    if (solarToLoad > POWER_THRESHOLD) {
      flows.push({
        from: 'solar',
        to: 'load',
        powerKw: Math.min(solarToLoad, loadPowerKw),
        color: FLOW_COLORS.solarFlow,
        flowType: 'solar-to-load',
      })
    }
  }

  // Battery to Load (discharging)
  if (batteryPowerKw > POWER_THRESHOLD && loadPowerKw > POWER_THRESHOLD) {
    flows.push({
      from: 'battery',
      to: 'load',
      powerKw: Math.min(batteryPowerKw, loadPowerKw),
      color: FLOW_COLORS.batteryDischarge,
      flowType: 'battery-to-load',
    })
  }

  // Grid to Battery (charging from grid)
  if (gridImportKw > POWER_THRESHOLD && batteryPowerKw < -POWER_THRESHOLD) {
    const gridToCharging = Math.min(gridImportKw, Math.abs(batteryPowerKw))
    flows.push({
      from: 'grid',
      to: 'battery',
      powerKw: gridToCharging,
      color: FLOW_COLORS.gridImport,
      flowType: 'grid-to-battery',
    })
  }

  // Grid to Load (importing)
  if (gridImportKw > POWER_THRESHOLD && loadPowerKw > POWER_THRESHOLD) {
    flows.push({
      from: 'grid',
      to: 'load',
      powerKw: Math.min(gridImportKw, loadPowerKw),
      color: FLOW_COLORS.gridImport,
      flowType: 'grid-to-load',
    })
  }

  return flows
}
