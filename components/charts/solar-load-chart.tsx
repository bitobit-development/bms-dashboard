'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'

interface SolarLoadChartProps {
  data: Array<{
    timestamp: Date
    avgSolarPowerKw: number | null
    avgLoadPowerKw: number | null
  }>
}

export function SolarLoadChart({ data }: SolarLoadChartProps) {
  const chartData = data.map((item) => ({
    timestamp: new Date(item.timestamp).getTime(),
    solar: item.avgSolarPowerKw,
    load: item.avgLoadPowerKw,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solar Generation vs Load</CardTitle>
        <CardDescription>Last 7 days hourly averages</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
              className="text-xs"
            />
            <YAxis
              tickFormatter={(value) => `${value} kW`}
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
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="text-xs text-muted-foreground">Solar:</span>
                        </div>
                        <span className="text-sm font-semibold text-yellow-600">
                          {data.solar?.toFixed(2)} kW
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-slate-600" />
                          <span className="text-xs text-muted-foreground">Load:</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-600">
                          {data.load?.toFixed(2)} kW
                        </span>
                      </div>
                      <div className="pt-2 border-t mt-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-muted-foreground">Net:</span>
                          <span className={`text-sm font-semibold ${(data.solar || 0) - (data.load || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {((data.solar || 0) - (data.load || 0)).toFixed(2)} kW
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                if (value === 'solar') return 'Solar Generation'
                if (value === 'load') return 'Load Consumption'
                return value
              }}
            />
            <Line
              type="monotone"
              dataKey="solar"
              stroke="#eab308"
              strokeWidth={2}
              dot={false}
              name="solar"
            />
            <Line
              type="monotone"
              dataKey="load"
              stroke="#475569"
              strokeWidth={2}
              dot={false}
              name="load"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
