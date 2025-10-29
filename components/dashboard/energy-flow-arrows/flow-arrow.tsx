'use client'

import { memo } from 'react'
import { FlowArrowProps } from './types'
import { calculateArrowPath, calculateCurveMidpoint } from './utils/calculate-path'
import { calculateStrokeWidth } from './utils/calculate-thickness'
import { getMarkerIdForColor } from './arrow-marker-defs'
import { ArrowLabel } from './arrow-label'

export const FlowArrow = memo(function FlowArrow({
  from,
  to,
  powerKw,
  color,
  flowType,
  animated = true,
}: FlowArrowProps) {
  const path = calculateArrowPath(from, to)
  const strokeWidth = calculateStrokeWidth(powerKw)
  const markerId = getMarkerIdForColor(color)
  const midpoint = calculateCurveMidpoint(from, to)

  return (
    <g className="flow-arrow-group">
      {/* Arrow path */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={animated ? '10 5' : undefined}
        markerEnd={`url(#${markerId})`}
        className="flow-arrow transition-all duration-500"
        style={{
          animation: animated ? 'flow 2s linear infinite' : undefined,
        }}
        aria-label={`Energy flowing from ${from} to ${to}: ${powerKw.toFixed(1)} kilowatts`}
        role="img"
      />

      {/* Power label */}
      <ArrowLabel powerKw={powerKw} midpoint={midpoint} />
    </g>
  )
},
(prevProps, nextProps) => {
  // Only re-render if power or color changes significantly
  return (
    Math.abs(prevProps.powerKw - nextProps.powerKw) < 0.1 &&
    prevProps.color === nextProps.color &&
    prevProps.from === nextProps.from &&
    prevProps.to === nextProps.to
  )
})
