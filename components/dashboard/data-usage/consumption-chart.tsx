'use client'

import { format } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card } from '@/components/ui/card'

// Grafana-inspired colors
const CHART_COLORS = {
  consumed: '#5794f2',
  allowance: '#73bf69',
  warning: '#fade2a',
  critical: '#f2495c',
}

interface ConsumptionData {
  date: string
  consumed: number
  allowance: number
}

interface ConsumptionChartProps {
  data: ConsumptionData[]
  title?: string
  className?: string
}

export function ConsumptionChart({
  data,
  title = 'Data Consumption',
  className,
}: ConsumptionChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No consumption data available
          </div>
        </div>
      </Card>
    )
  }

  // Calculate percentage for color coding
  const getConsumedColor = (consumed: number, allowance: number) => {
    const pct = allowance > 0 ? (consumed / allowance) * 100 : 0
    if (pct >= 90) return CHART_COLORS.critical
    if (pct >= 70) return CHART_COLORS.warning
    return CHART_COLORS.consumed
  }

  // Calculate total consumption and percentage
  const totalConsumed = data.reduce((sum, d) => sum + d.consumed, 0)
  const totalAllowance = data.reduce((sum, d) => sum + d.allowance, 0)
  const overallPct = totalAllowance > 0 ? (totalConsumed / totalAllowance) * 100 : 0

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium tabular-nums">{totalConsumed.toFixed(1)} GB</span>
            {' / '}
            <span className="tabular-nums">{totalAllowance.toFixed(1)} GB</span>
            {' '}
            <span className="text-xs">({overallPct.toFixed(0)}%)</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(new Date(value), 'MMM d')}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              label={{
                value: 'GB',
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
                `${value.toFixed(2)} GB`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Bar
              dataKey="consumed"
              name="Consumed"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getConsumedColor(entry.consumed, entry.allowance)}
                />
              ))}
            </Bar>
            <Bar
              dataKey="allowance"
              name="Allowance"
              fill={CHART_COLORS.allowance}
              radius={[4, 4, 0, 0]}
              opacity={0.3}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
