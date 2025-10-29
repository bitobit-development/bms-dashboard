import { Battery, Sun, Zap, Activity, Calendar, Clock, Thermometer, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import type { Site, TelemetryReading } from '@/src/db/schema'

type SiteOverviewProps = {
  site: Site
  telemetry: TelemetryReading | null | undefined
}

const getTemperatureStatus = (temp: number | null | undefined) => {
  if (!temp) return { label: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted' }
  if (temp >= 15 && temp <= 25) return { label: 'Optimal', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' }
  if (temp > 25 && temp <= 35) return { label: 'Warning', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950' }
  return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' }
}

const formatValue = (value: number | null | undefined, suffix: string = '', decimals: number = 1) => {
  if (value === null || value === undefined) return 'N/A'
  return `${value.toFixed(decimals)}${suffix}`
}

export const SiteOverview = ({ site, telemetry }: SiteOverviewProps) => {
  const tempStatus = getTemperatureStatus(telemetry?.batteryTemperature)
  const chargeLevel = telemetry?.batteryChargeLevel ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Specifications Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Battery className="h-4 w-4" />
              <span>Battery Capacity</span>
            </div>
            <div className="text-2xl font-bold">
              {formatValue(site.batteryCapacityKwh, ' kWh', 0)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sun className="h-4 w-4" />
              <span>Solar Capacity</span>
            </div>
            <div className="text-2xl font-bold">
              {formatValue(site.solarCapacityKw, ' kW', 1)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>Nominal Voltage</span>
            </div>
            <div className="text-2xl font-bold">
              {formatValue(site.nominalVoltage, ' V', 0)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Daily Consumption</span>
            </div>
            <div className="text-2xl font-bold">
              {formatValue(site.dailyConsumptionKwh, ' kWh', 0)}
            </div>
          </div>
        </div>

        {/* Current Telemetry */}
        {telemetry ? (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Current Status</h3>

              {/* Battery Charge Level */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Battery Charge</span>
                  <span className="font-semibold">{chargeLevel.toFixed(1)}%</span>
                </div>
                <Progress value={chargeLevel} className="h-2" />
              </div>

              {/* Battery Temperature */}
              <div className={`rounded-lg p-3 ${tempStatus.bg} mb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className={`h-4 w-4 ${tempStatus.color}`} />
                    <span className="text-sm font-medium">Battery Temperature</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${tempStatus.color}`}>
                      {formatValue(telemetry.batteryTemperature, '°C')}
                    </span>
                    <Badge variant={tempStatus.label === 'Optimal' ? 'default' : tempStatus.label === 'Warning' ? 'secondary' : 'destructive'}>
                      {tempStatus.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">Battery Voltage</div>
                  <div className="text-lg font-semibold">{formatValue(telemetry.batteryVoltage, ' V')}</div>
                </div>

                <div className="rounded-lg border p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">Battery Current</div>
                  <div className="text-lg font-semibold">{formatValue(telemetry.batteryCurrent, ' A')}</div>
                </div>

                <div className="rounded-lg border p-3 space-y-1">
                  <div className="text-xs text-muted-foreground">Battery Power</div>
                  <div className="text-lg font-semibold flex items-center gap-1">
                    {formatValue(telemetry.batteryPowerKw, ' kW')}
                    {telemetry.batteryPowerKw !== null && telemetry.batteryPowerKw !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {telemetry.batteryPowerKw < 0 ? '(Charging)' : '(Discharging)'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-1 bg-yellow-50 dark:bg-yellow-950">
                  <div className="text-xs text-muted-foreground">Solar Power</div>
                  <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                    {formatValue(telemetry.solarPowerKw, ' kW')}
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-1 bg-blue-50 dark:bg-blue-950">
                  <div className="text-xs text-muted-foreground">Load Power</div>
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {formatValue(telemetry.loadPowerKw, ' kW')}
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-1 bg-purple-50 dark:bg-purple-950">
                  <div className="text-xs text-muted-foreground">Grid Power</div>
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    {formatValue(telemetry.gridPowerKw, ' kW')}
                    {telemetry.gridPowerKw !== null && telemetry.gridPowerKw !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {telemetry.gridPowerKw > 0 ? '(Import)' : '(Export)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t pt-4">
            <div className="rounded-lg bg-muted/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">No telemetry data available</p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Installed:{' '}
              {site.installedAt
                ? new Date(site.installedAt).toLocaleDateString()
                : 'Not specified'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Last Seen:{' '}
              {site.lastSeenAt
                ? formatDistanceToNow(new Date(site.lastSeenAt), { addSuffix: true })
                : 'Never'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
