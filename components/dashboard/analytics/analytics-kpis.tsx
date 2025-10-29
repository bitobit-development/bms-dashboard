'use client'

import { Sun, Zap, TrendingUp, Battery, Target, Activity, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type KPIData = {
  totalGenerated: number
  totalConsumed: number
  peakDemand: number
  avgBatteryCycles: number
  solarCapacityFactor: number
  gridIndependence: number
  systemEfficiency: number
  energySavings: number
  generationTrend?: number
  consumptionTrend?: number
  independenceTrend?: number
  savingsTrend?: number
}

type AnalyticsKPIsProps = {
  kpis: KPIData | null
  isLoading: boolean
}

type KPICardData = {
  title: string
  value: string
  trend?: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

export function AnalyticsKPIs({ kpis, isLoading }: AnalyticsKPIsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>
    )
  }

  const cards: KPICardData[] = [
    {
      title: 'Total Energy Generated',
      value: `${kpis.totalGenerated.toFixed(1)} kWh`,
      trend: kpis.generationTrend,
      icon: Sun,
      iconColor: 'text-yellow-500',
      iconBg: 'bg-yellow-500/10',
    },
    {
      title: 'Total Energy Consumed',
      value: `${kpis.totalConsumed.toFixed(1)} kWh`,
      trend: kpis.consumptionTrend,
      icon: Zap,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
    {
      title: 'Peak Power Demand',
      value: `${kpis.peakDemand.toFixed(1)} kW`,
      icon: TrendingUp,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/10',
    },
    {
      title: 'Avg Battery Cycles',
      value: kpis.avgBatteryCycles.toFixed(0),
      icon: Battery,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
    },
    {
      title: 'Solar Capacity Factor',
      value: `${(kpis.solarCapacityFactor * 100).toFixed(1)}%`,
      icon: Sun,
      iconColor: 'text-yellow-500',
      iconBg: 'bg-yellow-500/10',
    },
    {
      title: 'Grid Independence',
      value: `${(kpis.gridIndependence * 100).toFixed(1)}%`,
      trend: kpis.independenceTrend,
      icon: Target,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-500/10',
    },
    {
      title: 'System Efficiency',
      value: `${(kpis.systemEfficiency * 100).toFixed(1)}%`,
      icon: Activity,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
    },
    {
      title: 'Energy Savings',
      value: `R ${kpis.energySavings.toFixed(2)}`,
      trend: kpis.savingsTrend,
      icon: TrendingDown,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        const hasTrend = card.trend !== undefined && card.trend !== 0
        const isPositiveTrend = hasTrend && card.trend! > 0

        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={cn('p-2 rounded-lg', card.iconBg)}>
                <Icon className={cn('h-5 w-5', card.iconColor)} />
              </div>
              {hasTrend && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    isPositiveTrend ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  <span>{isPositiveTrend ? '+' : ''}{card.trend!.toFixed(1)}%</span>
                  <TrendingUp
                    className={cn(
                      'h-3 w-3',
                      !isPositiveTrend && 'rotate-180'
                    )}
                  />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
