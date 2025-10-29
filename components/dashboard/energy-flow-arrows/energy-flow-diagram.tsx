'use client'

import { EnergyFlowDiagramProps } from './types'
import { PowerNode } from './power-node'
import { FlowArrow } from './flow-arrow'
import { ArrowMarkerDefs } from './arrow-marker-defs'
import { NodeGradientDefs } from './node-gradient-defs'
import { NODE_POSITIONS, VIEWBOX_WIDTH, VIEWBOX_HEIGHT, NODE_CONFIG } from './constants'
import { calculateActiveFlows } from './utils/calculate-flows'
import { cn } from '@/lib/utils'

export function EnergyFlowDiagram({ telemetry, className, compact = false }: EnergyFlowDiagramProps) {
  const activeFlows = calculateActiveFlows(telemetry)

  // Determine battery state
  const getBatteryState = () => {
    if (telemetry.batteryPowerKw < -0.1) return 'Charging'
    if (telemetry.batteryPowerKw > 0.1) return 'Discharging'
    return 'Standby'
  }

  // Determine grid state
  const getGridState = () => {
    const gridImport = telemetry.gridImportKw || 0
    const gridExport = telemetry.gridExportKw || 0
    if (gridImport > 0.1) return 'Import'
    if (gridExport > 0.1) return 'Export'
    return 'Idle'
  }

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Energy flow diagram showing power distribution"
      >
        {/* SVG definitions (gradients, arrow markers, filters) */}
        <NodeGradientDefs />
        <ArrowMarkerDefs />

        {/* Flow arrows (render behind nodes) */}
        <g className="flow-arrows">
          {activeFlows.map((flow, index) => {
            const fromPos = NODE_POSITIONS[flow.from]
            const toPos = NODE_POSITIONS[flow.to]

            return (
              <FlowArrow
                key={`${flow.from}-${flow.to}-${index}`}
                from={fromPos}
                to={toPos}
                powerKw={flow.powerKw}
                color={flow.color}
                flowType={flow.flowType}
                animated={!compact}
              />
            )
          })}
        </g>

        {/* Power nodes */}
        <g className="power-nodes">
          {/* Solar */}
          <PowerNode
            type="solar"
            powerKw={telemetry.solarPowerKw}
            label={NODE_CONFIG.solar.label}
            position={NODE_POSITIONS.solar}
          />

          {/* Battery */}
          <PowerNode
            type="battery"
            powerKw={Math.abs(telemetry.batteryPowerKw)}
            label={NODE_CONFIG.battery.label}
            position={NODE_POSITIONS.battery}
            state={getBatteryState()}
            chargeLevel={telemetry.batteryChargeLevel}
          />

          {/* Grid */}
          <PowerNode
            type="grid"
            powerKw={(telemetry.gridImportKw || 0) || (telemetry.gridExportKw || 0)}
            label={NODE_CONFIG.grid.label}
            position={NODE_POSITIONS.grid}
            state={getGridState()}
          />

          {/* Load */}
          <PowerNode
            type="load"
            powerKw={telemetry.loadPowerKw}
            label={NODE_CONFIG.load.label}
            position={NODE_POSITIONS.load}
          />
        </g>
      </svg>

      {/* Summary stats */}
      {!compact && (
        <div className="flex justify-between mt-6 px-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Generation: </span>
            <span className="font-semibold text-green-600">
              {telemetry.solarPowerKw.toFixed(1)} kW
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Consumption: </span>
            <span className="font-semibold text-red-600">
              {telemetry.loadPowerKw.toFixed(1)} kW
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
