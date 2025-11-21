'use client'

import { format } from 'date-fns'
import {
  AreaChart,
  Area,
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
  primary: '#5794f2',
  primaryLight: 'rgba(87, 148, 242, 0.2)',
  min: '#73bf69',
  max: '#f2495c',
}

interface LatencyData {
  date: string
  avg: number
  min: number
  max: number
}

interface LatencyChartProps {
  data: LatencyData[]
  title?: string
  className?: string
}

export function LatencyChart({
  data,
  title = 'Network Latency',
  className,
}: LatencyChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No latency data available
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
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(new Date(value), 'MMM d')}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              label={{
                value: 'ms',
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
                `${value.toFixed(1)} ms`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="max"
              stroke={CHART_COLORS.max}
              fill="transparent"
              name="Max"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <Area
              type="monotone"
              dataKey="avg"
              stroke={CHART_COLORS.primary}
              fill="url(#colorAvg)"
              name="Average"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="min"
              stroke={CHART_COLORS.min}
              fill="transparent"
              name="Min"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
