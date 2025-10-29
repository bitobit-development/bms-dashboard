/**
 * SVG marker definitions for arrow heads
 * These are reusable across all flow arrows
 */
export function ArrowMarkerDefs() {
  return (
    <defs>
      {/* Drop shadow filter for nodes */}
      <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="0" dy="2" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Arrowhead marker - yellow (solar) */}
      <marker
        id="arrowhead-yellow"
        markerWidth="10"
        markerHeight="10"
        refX="8"
        refY="5"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#FBBF24" />
      </marker>

      {/* Arrowhead marker - purple (battery discharge) */}
      <marker
        id="arrowhead-purple"
        markerWidth="10"
        markerHeight="10"
        refX="8"
        refY="5"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#A855F7" />
      </marker>

      {/* Arrowhead marker - green (charging/export) */}
      <marker
        id="arrowhead-green"
        markerWidth="10"
        markerHeight="10"
        refX="8"
        refY="5"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#10B981" />
      </marker>

      {/* Arrowhead marker - orange (grid import) */}
      <marker
        id="arrowhead-orange"
        markerWidth="10"
        markerHeight="10"
        refX="8"
        refY="5"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#F97316" />
      </marker>
    </defs>
  )
}

/**
 * Get marker ID for a given color
 */
export function getMarkerIdForColor(color: string): string {
  const colorMap: Record<string, string> = {
    '#FBBF24': 'arrowhead-yellow',
    '#A855F7': 'arrowhead-purple',
    '#10B981': 'arrowhead-green',
    '#F97316': 'arrowhead-orange',
  }

  return colorMap[color] || 'arrowhead-yellow'
}
