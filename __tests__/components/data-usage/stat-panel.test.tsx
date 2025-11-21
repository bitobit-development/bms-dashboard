/**
 * Unit Tests for StatPanel Component
 *
 * Tests cover:
 * - Default rendering
 * - Compact variant
 * - Trend indicators
 * - Value formatting
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import { StatPanel } from '@/components/dashboard/data-usage/stat-panel'

// ============================================================================
// Rendering Tests
// ============================================================================

describe('StatPanel', () => {
  describe('Default Variant Rendering', () => {
    it('renders title and value', () => {
      render(<StatPanel title="Total Sites" value={120} />)

      expect(screen.getByText('Total Sites')).toBeInTheDocument()
      expect(screen.getByText('120')).toBeInTheDocument()
    })

    it('renders with unit', () => {
      render(<StatPanel title="Speed" value={15.5} unit="Mbps" />)

      expect(screen.getByText('Speed')).toBeInTheDocument()
      expect(screen.getByText('15.5')).toBeInTheDocument()
      expect(screen.getByText('Mbps')).toBeInTheDocument()
    })

    it('renders string value', () => {
      render(<StatPanel title="Status" value="Online" />)

      expect(screen.getByText('Online')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <StatPanel title="Test" value={100} className="custom-stat" />
      )

      // Card should have the custom class
      expect(container.firstChild).toHaveClass('custom-stat')
    })
  })

  // ============================================================================
  // Compact Variant Tests
  // ============================================================================

  describe('Compact Variant', () => {
    it('renders compact variant correctly', () => {
      render(<StatPanel title="Latency" value={45} unit="ms" variant="compact" />)

      expect(screen.getByText('Latency')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('ms')).toBeInTheDocument()
    })

    it('compact variant has different styling', () => {
      const { container } = render(
        <StatPanel title="Test" value={100} variant="compact" />
      )

      // Compact variant should not have Card wrapper (no p-4)
      const card = container.querySelector('.p-4')
      expect(card).not.toBeInTheDocument()
    })

    it('compact variant value has correct size', () => {
      render(<StatPanel title="Test" value={100} variant="compact" />)

      const value = screen.getByText('100')
      expect(value).toHaveClass('text-lg')
    })

    it('default variant value has larger size', () => {
      render(<StatPanel title="Test" value={100} />)

      const value = screen.getByText('100')
      expect(value).toHaveClass('text-2xl')
    })
  })

  // ============================================================================
  // Trend Indicator Tests
  // ============================================================================

  describe('Trend Indicators', () => {
    it('displays upward trend with green color', () => {
      render(
        <StatPanel
          title="Growth"
          value={100}
          trend={{ value: 15, direction: 'up' }}
        />
      )

      expect(screen.getByText('15%')).toBeInTheDocument()
    })

    it('displays downward trend with red color', () => {
      render(
        <StatPanel
          title="Decline"
          value={100}
          trend={{ value: 10, direction: 'down' }}
        />
      )

      expect(screen.getByText('10%')).toBeInTheDocument()
    })

    it('displays neutral trend with muted color', () => {
      render(
        <StatPanel
          title="Stable"
          value={100}
          trend={{ value: 0, direction: 'neutral' }}
        />
      )

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('displays trend label when provided', () => {
      render(
        <StatPanel
          title="Growth"
          value={100}
          trend={{ value: 15, direction: 'up', label: 'vs last month' }}
        />
      )

      expect(screen.getByText('vs last month')).toBeInTheDocument()
    })

    it('does not show trend when not provided', () => {
      render(<StatPanel title="Test" value={100} />)

      expect(screen.queryByText('%')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('uses tabular-nums for value display', () => {
      render(<StatPanel title="Test" value={12345} />)

      const value = screen.getByText('12345')
      expect(value).toHaveClass('tabular-nums')
    })

    it('hides trend icons from screen readers', () => {
      const { container } = render(
        <StatPanel
          title="Test"
          value={100}
          trend={{ value: 10, direction: 'up' }}
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
    it('handles zero value', () => {
      render(<StatPanel title="Count" value={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles negative value', () => {
      render(<StatPanel title="Balance" value={-50} />)

      expect(screen.getByText('-50')).toBeInTheDocument()
    })

    it('handles decimal values', () => {
      render(<StatPanel title="Rate" value={3.14159} />)

      expect(screen.getByText('3.14159')).toBeInTheDocument()
    })

    it('handles long title', () => {
      const longTitle = 'This Is A Very Long Title That Might Wrap'
      render(<StatPanel title={longTitle} value={100} />)

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('handles empty string value', () => {
      render(<StatPanel title="Status" value="" />)

      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('handles trend with decimal percentage', () => {
      render(
        <StatPanel
          title="Test"
          value={100}
          trend={{ value: 12.5, direction: 'up' }}
        />
      )

      expect(screen.getByText('12.5%')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Component Structure Tests
  // ============================================================================

  describe('Component Structure', () => {
    it('default variant uses Card component', () => {
      const { container } = render(<StatPanel title="Test" value={100} />)

      const card = container.querySelector('.p-4')
      expect(card).toBeInTheDocument()
    })

    it('has correct flex structure', () => {
      const { container } = render(<StatPanel title="Test" value={100} />)

      const flexContainer = container.querySelector('.flex-col')
      expect(flexContainer).toBeInTheDocument()
    })

    it('title has muted foreground color', () => {
      render(<StatPanel title="Test Title" value={100} />)

      const title = screen.getByText('Test Title')
      expect(title).toHaveClass('text-muted-foreground')
    })

    it('value has bold font weight', () => {
      render(<StatPanel title="Test" value={100} />)

      const value = screen.getByText('100')
      expect(value).toHaveClass('font-bold')
    })
  })
})
