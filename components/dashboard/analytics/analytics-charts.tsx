'use client'

import { format } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type DailyTrend = {
  date: string
  generated: number
  consumed: number
  gridImport: number
  gridExport: number
}

type HourlyTrend = {
  hour: string
  solarPower: number
  loadPower: number
  batteryPower: number
  gridPower: number
}

type BatteryPattern = {
  hour: number
  charged: number
  discharged: number
}

type EnergyDistribution = {
  name: string
  value: number
}

type AnalyticsChartsProps = {
  dailyTrends: DailyTrend[]
  hourlyTrends: HourlyTrend[]
  batteryPatterns: BatteryPattern[]
  energyDistribution: EnergyDistribution[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function AnalyticsCharts({
  dailyTrends,
  hourlyTrends,
  batteryPatterns,
  energyDistribution,
}: AnalyticsChartsProps) {
  if (!dailyTrends.length && !hourlyTrends.length && !batteryPatterns.length && !energyDistribution.length) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No data available</p>
          <p className="text-sm mt-2">Select a different date range or site to view analytics</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Energy Trends - Tabs for Daily/Hourly */}
      <Card className="p-6">
        <Tabs defaultValue="daily" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Energy Trends</h3>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="hourly">Hourly</TabsTrigger>
            </TabsList>
          </div>

          {/* Daily Trends */}
          <TabsContent value="daily" className="mt-0">
            {dailyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'PPP')}
                    formatter={(value: number) => [value.toFixed(2), '']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="generated"
                    stroke="#FFBB28"
                    name="Solar Generated"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="consumed"
                    stroke="#0088FE"
                    name="Energy Consumed"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="gridImport"
                    stroke="#FF8042"
                    name="Grid Import"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="gridExport"
                    stroke="#00C49F"
                    name="Grid Export"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                No daily data available
              </div>
            )}
          </TabsContent>

          {/* Hourly Trends */}
          <TabsContent value="hourly" className="mt-0">
            {hourlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={hourlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                  />
                  <YAxis label={{ value: 'kW', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'PPP HH:mm')}
                    formatter={(value: number) => [value.toFixed(2), '']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="solarPower"
                    stroke="#FFBB28"
                    name="Solar Power"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="loadPower"
                    stroke="#0088FE"
                    name="Load Power"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="batteryPower"
                    stroke="#00C49F"
                    name="Battery Power"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="gridPower"
                    stroke="#8884D8"
                    name="Grid Power"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                No hourly data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Battery Patterns and Energy Distribution */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Battery Charge/Discharge Patterns */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Battery Charge/Discharge Patterns</h3>
          {batteryPatterns.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={batteryPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => [value.toFixed(2), '']} />
                <Legend />
                <Bar dataKey="charged" fill="#00C49F" name="Charged" />
                <Bar dataKey="discharged" fill="#FF8042" name="Discharged" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No battery pattern data available
            </div>
          )}
        </Card>

        {/* Energy Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Energy Distribution</h3>
          {energyDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={energyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {energyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toFixed(2) + ' kWh', '']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No distribution data available
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
