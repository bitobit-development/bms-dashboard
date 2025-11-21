'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DateRange {
  start: Date
  end: Date
}

interface DateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  className?: string
}

// Predefined date ranges based on available data
const PRESETS = [
  {
    label: 'May-Nov 2024',
    value: 'may-nov-2024',
    range: {
      start: new Date(2024, 4, 1), // May 2024
      end: new Date(2024, 10, 30), // Nov 2024
    },
  },
  {
    label: 'Feb-Jun 2025',
    value: 'feb-jun-2025',
    range: {
      start: new Date(2025, 1, 1), // Feb 2025
      end: new Date(2025, 5, 30), // Jun 2025
    },
  },
  {
    label: 'Last 3 months',
    value: 'last-3-months',
    range: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      end: new Date(),
    },
  },
  {
    label: 'Last 6 months',
    value: 'last-6-months',
    range: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      end: new Date(),
    },
  },
  {
    label: 'Custom',
    value: 'custom',
    range: null,
  },
]

// Disabled date ranges (Dec 2024, Jan 2025 - no data)
const isDateDisabled = (date: Date) => {
  const month = date.getMonth()
  const year = date.getFullYear()

  // Disable December 2024 and January 2025
  if (year === 2024 && month === 11) return true // December 2024
  if (year === 2025 && month === 0) return true // January 2025

  // Disable future dates
  if (date > new Date()) return true

  return false
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('custom')
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isEndOpen, setIsEndOpen] = useState(false)

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value)
    const preset = PRESETS.find((p) => p.value === value)
    if (preset && preset.range) {
      onDateRangeChange(preset.range)
    }
  }

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedPreset('custom')
      onDateRangeChange({
        ...dateRange,
        start: date,
      })
      setIsStartOpen(false)
    }
  }

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedPreset('custom')
      onDateRangeChange({
        ...dateRange,
        end: date,
      })
      setIsEndOpen(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3', className)}>
      {/* Preset selector */}
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger
          className="w-full sm:w-[160px]"
          aria-label="Select date range preset"
        >
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom date pickers */}
      <div className="flex items-center gap-2">
        <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[130px] justify-start text-left font-normal',
                !dateRange.start && 'text-muted-foreground'
              )}
              aria-label="Select start date"
            >
              <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              {dateRange.start ? format(dateRange.start, 'MMM d, yyyy') : 'Start date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.start}
              onSelect={handleStartDateChange}
              disabled={isDateDisabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">to</span>

        <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[130px] justify-start text-left font-normal',
                !dateRange.end && 'text-muted-foreground'
              )}
              aria-label="Select end date"
            >
              <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              {dateRange.end ? format(dateRange.end, 'MMM d, yyyy') : 'End date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.end}
              onSelect={handleEndDateChange}
              disabled={(date) => isDateDisabled(date) || date < dateRange.start}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
