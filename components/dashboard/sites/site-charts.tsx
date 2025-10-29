'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, startOfDay, endOfDay, subDays, subHours } from 'date-fns'
import type { TelemetryReading } from '@/src/db/schema'

type SiteChartsProps = {
  siteId: number
  historicalData: TelemetryReading[]
}

type TimeRange = '7days' | '24hours'

type ChartDataPoint = {
  time: string
  timestamp: Date
  solar: number
  load: number
  battery: number
  grid: number
}

const aggregateDataByHour = (data: TelemetryReading[]): ChartDataPoint[] => {
  const hourlyMap = new Map<string, TelemetryReading[]>()

  // Group readings by hour
  data.forEach((reading) => {
    const hourKey = format(new Date(reading.timestamp), 'yyyy-MM-dd HH:00')
    if (!hourlyMap.has(hourKey)) {
      hourlyMap.set(hourKey, [])
    }
    hourlyMap.get(hourKey)!.push(reading)
  })

  // Calculate averages for each hour
  const aggregated: ChartDataPoint[] = []
  hourlyMap.forEach((readings, hourKey) => {
    const avgSolar = readings.reduce((sum, r) => sum + (r.solarPowerKw || 0), 0) / readings.length
    const avgLoad = readings.reduce((sum, r) => sum + (r.loadPowerKw || 0), 0) / readings.length
    const avgBattery = readings.reduce((sum, r) => sum + (r.batteryChargeLevel || 0), 0) / readings.length
    const avgGrid = readings.reduce((sum, r) => sum + (r.gridPowerKw || 0), 0) / readings.length

    aggregated.push({
      time: hourKey,
      timestamp: new Date(hourKey),
      solar: parseFloat(avgSolar.toFixed(2)),
      load: parseFloat(avgLoad.toFixed(2)),
      battery: parseFloat(avgBattery.toFixed(1)),
      grid: parseFloat(avgGrid.toFixed(2)),
    })
  })

  return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

const aggregateDataByDay = (data: TelemetryReading[]): ChartDataPoint[] => {
  const dailyMap = new Map<string, TelemetryReading[]>()

  // Group readings by day
  data.forEach((reading) => {
    const dayKey = format(new Date(reading.timestamp), 'yyyy-MM-dd')
    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, [])
    }
    dailyMap.get(dayKey)!.push(reading)
  })

  // Calculate averages for each day
  const aggregated: ChartDataPoint[] = []
  dailyMap.forEach((readings, dayKey) => {
    const avgSolar = readings.reduce((sum, r) => sum + (r.solarPowerKw || 0), 0) / readings.length
    const avgLoad = readings.reduce((sum, r) => sum + (r.loadPowerKw || 0), 0) / readings.length
    const avgBattery = readings.reduce((sum, r) => sum + (r.batteryChargeLevel || 0), 0) / readings.length
    const avgGrid = readings.reduce((sum, r) => sum + (r.gridPowerKw || 0), 0) / readings.length

    aggregated.push({
      time: dayKey,
      timestamp: new Date(dayKey),
      solar: parseFloat(avgSolar.toFixed(2)),
      load: parseFloat(avgLoad.toFixed(2)),
      battery: parseFloat(avgBattery.toFixed(1)),
      grid: parseFloat(avgGrid.toFixed(2)),
    })
  })

  return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export const SiteCharts = ({ siteId, historicalData }: SiteChartsProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7days')

  // Filter and aggregate data based on time range
  const chartData = (() => {
    if (!historicalData || historicalData.length === 0) return []

    if (timeRange === '24hours') {
      const cutoff = subHours(new Date(), 24)
      const filtered = historicalData.filter(
        (reading) => new Date(reading.timestamp) >= cutoff
      )
      return aggregateDataByHour(filtered)
    } else {
      const cutoff = subDays(new Date(), 7)
      const filtered = historicalData.filter(
        (reading) => new Date(reading.timestamp) >= cutoff
      )
      return aggregateDataByDay(filtered)
    }
  })()

  const formatXAxis = (value: string) => {
    try {
      const date = new Date(value)
      if (timeRange === '24hours') {
        return format(date, 'HH:mm')
      } else {
        return format(date, 'MMM d')
      }
    } catch {
      return value
    }
  }

  const formatTooltipLabel = (value: string) => {
    try {
      const date = new Date(value)
      if (timeRange === '24hours') {
        return format(date, 'PPp')
      } else {
        return format(date, 'PPP')
      }
    } catch {
      return value
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Charts</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimeRange('24hours')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === '24hours'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === '7days'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              7 Days
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-8">
            {/* Power Chart (kW) */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Power Generation & Consumption</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={formatXAxis}
                    className="text-xs"
                  />
                  <YAxis
                    label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
                    className="text-xs"
                  />
                  <Tooltip
                    labelFormatter={formatTooltipLabel}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="solar"
                    stroke="#FBBF24"
                    strokeWidth={2}
                    name="Solar Generation"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="load"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Load Consumption"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="grid"
                    stroke="#A855F7"
                    strokeWidth={2}
                    name="Grid Power"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Battery Charge Level Chart (%) */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Battery Charge Level</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={formatXAxis}
                    className="text-xs"
                  />
                  <YAxis
                    domain={[0, 100]}
                    label={{ value: 'Charge Level (%)', angle: -90, position: 'insideLeft' }}
                    className="text-xs"
                  />
                  <Tooltip
                    labelFormatter={formatTooltipLabel}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="battery"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Battery Charge"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No historical data available for the selected time range
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
