'use client'

import { useState, useTransition } from 'react'
import { RefreshCw, MapPin, Thermometer, Droplets, Wind, Sun, Cloud, Sunrise, Sunset } from 'lucide-react'
import { format } from 'date-fns'
import { refreshAllWeather, refreshSiteWeather } from '@/app/actions/weather'
import { getBatteryTemperatureImpact, getWeatherEmoji } from '@/lib/weather-service'
import type { Site } from '@/src/db/schema'
import type { Weather } from '@/src/db/schema'

type SiteWithWeather = Site & {
  weather: Weather | null
}

type WeatherDashboardProps = {
  sites: SiteWithWeather[]
}

export const WeatherDashboard = ({ sites }: WeatherDashboardProps) => {
  const [isPending, startTransition] = useTransition()
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const handleRefreshAll = () => {
    startTransition(async () => {
      const result = await refreshAllWeather()
      if (result.success) {
        setLastRefresh(new Date())
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {sites.length} sites monitored
          {lastRefresh && (
            <span className="ml-2">
              • Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={isPending}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          Refresh All
        </button>
      </div>

      {/* Weather Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <WeatherCard key={site.id} site={site} />
        ))}
      </div>

      {/* No Data Message */}
      {sites.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No sites found. Run the Harry Gwala seeding script to add sites.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Command: <code className="rounded bg-muted px-2 py-1">pnpm tsx src/scripts/seed-harry-gwala.ts</code>
          </p>
        </div>
      )}
    </div>
  )
}

const WeatherCard = ({ site }: { site: SiteWithWeather }) => {
  const [isPending, startTransition] = useTransition()
  const weather = site.weather

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshSiteWeather(site.id)
    })
  }

  const tempImpact = weather ? getBatteryTemperatureImpact(weather.temperature) : 'acceptable'
  const tempImpactColors = {
    optimal: 'text-green-600 dark:text-green-400',
    acceptable: 'text-yellow-600 dark:text-yellow-400',
    warning: 'text-red-600 dark:text-red-400',
  }
  const tempImpactBg = {
    optimal: 'bg-green-50 dark:bg-green-950',
    acceptable: 'bg-yellow-50 dark:bg-yellow-950',
    warning: 'bg-red-50 dark:bg-red-950',
  }

  const formatTime = (date: Date | null | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{site.name}</h3>
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{site.city}, {site.state}</span>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="rounded p-1 hover:bg-muted disabled:opacity-50"
          title="Refresh weather"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Weather Data */}
      {weather ? (
        <div className="space-y-4">
          {/* Temperature & Condition */}
          <div className={`rounded-lg p-4 ${tempImpactBg[tempImpact]}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">
                    {getWeatherEmoji(weather.condition)}
                  </span>
                  <span className={`text-4xl font-bold ${tempImpactColors[tempImpact]}`}>
                    {weather.temperature.toFixed(1)}°C
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium">{weather.condition}</p>
                {weather.description && (
                  <p className="text-xs text-muted-foreground">{weather.description}</p>
                )}
              </div>
              <div className="text-right text-sm">
                <div className="font-medium">
                  Feels {weather.feelsLike?.toFixed(1) ?? 'N/A'}°C
                </div>
                <div className={`mt-1 text-xs font-semibold ${tempImpactColors[tempImpact]}`}>
                  Battery: {tempImpact}
                </div>
              </div>
            </div>
          </div>

          {/* Weather Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Humidity */}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-xs text-muted-foreground">Humidity</div>
                <div className="font-semibold">{weather.humidity}%</div>
              </div>
            </div>

            {/* Wind Speed */}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
              <Wind className="h-4 w-4 text-cyan-500" />
              <div>
                <div className="text-xs text-muted-foreground">Wind</div>
                <div className="font-semibold">
                  {weather.windSpeed?.toFixed(1) ?? 'N/A'} m/s
                </div>
              </div>
            </div>

            {/* Cloud Cover */}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
              <Cloud className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-xs text-muted-foreground">Cloud Cover</div>
                <div className="font-semibold">{weather.cloudCover ?? 'N/A'}%</div>
              </div>
            </div>

            {/* UV Index */}
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
              <Sun className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-xs text-muted-foreground">UV Index</div>
                <div className="font-semibold">
                  {weather.uvIndex?.toFixed(1) ?? 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Solar Radiation (Important for BMS) */}
          {weather.solarRadiation !== null && (
            <div className="rounded-md bg-orange-50 p-3 dark:bg-orange-950">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-orange-500" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Solar Radiation</div>
                  <div className="font-semibold">
                    {weather.solarRadiation.toFixed(0)} W/m²
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sunrise/Sunset */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sunrise className="h-3 w-3" />
              <span>{formatTime(weather.sunrise)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Sunset className="h-3 w-3" />
              <span>{formatTime(weather.sunset)}</span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="border-t pt-2 text-xs text-muted-foreground">
            Updated: {format(new Date(weather.timestamp), 'PPpp')}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">No weather data available</p>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="mt-3 text-sm text-primary hover:underline disabled:opacity-50"
          >
            Fetch Weather
          </button>
        </div>
      )}
    </div>
  )
}
