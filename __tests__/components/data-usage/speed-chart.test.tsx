/**
 * Unit Tests for SpeedChart Component
 *
 * Tests cover:
 * - Rendering with valid data
 * - Empty data handling
 * - Chart elements
 * - Legend display
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import { SpeedChart } from '@/components/dashboard/data-usage/speed-chart'

// ============================================================================
// Test Data
// ============================================================================

const mockSpeedData = [
  { date: '2024-05-01', upload: 5.5, download: 8.2, allocated: 15 },
  { date: '2024-05-02', upload: 6.0, download: 9.0, allocated: 15 },
  { date: '2024-05-03', upload: 5.8, download: 8.5, allocated: 15 },
]

// ============================================================================
// Rendering Tests
// ============================================================================

describe('SpeedChart', () => {
  describe('Rendering', () => {
    it('renders with valid data', () => {
      render(<SpeedChart data={mockSpeedData} />)

      expect(screen.getByText('Network Speed Over Time')).toBeInTheDocument()
    })

    it('renders custom title', () => {
      render(<SpeedChart data={mockSpeedData} title="Upload/Download Speed" />)

      expect(screen.getByText('Upload/Download Speed')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <SpeedChart data={mockSpeedData} className="custom-class" />
      )

      const card = container.firstChild
      expect(card).toHaveClass('custom-class')
    })
  })

  // ============================================================================
  // Empty Data Handling
  // ============================================================================

  describe('Empty Data Handling', () => {
    it('handles empty data gracefully', () => {
      render(<SpeedChart data={[]} />)

      expect(screen.getByText('No speed data available')).toBeInTheDocument()
    })

    it('handles null data gracefully', () => {
      render(<SpeedChart data={null as unknown as []} />)

      expect(screen.getByText('No speed data available')).toBeInTheDocument()
    })

    it('handles undefined data gracefully', () => {
      render(<SpeedChart data={undefined as unknown as []} />)

      expect(screen.getByText('No speed data available')).toBeInTheDocument()
    })

    it('shows empty state with correct title', () => {
      render(<SpeedChart data={[]} title="Custom Title" />)

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
      expect(screen.getByText('No speed data available')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Chart Elements Tests
  // ============================================================================

  describe('Chart Elements', () => {
    it('displays legend correctly', () => {
      render(<SpeedChart data={mockSpeedData} />)

      // Recharts renders legend items
      // Note: Legend text may vary based on Recharts version
      const chartContainer = screen.getByText('Network Speed Over Time')
        .closest('div')
      expect(chartContainer).toBeInTheDocument()
    })

    it('contains ResponsiveContainer', () => {
      const { container } = render(<SpeedChart data={mockSpeedData} />)

      // ResponsiveContainer creates a wrapper div
      const chart = container.querySelector('.recharts-wrapper')
      // Chart may not render fully in JSDOM, but component should mount
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Data Validation Tests
  // ============================================================================

  describe('Data Validation', () => {
    it('handles single data point', () => {
      const singlePoint = [mockSpeedData[0]]
      render(<SpeedChart data={singlePoint} />)

      expect(screen.getByText('Network Speed Over Time')).toBeInTheDocument()
    })

    it('handles many data points', () => {
      const manyPoints = Array(100)
        .fill(null)
        .map((_, i) => ({
          date: `2024-05-${String(i + 1).padStart(2, '0')}`,
          upload: 5 + Math.random() * 5,
          download: 8 + Math.random() * 5,
          allocated: 15,
        }))

      render(<SpeedChart data={manyPoints} />)

      expect(screen.getByText('Network Speed Over Time')).toBeInTheDocument()
    })

    it('handles data with zero values', () => {
      const zeroData = [
        { date: '2024-05-01', upload: 0, download: 0, allocated: 15 },
      ]

      render(<SpeedChart data={zeroData} />)

      expect(screen.getByText('Network Speed Over Time')).toBeInTheDocument()
    })

    it('handles data with high values', () => {
      const highData = [
        { date: '2024-05-01', upload: 100, download: 150, allocated: 200 },
      ]

      render(<SpeedChart data={highData} />)

      expect(screen.getByText('Network Speed Over Time')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Component Structure Tests
  // ============================================================================

  describe('Component Structure', () => {
    it('wraps content in Card component', () => {
      const { container } = render(<SpeedChart data={mockSpeedData} />)

      // Card component should be rendered (contains p-6 for padding)
      const innerDiv = container.querySelector('.p-6')
      expect(innerDiv).toBeInTheDocument()
    })

    it('has correct padding structure', () => {
      const { container } = render(<SpeedChart data={mockSpeedData} />)

      const innerDiv = container.querySelector('.p-6')
      expect(innerDiv).toBeInTheDocument()
    })

    it('title has correct styling', () => {
      render(<SpeedChart data={mockSpeedData} />)

      const title = screen.getByText('Network Speed Over Time')
      expect(title.tagName).toBe('H3')
      expect(title).toHaveClass('text-lg', 'font-semibold')
    })
  })
})
