export type NodeType = 'solar' | 'battery' | 'grid' | 'load'

export type FlowType =
  | 'solar-to-battery'
  | 'solar-to-load'
  | 'solar-to-grid'
  | 'battery-to-load'
  | 'grid-to-battery'
  | 'grid-to-load'

export interface Position {
  x: number
  y: number
}

export interface NodePosition {
  type: NodeType
  position: Position
  label: string
}

export interface ActiveFlow {
  from: NodeType
  to: NodeType
  powerKw: number
  color: string
  flowType: FlowType
}

export interface TelemetryData {
  solarPowerKw: number
  batteryPowerKw: number
  gridImportKw: number
  gridExportKw: number
  loadPowerKw: number
  batteryChargeLevel: number
}

export interface EnergyFlowDiagramProps {
  telemetry: TelemetryData
  className?: string
  compact?: boolean
}

export interface PowerNodeProps {
  type: NodeType
  powerKw: number
  label: string
  position: Position
  state?: string
  chargeLevel?: number
}

export interface FlowArrowProps {
  from: Position
  to: Position
  powerKw: number
  color: string
  flowType: FlowType
  animated?: boolean
}

export interface ArrowLabelProps {
  powerKw: number
  midpoint: Position
}
