'use client'

import { useState, useEffect } from 'react'
import { Download, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getPdfExportHistory,
  type PdfExportHistoryItem,
} from '@/app/actions/pdf-exports'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export function ExportHistory() {
  const [history, setHistory] = useState<PdfExportHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch export history
  const fetchHistory = async () => {
    try {
      const result = await getPdfExportHistory()
      if (result.success && result.data) {
        setHistory(result.data)
      } else {
        toast.error(result.error || 'Failed to load export history')
      }
    } catch (error) {
      console.error('Error fetching export history:', error)
      toast.error('Failed to load export history')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchHistory()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHistory()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleDownload = (url: string, dateRangeStart: Date) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `network-report-${format(dateRangeStart, 'yyyy-MM-dd')}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('PDF downloaded successfully')
  }

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '-'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getStatusBadge = (status: PdfExportHistoryItem['status']) => {
    const variants: Record<typeof status, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock; text: string }> = {
      pending: {
        variant: 'secondary',
        icon: Clock,
        text: 'Pending',
      },
      processing: {
        variant: 'default',
        icon: Loader2,
        text: 'Processing',
      },
      complete: {
        variant: 'outline',
        icon: CheckCircle,
        text: 'Complete',
      },
      failed: {
        variant: 'destructive',
        icon: XCircle,
        text: 'Failed',
      },
    }

    const config = variants[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon
          className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        {config.text}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export History</CardTitle>
        <CardDescription>
          Your recent PDF export history. Files are available for 7 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Download className="mx-auto h-12 w-12 opacity-50 mb-4" aria-hidden="true" />
            <p className="text-lg">No export history</p>
            <p className="text-sm mt-2">
              Generate your first PDF report to see it here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Date Created</TableHead>
                  <TableHead className="min-w-[150px]">Date Range</TableHead>
                  <TableHead className="min-w-[80px]">Sites</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[80px]">File Size</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.dateRangeStart), 'MMM dd')} -{' '}
                      {format(new Date(item.dateRangeEnd), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.totalSites}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{formatFileSize(item.fileSize)}</TableCell>
                    <TableCell>
                      {item.status === 'complete' && item.downloadUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(item.downloadUrl!, item.dateRangeStart)}
                          className="h-8"
                        >
                          <Download className="h-4 w-4 mr-1" aria-hidden="true" />
                          Download
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
