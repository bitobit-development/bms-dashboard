export type EnergyFlowType =
  | 'solar-to-battery'
  | 'solar-to-load'
  | 'solar-to-grid'
  | 'battery-to-load'
  | 'grid-to-battery'
  | 'grid-to-load'

export interface EnergyFlow {
  type: EnergyFlowType
  power: number // kW
  isActive: boolean
}

export interface FlowPath {
  start: { x: number; y: number }
  end: { x: number; y: number }
  controlPoint?: { x: number; y: number }
}

export const FLOW_COLORS: Record<EnergyFlowType, string> = {
  'solar-to-battery': '#eab308', // yellow-500
  'solar-to-load': '#eab308', // yellow-500
  'solar-to-grid': '#22c55e', // green-500 (export)
  'battery-to-load': '#a855f7', // purple-500
  'grid-to-battery': '#f97316', // orange-500
  'grid-to-load': '#f97316', // orange-500
}

export const FLOW_PATHS: Record<EnergyFlowType, FlowPath> = {
  'solar-to-battery': {
    start: { x: 20, y: 15 },
    end: { x: 50, y: 50 },
    controlPoint: { x: 35, y: 30 },
  },
  'solar-to-load': {
    start: { x: 20, y: 15 },
    end: { x: 80, y: 50 },
    controlPoint: { x: 50, y: 25 },
  },
  'solar-to-grid': {
    start: { x: 20, y: 15 },
    end: { x: 80, y: 85 },
    controlPoint: { x: 50, y: 50 },
  },
  'battery-to-load': {
    start: { x: 50, y: 50 },
    end: { x: 80, y: 50 },
    controlPoint: { x: 65, y: 50 },
  },
  'grid-to-battery': {
    start: { x: 80, y: 85 },
    end: { x: 50, y: 50 },
    controlPoint: { x: 65, y: 67 },
  },
  'grid-to-load': {
    start: { x: 80, y: 85 },
    end: { x: 80, y: 50 },
    controlPoint: { x: 80, y: 67 },
  },
}
