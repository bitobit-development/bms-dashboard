import { NodePosition, NodeType } from './types'
import { Sun, Battery, Zap, Home } from 'lucide-react'

// SVG ViewBox dimensions
export const VIEWBOX_WIDTH = 400
export const VIEWBOX_HEIGHT = 400

// Node positions in SVG coordinates
export const NODE_POSITIONS: Record<NodeType, { x: number; y: number }> = {
  solar: { x: 200, y: 80 },
  battery: { x: 100, y: 200 },
  grid: { x: 300, y: 200 },
  load: { x: 200, y: 320 },
}

// Node configuration
export const NODE_CONFIG: Record<
  NodeType,
  { label: string; icon: typeof Sun; bgGradient: string; iconColor: string }
> = {
  solar: {
    label: 'Solar',
    icon: Sun,
    bgGradient: 'url(#solar-gradient)',
    iconColor: 'text-white',
  },
  battery: {
    label: 'Battery',
    icon: Battery,
    bgGradient: 'url(#battery-gradient)',
    iconColor: 'text-white',
  },
  grid: {
    label: 'Grid',
    icon: Zap,
    bgGradient: 'url(#grid-gradient)',
    iconColor: 'text-white',
  },
  load: {
    label: 'Load',
    icon: Home,
    bgGradient: 'url(#load-gradient)',
    iconColor: 'text-white',
  },
}

// Flow colors
export const FLOW_COLORS = {
  solarFlow: '#FBBF24', // yellow-400
  batteryDischarge: '#A855F7', // purple-500
  batteryCharge: '#10B981', // green-500
  gridImport: '#F97316', // orange-500
  gridExport: '#10B981', // green-500
}

// Power threshold for showing flows (in kW)
export const POWER_THRESHOLD = 0.1

// Arrow stroke width range
export const MIN_STROKE_WIDTH = 2
export const MAX_STROKE_WIDTH = 8
export const POWER_RANGE_MAX = 10 // kW for max stroke width

// Node radius (Solar and Load use default, Battery and Grid are smaller)
export const NODE_RADIUS = 30
export const SMALL_NODE_RADIUS = 25
