'use client'

import { format } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'

// Grafana-inspired colors
const CHART_COLORS = {
  blue: '#5794f2',
  green: '#73bf69',
  gray: '#8e8e8e',
}

interface SpeedData {
  date: string
  upload: number
  download: number
  allocated: number
}

interface SpeedChartProps {
  data: SpeedData[]
  title?: string
  className?: string
}

export function SpeedChart({
  data,
  title = 'Network Speed Over Time',
  className,
}: SpeedChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No speed data available
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(new Date(value), 'MMM d')}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              label={{
                value: 'Mbps',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#9ca3af', fontSize: 12 },
              }}
              stroke="#9ca3af"
              fontSize={12}
            />
            <Tooltip
              labelFormatter={(value) => format(new Date(value), 'PPP')}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)} Mbps`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="upload"
              stroke={CHART_COLORS.blue}
              name="Upload"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="download"
              stroke={CHART_COLORS.green}
              name="Download"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="allocated"
              stroke={CHART_COLORS.gray}
              name="Allocated"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
