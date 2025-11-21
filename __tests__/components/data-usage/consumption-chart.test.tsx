/**
 * Unit Tests for ConsumptionChart Component
 *
 * Tests cover:
 * - Rendering with valid data
 * - Empty data handling
 * - Color coding based on consumption percentage
 * - Total calculation display
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import { ConsumptionChart } from '@/components/dashboard/data-usage/consumption-chart'

// ============================================================================
// Test Data
// ============================================================================

const mockConsumptionData = [
  { date: '2024-05-01', consumed: 3.0, allowance: 6.0 },
  { date: '2024-05-02', consumed: 4.0, allowance: 6.0 },
  { date: '2024-05-03', consumed: 3.5, allowance: 6.0 },
]

// ============================================================================
// Rendering Tests
// ============================================================================

describe('ConsumptionChart', () => {
  describe('Rendering', () => {
    it('renders with valid data', () => {
      render(<ConsumptionChart data={mockConsumptionData} />)

      expect(screen.getByText('Data Consumption')).toBeInTheDocument()
    })

    it('renders custom title', () => {
      render(
        <ConsumptionChart
          data={mockConsumptionData}
          title="Monthly Data Usage"
        />
      )

      expect(screen.getByText('Monthly Data Usage')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <ConsumptionChart
          data={mockConsumptionData}
          className="custom-consumption"
        />
      )

      const card = container.firstChild
      expect(card).toHaveClass('custom-consumption')
    })

    it('displays total consumption', () => {
      render(<ConsumptionChart data={mockConsumptionData} />)

      // Total: 3 + 4 + 3.5 = 10.5 GB
      expect(screen.getByText('10.5 GB')).toBeInTheDocument()
    })

    it('displays total allowance', () => {
      render(<ConsumptionChart data={mockConsumptionData} />)

      // Total allowance: 6 + 6 + 6 = 18 GB
      expect(screen.getByText('18.0 GB')).toBeInTheDocument()
    })

    it('displays consumption percentage', () => {
      render(<ConsumptionChart data={mockConsumptionData} />)

      // Percentage: (10.5 / 18) * 100 = 58%
      expect(screen.getByText('(58%)')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Empty Data Handling
  // ============================================================================

  describe('Empty Data Handling', () => {
    it('handles empty data gracefully', () => {
      render(<ConsumptionChart data={[]} />)

      expect(
        screen.getByText('No consumption data available')
      ).toBeInTheDocument()
    })

    it('handles null data gracefully', () => {
      render(<ConsumptionChart data={null as unknown as []} />)

      expect(
        screen.getByText('No consumption data available')
      ).toBeInTheDocument()
    })

    it('handles undefined data gracefully', () => {
      render(<ConsumptionChart data={undefined as unknown as []} />)

      expect(
        screen.getByText('No consumption data available')
      ).toBeInTheDocument()
    })

    it('shows empty state with correct title', () => {
      render(<ConsumptionChart data={[]} title="Usage Stats" />)

      expect(screen.getByText('Usage Stats')).toBeInTheDocument()
      expect(
        screen.getByText('No consumption data available')
      ).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Color Coding Tests
  // ============================================================================

  describe('Color Coding', () => {
    it('uses normal color for consumption under 70%', () => {
      const normalData = [
        { date: '2024-05-01', consumed: 3.0, allowance: 10.0 }, // 30%
      ]

      render(<ConsumptionChart data={normalData} />)

      expect(screen.getByText('Data Consumption')).toBeInTheDocument()
    })

    it('uses warning color for consumption 70-90%', () => {
      const warningData = [
        { date: '2024-05-01', consumed: 8.0, allowance: 10.0 }, // 80%
      ]

      render(<ConsumptionChart data={warningData} />)

      expect(screen.getByText('Data Consumption')).toBeInTheDocument()
    })

    it('uses critical color for consumption over 90%', () => {
      const criticalData = [
        { date: '2024-05-01', consumed: 9.5, allowance: 10.0 }, // 95%
      ]

      render(<ConsumptionChart data={criticalData} />)

      expect(screen.getByText('Data Consumption')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Calculation Tests
  // ============================================================================

  describe('Calculations', () => {
    it('calculates total correctly for single day', () => {
      const singleDay = [{ date: '2024-05-01', consumed: 5.0, allowance: 10.0 }]

      render(<ConsumptionChart data={singleDay} />)

      expect(screen.getByText('5.0 GB')).toBeInTheDocument()
      expect(screen.getByText('10.0 GB')).toBeInTheDocument()
    })

    it('calculates percentage correctly', () => {
      const data = [
        { date: '2024-05-01', consumed: 2.5, allowance: 5.0 }, // 50%
        { date: '2024-05-02', consumed: 2.5, allowance: 5.0 }, // 50%
      ]

      render(<ConsumptionChart data={data} />)

      // Total: 5 GB / 10 GB = 50%
      expect(screen.getByText('(50%)')).toBeInTheDocument()
    })

    it('handles zero allowance without division error', () => {
      const zeroAllowance = [
        { date: '2024-05-01', consumed: 5.0, allowance: 0 },
      ]

      render(<ConsumptionChart data={zeroAllowance} />)

      // Should show 0% when allowance is 0
      expect(screen.getByText('(0%)')).toBeInTheDocument()
    })

    it('handles decimal values correctly', () => {
      const decimalData = [
        { date: '2024-05-01', consumed: 1.234, allowance: 5.678 },
      ]

      render(<ConsumptionChart data={decimalData} />)

      expect(screen.getByText('1.2 GB')).toBeInTheDocument()
      expect(screen.getByText('5.7 GB')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Component Structure Tests
  // ============================================================================

  describe('Component Structure', () => {
    it('wraps content in Card component', () => {
      const { container } = render(
        <ConsumptionChart data={mockConsumptionData} />
      )

      expect(container.firstChild).toBeInTheDocument()
    })

    it('has header with title and totals', () => {
      render(<ConsumptionChart data={mockConsumptionData} />)

      const title = screen.getByText('Data Consumption')
      expect(title).toHaveClass('text-lg', 'font-semibold')
    })

    it('displays Total label', () => {
      render(<ConsumptionChart data={mockConsumptionData} />)

      // Total label appears in the summary display
      expect(screen.getByText(/Total:/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles many data points', () => {
      const manyPoints = Array(100)
        .fill(null)
        .map((_, i) => ({
          date: `2024-05-${String((i % 28) + 1).padStart(2, '0')}`,
          consumed: Math.random() * 5,
          allowance: 5,
        }))

      render(<ConsumptionChart data={manyPoints} />)

      expect(screen.getByText('Data Consumption')).toBeInTheDocument()
    })

    it('handles very small values', () => {
      const smallData = [
        { date: '2024-05-01', consumed: 0.001, allowance: 0.01 },
      ]

      render(<ConsumptionChart data={smallData} />)

      expect(screen.getByText('Data Consumption')).toBeInTheDocument()
    })

    it('handles very large values', () => {
      const largeData = [
        { date: '2024-05-01', consumed: 10000, allowance: 50000 },
      ]

      render(<ConsumptionChart data={largeData} />)

      expect(screen.getByText('Data Consumption')).toBeInTheDocument()
    })

    it('handles 100% consumption', () => {
      const fullData = [
        { date: '2024-05-01', consumed: 10.0, allowance: 10.0 },
      ]

      render(<ConsumptionChart data={fullData} />)

      expect(screen.getByText('(100%)')).toBeInTheDocument()
    })

    it('handles over 100% consumption', () => {
      const overData = [
        { date: '2024-05-01', consumed: 15.0, allowance: 10.0 },
      ]

      render(<ConsumptionChart data={overData} />)

      expect(screen.getByText('(150%)')).toBeInTheDocument()
    })
  })
})
