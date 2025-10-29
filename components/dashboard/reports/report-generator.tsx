'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { generateReport } from '@/app/actions/reports-actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

const reportTypes = [
  { value: 'daily-performance', label: 'Daily Performance Report' },
  { value: 'weekly-summary', label: 'Weekly Summary' },
  { value: 'monthly-energy', label: 'Monthly Energy Report' },
  { value: 'maintenance', label: 'Maintenance Report' },
  { value: 'alert-history', label: 'Alert History Report' },
  { value: 'equipment-health', label: 'Equipment Health Report' },
]

const reportFormats = [
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'json', label: 'JSON' },
]

const sites = [
  { value: 'all', label: 'All Sites' },
  { value: '1', label: 'Solar Farm Alpha' },
  { value: '2', label: 'Solar Farm Beta' },
  { value: '3', label: 'Solar Farm Gamma' },
]

export function ReportGenerator() {
  const [reportType, setReportType] = useState('')
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [site, setSite] = useState('all')
  const [formatType, setFormatType] = useState('pdf')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!reportType || !dateFrom || !dateTo) {
      toast.error('Please fill in all required fields')
      return
    }

    if (dateFrom > dateTo) {
      toast.error('Start date must be before end date')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateReport({
        type: reportType,
        dateRange: { from: dateFrom, to: dateTo },
        siteId: site,
        format: formatType,
      })

      if (result.success) {
        toast.success('Report generated successfully')
        // Optionally trigger download
        if (result.downloadUrl) {
          window.open(result.downloadUrl, '_blank')
        }
      } else {
        toast.error(result.error || 'Failed to generate report')
      }
    } catch (error) {
      toast.error('An error occurred while generating the report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = () => {
    toast.info('Preview feature coming soon')
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="report-type">
              Report Type <span className="text-destructive">*</span>
            </Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type" className="w-full">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Site */}
          <div className="space-y-2">
            <Label htmlFor="site">Site</Label>
            <Select value={site} onValueChange={setSite}>
              <SelectTrigger id="site" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Date */}
          <div className="space-y-2">
            <Label htmlFor="date-from">
              From Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-from"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label htmlFor="date-to">
              To Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-to"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  disabled={(date) => dateFrom ? date < dateFrom : false}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={formatType} onValueChange={setFormatType}>
              <SelectTrigger id="format" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportFormats.map((fmt) => (
                  <SelectItem key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <FileText className="mr-2 h-4 w-4 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            Preview
          </Button>
        </div>
      </div>
    </Card>
  )
}
