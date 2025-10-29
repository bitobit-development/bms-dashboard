'use client'

import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DateRange = {
  from: Date
  to: Date
}

type AnalyticsDatePickerProps = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

export function AnalyticsDatePicker({ dateRange, onDateRangeChange }: AnalyticsDatePickerProps) {
  const handleQuickSelect = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    onDateRangeChange({ from, to })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick Select Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect(1)}
        >
          Last 24h
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect(7)}
        >
          Last 7 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect(30)}
        >
          Last 30 Days
        </Button>
      </div>

      {/* Custom Range Pickers */}
      <div className="flex items-center gap-2">
        {/* From Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'justify-start text-left font-normal',
                !dateRange.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? format(dateRange.from, 'PPP') : 'From date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.from}
              onSelect={(date) => {
                if (date) {
                  onDateRangeChange({ ...dateRange, from: date })
                }
              }}
              disabled={(date) => date > new Date() || date > dateRange.to}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* To Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'justify-start text-left font-normal',
                !dateRange.to && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.to ? format(dateRange.to, 'PPP') : 'To date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={(date) => {
                if (date) {
                  onDateRangeChange({ ...dateRange, to: date })
                }
              }}
              disabled={(date) => date > new Date() || date < dateRange.from}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
