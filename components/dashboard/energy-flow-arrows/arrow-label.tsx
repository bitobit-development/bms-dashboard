import { ArrowLabelProps } from './types'
import { formatPower } from './utils/format-power'

export function ArrowLabel({ powerKw, midpoint }: ArrowLabelProps) {
  return (
    <g transform={`translate(${midpoint.x}, ${midpoint.y})`}>
      {/* White background for better readability */}
      <rect
        x="-25"
        y="-10"
        width="50"
        height="20"
        rx="4"
        fill="white"
        opacity="0.9"
      />
      {/* Power value text */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-xs font-semibold"
      >
        {formatPower(powerKw)}
      </text>
    </g>
  )
}
