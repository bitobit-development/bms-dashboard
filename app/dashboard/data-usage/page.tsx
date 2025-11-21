'use client'

import { useState, useEffect, useCallback } from 'react'
import { Network, Download, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  StatPanel,
  SiteOverviewCard,
  DateRangePicker,
  PdfExportModal,
  PdfProgressModal,
  ExportHistory,
} from '@/components/dashboard/data-usage'
import {
  getNetworkOverview,
  exportNetworkData,
  type SiteNetworkSummary,
  type DateRange,
} from '@/app/actions/network-usage'
import { startPdfExport } from '@/app/actions/pdf-exports'
import { toast } from 'sonner'

export default function DataUsagePage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2024, 4, 1), // May 2024
    end: new Date(2024, 10, 30), // Nov 2024
  })
  const [sites, setSites] = useState<SiteNetworkSummary[]>([])
  const [filteredSites, setFilteredSites] = useState<SiteNetworkSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [showPdfExport, setShowPdfExport] = useState(false)
  const [activePdfJob, setActivePdfJob] = useState<string | null>(null)

  // Fetch data when date range changes
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const result = await getNetworkOverview(dateRange)
    if (result.success) {
      setSites(result.data)
      setFilteredSites(result.data)
    } else {
      toast.error(result.error)
    }
    setIsLoading(false)
  }, [dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter sites based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSites(sites)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredSites(
        sites.filter((site) =>
          site.siteName.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, sites])

  // Calculate summary stats
  const totalSites = sites.length
  const avgSpeed =
    sites.length > 0
      ? sites.reduce((sum, s) => sum + (s.avgUploadSpeed + s.avgDownloadSpeed) / 2, 0) /
        sites.length
      : 0
  const totalData = sites.reduce((sum, s) => sum + s.totalDataConsumed, 0)
  const avgLatency =
    sites.length > 0
      ? sites.reduce((sum, s) => sum + s.avgLatency, 0) / sites.length
      : 0

  // Format total data
  const formatTotalData = (gb: number) => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`
    }
    return `${gb.toFixed(1)} GB`
  }

  // Handle CSV/JSON export
  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true)
    try {
      const result = await exportNetworkData({
        format,
        dateRange,
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

  // Handle PDF export
  const handleStartPdfExport = async (params: {
    dateRange: DateRange
    siteIds: number[] | null
  }) => {
    try {
      toast.info('Generating PDF report...')
      const result = await startPdfExport({
        dateRange: params.dateRange,
        siteIds: params.siteIds,
      })

      if (result.success && result.data) {
        setActivePdfJob(result.data.jobId)
        setShowPdfExport(false)
      } else {
        toast.error(result.error || 'Failed to start PDF export')
      }
    } catch (error) {
      console.error('Error starting PDF export:', error)
      toast.error('Failed to start PDF export')
    }
  }

  // Handle PDF completion
  const handlePdfComplete = (downloadUrl: string) => {
    // Modal handles download, we just need to close it after a delay
    setTimeout(() => {
      setActivePdfJob(null)
    }, 1000)
  }

  // Handle PDF modal close
  const handlePdfModalClose = () => {
    setActivePdfJob(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Usage Reports</h1>
          <p className="text-muted-foreground">
            Monitor network bandwidth and data consumption across all sites
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPdfExport(true)}
            disabled={sites.length === 0}
          >
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={isExporting || sites.length === 0}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={isExporting || sites.length === 0}
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

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatPanel
          title="Total Sites"
          value={isLoading ? '-' : totalSites}
          trend={undefined}
        />
        <StatPanel
          title="Avg Speed"
          value={isLoading ? '-' : avgSpeed.toFixed(1)}
          unit="Mbps"
          trend={undefined}
        />
        <StatPanel
          title="Total Data"
          value={isLoading ? '-' : formatTotalData(totalData)}
          trend={undefined}
        />
        <StatPanel
          title="Avg Latency"
          value={isLoading ? '-' : avgLatency.toFixed(0)}
          unit="ms"
          trend={undefined}
        />
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <Input
          type="search"
          placeholder="Search sites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          aria-label="Search sites"
        />
        <span className="text-sm text-muted-foreground">
          {filteredSites.length} of {sites.length} sites
        </span>
      </div>

      {/* Export History */}
      <ExportHistory />

      {/* Sites Grid */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3 w-24" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredSites.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Network className="mx-auto h-12 w-12 mb-4 opacity-50" aria-hidden="true" />
            <p className="text-lg">No sites found</p>
            <p className="text-sm mt-2">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'No data available for the selected date range'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSites.map((site) => (
            <SiteOverviewCard
              key={site.siteId}
              siteId={site.siteId}
              siteName={site.siteName}
              avgUploadSpeed={site.avgUploadSpeed}
              avgDownloadSpeed={site.avgDownloadSpeed}
              allocatedBandwidth={site.allocatedBandwidth}
              utilizationPct={site.utilizationPct}
              totalDataConsumed={site.totalDataConsumed}
              consumptionPct={site.consumptionPct}
              avgLatency={site.avgLatency}
              status={site.status}
            />
          ))}
        </div>
      )}

      {/* PDF Export Modal */}
      <PdfExportModal
        open={showPdfExport}
        onClose={() => setShowPdfExport(false)}
        sites={sites}
        defaultDateRange={dateRange}
        onExport={handleStartPdfExport}
      />

      {/* PDF Progress Modal */}
      <PdfProgressModal
        jobId={activePdfJob}
        onComplete={handlePdfComplete}
        onClose={handlePdfModalClose}
      />
    </div>
  )
}
