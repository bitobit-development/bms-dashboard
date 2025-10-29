'use client'

import { useCallback } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { FileText, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeData } from '@/hooks/use-realtime-data'
import {
  getRecentReports,
  deleteReport,
  downloadReport,
} from '@/app/actions/reports-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Report {
  id: string
  name: string
  type: string
  format: string
  siteId: string
  siteName: string | null
  createdAt: Date
  size: string
}

const formatColors: Record<string, string> = {
  pdf: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  csv: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  excel: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  json: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
}

export function RecentReports() {
  const fetchReports = useCallback(async () => {
    const result = await getRecentReports()
    return result
  }, [])

  const { data, isLoading, refresh } = useRealtimeData<{
    success: boolean
    reports: Report[]
    error?: string
  }>(fetchReports, 60000) // 60-second refresh

  const handleDownload = async (reportId: string, reportName: string) => {
    const result = await downloadReport(reportId)
    if (result.success && result.downloadUrl) {
      window.open(result.downloadUrl, '_blank')
      toast.success(`Download started: ${reportName}`)
    } else {
      toast.error('Failed to download report')
    }
  }

  const handleDelete = async (reportId: string, reportName: string) => {
    if (!confirm(`Delete report "${reportName}"?`)) return

    const result = await deleteReport(reportId)
    if (result.success) {
      toast.success('Report deleted successfully')
      refresh()
    } else {
      toast.error('Failed to delete report')
    }
  }

  const reports = data?.reports || []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-64" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!reports.length) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="rounded-full bg-muted p-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-medium">No reports yet</p>
            <p className="text-sm text-muted-foreground">
              Generate your first report to see it here
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="p-4 hover:bg-accent/50 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className="shrink-0 rounded-md bg-primary/10 p-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>

              {/* Report Info */}
              <div className="space-y-2 flex-1 min-w-0">
                <div>
                  <h3 className="font-medium leading-tight truncate">
                    {report.name}
                  </h3>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={formatColors[report.format] || 'bg-gray-100 text-gray-800 border-gray-200'}
                  >
                    {report.format.toUpperCase()}
                  </Badge>
                  {report.siteName && (
                    <Badge variant="outline">
                      {report.siteName}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {report.size}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}
                  </span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleDownload(report.id, report.name)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleDelete(report.id, report.name)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
