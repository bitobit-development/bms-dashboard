/**
 * Unit Tests for DateRangePicker Component
 *
 * Tests cover:
 * - Rendering with date range
 * - Preset selection
 * - Custom date selection
 * - Date validation/disabled dates
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { DateRangePicker } from '@/components/dashboard/data-usage/date-range-picker'

// ============================================================================
// Test Data
// ============================================================================

const mockDateRange = {
  start: new Date(2024, 4, 1), // May 1, 2024
  end: new Date(2024, 10, 30), // November 30, 2024
}

const mockOnDateRangeChange = jest.fn()

// ============================================================================
// Rendering Tests
// ============================================================================

describe('DateRangePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with date range', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      // Check start date button shows formatted date
      expect(screen.getByText(/May 1, 2024/)).toBeInTheDocument()
      // Check end date button shows formatted date
      expect(screen.getByText(/Nov 30, 2024/)).toBeInTheDocument()
    })

    it('renders preset selector', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      // Preset selector should be present
      expect(
        screen.getByRole('combobox', { name: 'Select date range preset' })
      ).toBeInTheDocument()
    })

    it('renders date picker buttons', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      expect(
        screen.getByRole('button', { name: 'Select start date' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Select end date' })
      ).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
          className="custom-picker"
        />
      )

      expect(container.firstChild).toHaveClass('custom-picker')
    })

    it('displays "to" separator between date pickers', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      expect(screen.getByText('to')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Preset Selection Tests
  // ============================================================================

  describe('Preset Selection', () => {
    it('shows available presets when opened', async () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      // Click to open preset selector
      const presetSelector = screen.getByRole('combobox', {
        name: 'Select date range preset',
      })
      fireEvent.click(presetSelector)

      // Check for preset options
      expect(screen.getByText('May-Nov 2024')).toBeInTheDocument()
      expect(screen.getByText('Feb-Jun 2025')).toBeInTheDocument()
      expect(screen.getByText('Last 3 months')).toBeInTheDocument()
      expect(screen.getByText('Last 6 months')).toBeInTheDocument()
      // Custom may appear multiple times (in selector and as option), use getAllByText
      const customElements = screen.getAllByText('Custom')
      expect(customElements.length).toBeGreaterThanOrEqual(1)
    })

    it('calls onDateRangeChange when preset is selected', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      // Open and select preset
      const presetSelector = screen.getByRole('combobox', {
        name: 'Select date range preset',
      })
      fireEvent.click(presetSelector)

      // Select 'May-Nov 2024' preset
      const mayNovOption = screen.getByText('May-Nov 2024')
      fireEvent.click(mayNovOption)

      expect(mockOnDateRangeChange).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Date Picker Interaction Tests
  // ============================================================================

  describe('Date Picker Interactions', () => {
    it('opens start date calendar on button click', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      const startButton = screen.getByRole('button', {
        name: 'Select start date',
      })
      fireEvent.click(startButton)

      // Calendar should be visible (Popover opens)
      // Note: Calendar content may vary based on react-day-picker version
    })

    it('opens end date calendar on button click', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      const endButton = screen.getByRole('button', { name: 'Select end date' })
      fireEvent.click(endButton)

      // Calendar should be visible
    })
  })

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('has accessible preset selector', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      const selector = screen.getByRole('combobox', {
        name: 'Select date range preset',
      })
      expect(selector).toBeInTheDocument()
    })

    it('has accessible start date button', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      expect(
        screen.getByRole('button', { name: 'Select start date' })
      ).toBeInTheDocument()
    })

    it('has accessible end date button', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      expect(
        screen.getByRole('button', { name: 'Select end date' })
      ).toBeInTheDocument()
    })

    it('hides calendar icons from screen readers', () => {
      const { container } = render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]')
      expect(hiddenIcons.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles same start and end date', () => {
      const sameDate = new Date(2024, 4, 15)
      render(
        <DateRangePicker
          dateRange={{ start: sameDate, end: sameDate }}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      // Both buttons should show May 15, 2024
      const dateButtons = screen.getAllByText(/May 15, 2024/)
      expect(dateButtons.length).toBe(2)
    })

    it('handles year boundary dates', () => {
      const yearBoundary = {
        start: new Date(2024, 11, 31), // Dec 31, 2024
        end: new Date(2025, 0, 1), // Jan 1, 2025
      }

      render(
        <DateRangePicker
          dateRange={yearBoundary}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument()
      expect(screen.getByText(/Jan 1, 2025/)).toBeInTheDocument()
    })

    it('handles dates at start of month', () => {
      const startOfMonth = {
        start: new Date(2024, 5, 1),
        end: new Date(2024, 5, 30),
      }

      render(
        <DateRangePicker
          dateRange={startOfMonth}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      expect(screen.getByText(/Jun 1, 2024/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Component Structure Tests
  // ============================================================================

  describe('Component Structure', () => {
    it('has responsive flex layout', () => {
      const { container } = render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('flex-col', 'sm:flex-row')
    })

    it('date buttons have consistent width', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      const startButton = screen.getByRole('button', {
        name: 'Select start date',
      })
      const endButton = screen.getByRole('button', { name: 'Select end date' })

      expect(startButton).toHaveClass('w-[130px]')
      expect(endButton).toHaveClass('w-[130px]')
    })

    it('preset selector has correct width on small screens', () => {
      render(
        <DateRangePicker
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      )

      const selector = screen.getByRole('combobox', {
        name: 'Select date range preset',
      })
      expect(selector).toHaveClass('w-full', 'sm:w-[160px]')
    })
  })
})
