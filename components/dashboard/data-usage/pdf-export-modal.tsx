'use client'

import { useState, useEffect } from 'react'
import { FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from './date-range-picker'
import type { DateRange, SiteNetworkSummary } from '@/app/actions/network-usage'

interface PdfExportModalProps {
  open: boolean
  onClose: () => void
  sites: SiteNetworkSummary[]
  defaultDateRange: DateRange
  onExport: (params: {
    dateRange: DateRange
    siteIds: number[] | null
  }) => Promise<void>
}

export function PdfExportModal({
  open,
  onClose,
  sites,
  defaultDateRange,
  onExport,
}: PdfExportModalProps) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [allSites, setAllSites] = useState(true)
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([])
  const [isExporting, setIsExporting] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setDateRange(defaultDateRange)
      setAllSites(true)
      setSelectedSiteIds([])
    }
  }, [open, defaultDateRange])

  const handleSiteToggle = (siteId: number) => {
    setSelectedSiteIds((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    )
  }

  const handleSelectAll = () => {
    setSelectedSiteIds(sites.map((site) => site.siteId))
  }

  const handleClearAll = () => {
    setSelectedSiteIds([])
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport({
        dateRange,
        siteIds: allSites ? null : selectedSiteIds,
      })
      onClose()
    } finally {
      setIsExporting(false)
    }
  }

  const canExport = allSites || selectedSiteIds.length > 0
  const selectedCount = allSites ? sites.length : selectedSiteIds.length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            Generate PDF Report
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive network usage report for selected sites and date range.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range</Label>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>

          {/* Site Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Site Selection</Label>

            {/* All Sites Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="all-sites"
                checked={allSites}
                onCheckedChange={(checked) => {
                  setAllSites(checked === true)
                  if (checked) {
                    setSelectedSiteIds([])
                  }
                }}
                aria-label="Select all sites"
              />
              <Label
                htmlFor="all-sites"
                className="text-sm font-normal cursor-pointer"
              >
                All sites ({sites.length} sites)
              </Label>
            </div>

            {/* Specific Sites Selection */}
            {!allSites && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedSiteIds.length} site{selectedSiteIds.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-8 text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="h-8 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* Sites List */}
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {sites.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No sites available
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {sites.map((site) => (
                        <div
                          key={site.siteId}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`site-${site.siteId}`}
                            checked={selectedSiteIds.includes(site.siteId)}
                            onCheckedChange={() => handleSiteToggle(site.siteId)}
                            aria-label={`Select ${site.siteName}`}
                          />
                          <Label
                            htmlFor={`site-${site.siteId}`}
                            className="flex-1 text-sm font-normal cursor-pointer"
                          >
                            {site.siteName}
                          </Label>
                          <span
                            className={`text-xs ${
                              site.status === 'good'
                                ? 'text-green-600 dark:text-green-400'
                                : site.status === 'warning'
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {site.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Report will include:</span>
              <span className="font-medium">
                {selectedCount} site{selectedCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={!canExport || isExporting}
          >
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            {isExporting ? 'Generating...' : 'Generate PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
