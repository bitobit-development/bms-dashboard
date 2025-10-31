import type { MapSiteData } from '@/app/actions/sites-map'

/**
 * Status color mapping for markers
 */
export const STATUS_COLORS = {
  operational: {
    primary: '#10b981',    // green-500
    secondary: '#059669',  // green-600
    label: 'Operational',
    description: 'No active alerts',
  },
  warning: {
    primary: '#f59e0b',    // amber-500
    secondary: '#d97706',  // amber-600
    label: 'Warning',
    description: 'Has warning-level alerts',
  },
  critical: {
    primary: '#ef4444',    // red-500
    secondary: '#dc2626',  // red-600
    label: 'Critical',
    description: 'Has critical alerts or system errors',
  },
  offline: {
    primary: '#6b7280',    // gray-500
    secondary: '#4b5563',  // gray-600
    label: 'Offline',
    description: 'No telemetry data in last hour',
  },
} as const

export type MarkerStatus = keyof typeof STATUS_COLORS

/**
 * Generate SVG marker icon with status color
 */
export function generateMarkerIcon(
  status: MarkerStatus,
  size: number = 32
): string {
  const color = STATUS_COLORS[status].primary
  const borderColor = STATUS_COLORS[status].secondary

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="${color}"
        stroke="${borderColor}"
        stroke-width="1.5"
      />
      <circle cx="12" cy="9" r="2.5" fill="white" />
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Calculate map bounds to fit all sites
 */
export function calculateMapBounds(sites: MapSiteData[]): google.maps.LatLngBoundsLiteral | null {
  if (sites.length === 0) return null

  const latitudes = sites.map((s) => s.latitude)
  const longitudes = sites.map((s) => s.longitude)

  return {
    north: Math.max(...latitudes),
    south: Math.min(...latitudes),
    east: Math.max(...longitudes),
    west: Math.min(...longitudes),
  }
}

/**
 * Group sites by status for legend counts
 */
export function groupSitesByStatus(sites: MapSiteData[]) {
  return {
    operational: sites.filter((s) => s.markerStatus === 'operational').length,
    warning: sites.filter((s) => s.markerStatus === 'warning').length,
    critical: sites.filter((s) => s.markerStatus === 'critical').length,
    offline: sites.filter((s) => s.markerStatus === 'offline').length,
    total: sites.length,
  }
}
