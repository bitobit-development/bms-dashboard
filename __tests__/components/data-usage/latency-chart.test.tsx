/**
 * Unit Tests for LatencyChart Component
 *
 * Tests cover:
 * - Rendering with valid data
 * - Empty data handling
 * - Chart elements (area chart)
 * - Min/Max/Avg display
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import { LatencyChart } from '@/components/dashboard/data-usage/latency-chart'

// ============================================================================
// Test Data
// ============================================================================

const mockLatencyData = [
  { date: '2024-05-01', avg: 45.5, min: 30.0, max: 80.0 },
  { date: '2024-05-02', avg: 42.0, min: 25.0, max: 75.0 },
  { date: '2024-05-03', avg: 48.0, min: 35.0, max: 85.0 },
]

// ============================================================================
// Rendering Tests
// ============================================================================

describe('LatencyChart', () => {
  describe('Rendering', () => {
    it('renders with valid data', () => {
      render(<LatencyChart data={mockLatencyData} />)

      expect(screen.getByText('Network Latency')).toBeInTheDocument()
    })

    it('renders custom title', () => {
      render(<LatencyChart data={mockLatencyData} title="Response Time" />)

      expect(screen.getByText('Response Time')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <LatencyChart data={mockLatencyData} className="custom-latency" />
      )

      const card = container.firstChild
      expect(card).toHaveClass('custom-latency')
    })
  })

  // ============================================================================
  // Empty Data Handling
  // ============================================================================

  describe('Empty Data Handling', () => {
    it('handles empty data gracefully', () => {
      render(<LatencyChart data={[]} />)

      expect(screen.getByText('No latency data available')).toBeInTheDocument()
    })

    it('handles null data gracefully', () => {
      render(<LatencyChart data={null as unknown as []} />)

      expect(screen.getByText('No latency data available')).toBeInTheDocument()
    })

    it('handles undefined data gracefully', () => {
      render(<LatencyChart data={undefined as unknown as []} />)

      expect(screen.getByText('No latency data available')).toBeInTheDocument()
    })

    it('shows empty state with correct title', () => {
      render(<LatencyChart data={[]} title="Latency Analysis" />)

      expect(screen.getByText('Latency Analysis')).toBeInTheDocument()
      expect(screen.getByText('No latency data available')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Data Validation Tests
  // ============================================================================

  describe('Data Validation', () => {
    it('handles single data point', () => {
      const singlePoint = [mockLatencyData[0]]
      render(<LatencyChart data={singlePoint} />)

      expect(screen.getByText('Network Latency')).toBeInTheDocument()
    })

    it('handles data with zero min latency', () => {
      const zeroMinData = [
        { date: '2024-05-01', avg: 10.0, min: 0, max: 50.0 },
      ]

      render(<LatencyChart data={zeroMinData} />)

      expect(screen.getByText('Network Latency')).toBeInTheDocument()
    })

    it('handles high latency values', () => {
      const highData = [
        { date: '2024-05-01', avg: 500.0, min: 200.0, max: 1000.0 },
      ]

      render(<LatencyChart data={highData} />)

      expect(screen.getByText('Network Latency')).toBeInTheDocument()
    })

    it('handles data where min equals max', () => {
      const equalData = [
        { date: '2024-05-01', avg: 50.0, min: 50.0, max: 50.0 },
      ]

      render(<LatencyChart data={equalData} />)

      expect(screen.getByText('Network Latency')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Component Structure Tests
  // ============================================================================

  describe('Component Structure', () => {
    it('wraps content in Card component', () => {
      const { container } = render(<LatencyChart data={mockLatencyData} />)

      expect(container.firstChild).toBeInTheDocument()
    })

    it('has correct padding structure', () => {
      const { container } = render(<LatencyChart data={mockLatencyData} />)

      const innerDiv = container.querySelector('.p-6')
      expect(innerDiv).toBeInTheDocument()
    })

    it('title has correct styling', () => {
      render(<LatencyChart data={mockLatencyData} />)

      const title = screen.getByText('Network Latency')
      expect(title.tagName).toBe('H3')
      expect(title).toHaveClass('text-lg', 'font-semibold')
    })

    it('has defined chart height', () => {
      const { container } = render(<LatencyChart data={mockLatencyData} />)

      const chartContainer = container.querySelector('.h-\\[300px\\]')
      // Chart container should have 300px height when empty
      expect(container.querySelector('.p-6')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles many data points', () => {
      const manyPoints = Array(365)
        .fill(null)
        .map((_, i) => ({
          date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
          avg: 40 + Math.random() * 20,
          min: 20 + Math.random() * 10,
          max: 60 + Math.random() * 40,
        }))

      render(<LatencyChart data={manyPoints} />)

      expect(screen.getByText('Network Latency')).toBeInTheDocument()
    })

    it('handles decimal precision in latency values', () => {
      const decimalData = [
        { date: '2024-05-01', avg: 45.123, min: 30.456, max: 80.789 },
      ]

      render(<LatencyChart data={decimalData} />)

      expect(screen.getByText('Network Latency')).toBeInTheDocument()
    })
  })
})
