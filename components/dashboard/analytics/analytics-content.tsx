'use client'

import { useState, useCallback, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { RefreshCw, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeData } from '@/hooks/use-realtime-data'
import { getAnalyticsData, getSitesForAnalytics } from '@/app/actions/analytics-actions'
import { AnalyticsKPIs } from './analytics-kpis'
import { AnalyticsCharts } from './analytics-charts'
import { AnalyticsDatePicker } from './analytics-date-picker'
import { AnalyticsSiteSelector } from './analytics-site-selector'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

type DateRange = {
  from: Date
  to: Date
}

type Site = {
  id: number
  name: string
}

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

type AnalyticsData = {
  success: boolean
  kpis: KPIData
  dailyTrends: DailyTrend[]
  hourlyTrends: HourlyTrend[]
  batteryPatterns: BatteryPattern[]
  energyDistribution: EnergyDistribution[]
  error?: string
}

export function AnalyticsContent() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  })
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [sites, setSites] = useState<Site[]>([])

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      const result = await getSitesForAnalytics()
      if (result.success) {
        setSites(result.sites)
      }
    }
    fetchSites()
  }, [])

  // Fetch analytics data with useRealtimeData
  const fetchAnalytics = useCallback(async () => {
    const result = await getAnalyticsData(dateRange, selectedSite)
    return result
  }, [dateRange, selectedSite])

  const { data, isLoading, error, lastUpdated, refresh } = useRealtimeData<AnalyticsData>(
    fetchAnalytics,
    120000 // 2-minute refresh interval
  )

  const handleRefresh = () => {
    refresh()
    toast.success('Analytics data refreshed')
  }

  const handleExport = () => {
    if (!data) {
      toast.error('No data to export')
      return
    }

    try {
      const exportData = {
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
        site: selectedSite,
        kpis: data.kpis,
        dailyTrends: data.dailyTrends,
        hourlyTrends: data.hourlyTrends,
        batteryPatterns: data.batteryPatterns,
        energyDistribution: data.energyDistribution,
        exportedAt: new Date().toISOString(),
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('Analytics data exported')
    } catch (err) {
      toast.error('Failed to export data')
    }
  }

  if (error) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load analytics data: {error.message}
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            {/* Date Range Picker */}
            <AnalyticsDatePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />

            {/* Site Selector */}
            <AnalyticsSiteSelector
              sites={sites}
              selectedSite={selectedSite}
              onSiteChange={setSelectedSite}
            />
          </div>

          {/* Last Updated and Actions */}
          <div className="flex items-center gap-2">
            {lastUpdated && !isLoading && (
              <span className="text-sm text-muted-foreground mr-2">
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!data || isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <AnalyticsKPIs kpis={data?.kpis || null} isLoading={isLoading} />

      {/* Charts */}
      {!isLoading && data && (
        <AnalyticsCharts
          dailyTrends={data.dailyTrends}
          hourlyTrends={data.hourlyTrends}
          batteryPatterns={data.batteryPatterns}
          energyDistribution={data.energyDistribution}
        />
      )}

      {/* Loading State for Charts */}
      {isLoading && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Loading analytics...</p>
          </div>
        </Card>
      )}
    </div>
  )
}
