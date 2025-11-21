'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { checkPdfProgress, cancelPdfExport } from '@/app/actions/pdf-exports'
import { toast } from 'sonner'

interface PdfProgressModalProps {
  jobId: string | null
  onComplete: (downloadUrl: string) => void
  onClose: () => void
}

export function PdfProgressModal({
  jobId,
  onComplete,
  onClose,
}: PdfProgressModalProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'complete' | 'failed'>('pending')
  const [progress, setProgress] = useState(0)
  const [processedSites, setProcessedSites] = useState(0)
  const [totalSites, setTotalSites] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Poll for job progress
  useEffect(() => {
    if (!jobId) return

    const pollInterval = setInterval(async () => {
      try {
        const result = await checkPdfProgress(jobId)

        if (result.success && result.data) {
          setStatus(result.data.status)
          setProgress(result.data.progress)
          setProcessedSites(result.data.processedSites)
          setTotalSites(result.data.totalSites)

          if (result.data.status === 'complete' && result.data.downloadUrl) {
            setDownloadUrl(result.data.downloadUrl)
            clearInterval(pollInterval)
            toast.success('PDF report ready for download')
            onComplete(result.data.downloadUrl)
          } else if (result.data.status === 'failed') {
            setError(result.data.error || 'PDF generation failed')
            clearInterval(pollInterval)
            toast.error('Failed to generate PDF report')
          }
        } else {
          setError(result.error || 'Failed to check progress')
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error('Error polling progress:', err)
        setError('Failed to check progress')
        clearInterval(pollInterval)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [jobId, onComplete])

  const handleCancel = async () => {
    if (!jobId || isCancelling) return

    setIsCancelling(true)
    try {
      const result = await cancelPdfExport(jobId)
      if (result.success) {
        toast.success('PDF export cancelled')
        onClose()
      } else {
        toast.error(result.error || 'Failed to cancel export')
      }
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDownload = () => {
    if (!downloadUrl) return

    // Create download link
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `network-report-${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    toast.success('PDF downloaded successfully')
  }

  const handleClose = () => {
    if (status === 'processing' || status === 'pending') {
      toast.error('Cannot close while export is in progress')
      return
    }
    onClose()
  }

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Preparing export...'
      case 'processing':
        return `Processing ${processedSites}/${totalSites} sites...`
      case 'complete':
        return 'PDF generation complete!'
      case 'failed':
        return 'Export failed'
      default:
        return 'Processing...'
    }
  }

  return (
    <Dialog open={!!jobId} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={status === 'complete' || status === 'failed'}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'complete' ? (
              <Download className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            ) : status === 'failed' ? (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            )}
            Generating PDF Report
          </DialogTitle>
          <DialogDescription>{getStatusText()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Progress Bar */}
          {(status === 'pending' || status === 'processing') && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-center">
                <span className="text-3xl font-semibold tabular-nums">
                  {progress}%
                </span>
              </div>
              {totalSites > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Processing site {processedSites} of {totalSites}
                </p>
              )}
            </div>
          )}

          {/* Success State */}
          {status === 'complete' && downloadUrl && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Download className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your PDF report is ready to download
              </p>
            </div>
          )}

          {/* Error State */}
          {status === 'failed' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Export Failed</AlertTitle>
              <AlertDescription>
                {error || 'An error occurred while generating the PDF report.'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {(status === 'pending' || status === 'processing') && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}

          {status === 'complete' && downloadUrl && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Download PDF
              </Button>
            </>
          )}

          {status === 'failed' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
