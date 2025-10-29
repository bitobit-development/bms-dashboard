/**
 * SVG Gradient Definitions for Energy Flow Nodes
 * Creates vibrant gradient backgrounds for each node type
 */
export function NodeGradientDefs() {
  return (
    <defs>
      {/* Solar gradient: Yellow to Amber */}
      <linearGradient
        id="solar-gradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
        <stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
      </linearGradient>

      {/* Battery gradient: Purple to Indigo */}
      <linearGradient
        id="battery-gradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
        <stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
        <stop offset="100%" stopColor="#4F46E5" stopOpacity="1" />
      </linearGradient>

      {/* Grid gradient: Blue to Cyan */}
      <linearGradient
        id="grid-gradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
        <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
        <stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
      </linearGradient>

      {/* Load gradient: Orange to Red */}
      <linearGradient
        id="load-gradient"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
        <stop offset="0%" stopColor="#F97316" stopOpacity="1" />
        <stop offset="100%" stopColor="#DC2626" stopOpacity="1" />
      </linearGradient>

      {/* Node shadow filter */}
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
    </defs>
  )
}
