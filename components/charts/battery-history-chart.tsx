'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'

interface BatteryHistoryChartProps {
  data: Array<{
    timestamp: Date
    avgBatteryChargeLevel: number | null
    minBatteryChargeLevel: number | null
    maxBatteryChargeLevel: number | null
  }>
}

export function BatteryHistoryChart({ data }: BatteryHistoryChartProps) {
  const chartData = data.map((item) => ({
    timestamp: new Date(item.timestamp).getTime(),
    avg: item.avgBatteryChargeLevel,
    min: item.minBatteryChargeLevel,
    max: item.maxBatteryChargeLevel,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Battery Charge History</CardTitle>
        <CardDescription>Last 7 days hourly averages</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
              className="text-xs"
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              className="text-xs"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="text-sm font-medium mb-2">
                      {format(new Date(data.timestamp), 'MMM d, h:mm a')}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Average:</span>
                        <span className="text-sm font-semibold text-purple-600">
                          {data.avg?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Min:</span>
                        <span className="text-xs">{data.min?.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Max:</span>
                        <span className="text-xs">{data.max?.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="avg"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBattery)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
