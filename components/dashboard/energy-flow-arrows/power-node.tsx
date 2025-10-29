'use client'

import { PowerNodeProps } from './types'
import { NODE_CONFIG, NODE_RADIUS, SMALL_NODE_RADIUS } from './constants'
import { formatPower } from './utils/format-power'
import { cn } from '@/lib/utils'

export function PowerNode({ type, powerKw, label, position, state, chargeLevel }: PowerNodeProps) {
  const config = NODE_CONFIG[type]
  const Icon = config.icon

  // All nodes use the same small size
  const nodeRadius = SMALL_NODE_RADIUS
  const iconSize = 'h-4 w-4'
  const iconBoxSize = 24
  const iconBoxOffset = -12

  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      {/* Node circle with shadow */}
      <circle
        cx="0"
        cy="0"
        r={nodeRadius + 4}
        fill="white"
        opacity="0.3"
        filter="url(#node-shadow)"
      />
      <circle
        cx="0"
        cy="0"
        r={nodeRadius}
        fill={config.bgGradient}
        className="transition-all duration-300"
      />

      {/* Icon */}
      <foreignObject x={iconBoxOffset} y={iconBoxOffset} width={iconBoxSize} height={iconBoxSize}>
        <div className="flex items-center justify-center w-full h-full">
          <Icon className={cn(iconSize, config.iconColor, 'animate-icon-glow')} />
        </div>
      </foreignObject>

      {/* Label */}
      <text
        y={nodeRadius + 20}
        textAnchor="middle"
        className="fill-foreground text-sm font-medium"
      >
        {label}
      </text>

      {/* Power value */}
      <text
        y={nodeRadius + 36}
        textAnchor="middle"
        className="fill-foreground text-base font-semibold"
      >
        {formatPower(powerKw)}
      </text>

      {/* State label (if provided) */}
      {state && (
        <text
          y={nodeRadius + 52}
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
        >
          {state}
        </text>
      )}

      {/* Battery charge level indicator */}
      {type === 'battery' && chargeLevel !== undefined && (
        <text
          y={-nodeRadius - 10}
          textAnchor="middle"
          className="fill-foreground text-xs font-semibold"
        >
          {Math.round(chargeLevel)}%
        </text>
      )}
    </g>
  )
}
