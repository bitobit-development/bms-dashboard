import { getSitesWithWeather } from '@/app/actions/weather'
import { WeatherDashboard } from '@/components/dashboard/weather-dashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WeatherPage() {
  const result = await getSitesWithWeather()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weather Monitoring</h1>
        <p className="text-muted-foreground">
          Real-time weather data for all BMS sites in Harry Gwala District
        </p>
      </div>

      {result.success && result.data ? (
        <WeatherDashboard sites={result.data} />
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-lg text-destructive">{result.error || 'Failed to load weather data'}</p>
        </div>
      )}
    </div>
  )
}
