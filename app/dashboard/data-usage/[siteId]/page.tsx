'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Activity, Gauge, Clock, Database } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  StatPanel,
  DateRangePicker,
  SpeedChart,
  LatencyChart,
  ConsumptionChart,
} from '@/components/dashboard/data-usage'
import {
  getSiteNetworkMetrics,
  exportNetworkData,
  type SiteNetworkDetail,
  type DateRange,
} from '@/app/actions/network-usage'
import { toast } from 'sonner'

export default function SiteDataUsagePage() {
  const params = useParams()
  const router = useRouter()
  const siteId = Number(params.siteId)

  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2024, 4, 1), // May 2024
    end: new Date(2024, 10, 30), // Nov 2024
  })
  const [siteData, setSiteData] = useState<SiteNetworkDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch data when date range changes
  const fetchData = useCallback(async () => {
    if (!siteId || isNaN(siteId)) return

    setIsLoading(true)
    const result = await getSiteNetworkMetrics(siteId, dateRange)
    if (result.success) {
      setSiteData(result.data)
    } else {
      toast.error(result.error)
    }
    setIsLoading(false)
  }, [siteId, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle export
  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true)
    try {
      const result = await exportNetworkData({
        format,
        dateRange,
        siteIds: [siteId],
      })
      if (result.success) {
        // Create and download file
        const blob = new Blob([result.data], { type: result.mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success(`Exported as ${result.filename}`)
      } else {
        toast.error(result.error)
      }
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return <SiteDetailSkeleton />
  }

  if (!siteData) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Site not found</p>
          </div>
        </Card>
      </div>
    )
  }

  const { site, summary, speedData, latencyData, consumptionData } = siteData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2 -ml-3"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Overview
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
          <p className="text-muted-foreground">
            Allocated Bandwidth: {site.allocatedBandwidth} Mbps
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            JSON
          </Button>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card className="p-4">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </Card>

      {/* Summary Stats - Speed */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Gauge className="h-5 w-5 text-blue-500" aria-hidden="true" />
          Speed Metrics
        </h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <StatPanel
            title="Avg Upload"
            value={summary.avgUploadSpeed.toFixed(1)}
            unit="Mbps"
            variant="compact"
          />
          <StatPanel
            title="Avg Download"
            value={summary.avgDownloadSpeed.toFixed(1)}
            unit="Mbps"
            variant="compact"
          />
          <StatPanel
            title="Peak Upload"
            value={summary.peakUploadSpeed.toFixed(1)}
            unit="Mbps"
            variant="compact"
          />
          <StatPanel
            title="Peak Download"
            value={summary.peakDownloadSpeed.toFixed(1)}
            unit="Mbps"
            variant="compact"
          />
        </div>
      </div>

      {/* Summary Stats - Latency */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-500" aria-hidden="true" />
          Latency Metrics
        </h2>
        <div className="grid gap-4 grid-cols-3 sm:grid-cols-3">
          <StatPanel
            title="Average"
            value={summary.avgLatency.toFixed(0)}
            unit="ms"
            variant="compact"
          />
          <StatPanel
            title="Minimum"
            value={summary.minLatency.toFixed(0)}
            unit="ms"
            variant="compact"
          />
          <StatPanel
            title="Maximum"
            value={summary.maxLatency.toFixed(0)}
            unit="ms"
            variant="compact"
          />
        </div>
      </div>

      {/* Summary Stats - Data */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-green-500" aria-hidden="true" />
          Data Consumption
        </h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          <StatPanel
            title="Total Consumed"
            value={summary.totalDataConsumed.toFixed(1)}
            unit="GB"
            variant="compact"
          />
          <StatPanel
            title="Utilization"
            value={summary.utilizationPct.toFixed(0)}
            unit="%"
            variant="compact"
          />
          <StatPanel
            title="Of Allowance"
            value={summary.consumptionPct.toFixed(0)}
            unit="%"
            variant="compact"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <SpeedChart data={speedData} />
        <LatencyChart data={latencyData} />
        <ConsumptionChart data={consumptionData} />
      </div>
    </div>
  )
}

function SiteDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[250px]" />
          <Skeleton className="h-5 w-[200px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[80px]" />
          <Skeleton className="h-9 w-[80px]" />
        </div>
      </div>

      {/* Date Range Picker Skeleton */}
      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Skeleton className="h-9 w-[160px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[130px]" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-9 w-[130px]" />
          </div>
        </div>
      </Card>

      {/* Stats Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </Card>
      ))}
    </div>
  )
}
