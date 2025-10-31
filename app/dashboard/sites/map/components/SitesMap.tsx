'use client'

import { useMemo, useState, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import type { MapSiteData } from '@/app/actions/sites-map'
import { calculateMapBounds, generateMarkerIcon } from '@/lib/map-utils'
import { SiteInfoWindow } from './SiteInfoWindow'

interface SitesMapProps {
  sites: MapSiteData[]
}

const DEFAULT_CENTER = {
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT) || -28.7282,
  lng: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG) || 24.7499,
}

const DEFAULT_ZOOM = Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM) || 6

function MapContent({ sites }: SitesMapProps) {
  const map = useMap()
  const [selectedSite, setSelectedSite] = useState<MapSiteData | null>(null)

  // Calculate bounds to fit all markers
  const bounds = useMemo(() => calculateMapBounds(sites), [sites])

  // Fit bounds when map loads and sites change
  useEffect(() => {
    if (map && bounds && sites.length > 1) {
      const googleBounds = new google.maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      )
      map.fitBounds(googleBounds, { top: 50, bottom: 50, left: 50, right: 50 })
    }
  }, [map, bounds, sites.length])

  return (
    <>
      {/* Render markers */}
      {sites.map((site) => (
        <AdvancedMarker
          key={site.id}
          position={{ lat: site.latitude, lng: site.longitude }}
          onClick={() => setSelectedSite(site)}
          title={site.name}
        >
          <img
            src={generateMarkerIcon(site.markerStatus, 40)}
            alt={`${site.name} - ${site.markerStatus}`}
            className="cursor-pointer hover:scale-110 transition-transform"
          />
        </AdvancedMarker>
      ))}

      {/* Info window for selected site */}
      {selectedSite && (
        <SiteInfoWindow
          site={selectedSite}
          onClose={() => setSelectedSite(null)}
        />
      )}
    </>
  )
}

export function SitesMap({ sites }: SitesMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">
          Google Maps API key not configured
        </p>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId="bms-sites-map"
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl
        fullscreenControl
        streetViewControl={false}
        zoomControl
      >
        <MapContent sites={sites} />
      </Map>
    </APIProvider>
  )
}
