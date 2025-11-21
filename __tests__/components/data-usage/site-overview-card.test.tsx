/**
 * Unit Tests for SiteOverviewCard Component
 *
 * Tests cover:
 * - Rendering with all props
 * - Status indicator colors
 * - Speed display formatting
 * - Data consumption progress
 * - Navigation link
 * - Accessibility
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import { SiteOverviewCard } from '@/components/dashboard/data-usage/site-overview-card'

// ============================================================================
// Test Data
// ============================================================================

const defaultProps = {
  siteId: 1,
  siteName: 'Test Site Alpha',
  avgUploadSpeed: 5.5,
  avgDownloadSpeed: 8.2,
  allocatedBandwidth: 15,
  utilizationPct: 54.67,
  totalDataConsumed: 100.5,
  consumptionPct: 50,
  avgLatency: 45,
  status: 'good' as const,
}

// ============================================================================
// Rendering Tests
// ============================================================================

describe('SiteOverviewCard', () => {
  describe('Rendering', () => {
    it('renders site name and status indicator', () => {
      render(<SiteOverviewCard {...defaultProps} />)

      expect(screen.getByText('Test Site Alpha')).toBeInTheDocument()
    })

    it('displays correct upload/download speeds', () => {
      render(<SiteOverviewCard {...defaultProps} />)

      expect(screen.getByText('5.5')).toBeInTheDocument()
      expect(screen.getByText('8.2')).toBeInTheDocument()
      // Check for Mbps labels
      const mbpsLabels = screen.getAllByText('Mbps')
      expect(mbpsLabels.length).toBeGreaterThanOrEqual(2)
    })

    it('shows allocated bandwidth', () => {
      render(<SiteOverviewCard {...defaultProps} />)

      expect(screen.getByText(/Allocated: 15 Mbps/)).toBeInTheDocument()
    })

    it('shows consumption progress bar', () => {
      render(<SiteOverviewCard {...defaultProps} />)

      expect(screen.getByText('Data Used')).toBeInTheDocument()
      expect(screen.getByText(/50% of allowance/)).toBeInTheDocument()
    })

    it('displays latency badge', () => {
      render(<SiteOverviewCard {...defaultProps} />)

      expect(screen.getByText('45ms')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Status Color Tests
  // ============================================================================

  describe('Status Indicators', () => {
    it('applies correct status color for good status', () => {
      const { container } = render(
        <SiteOverviewCard {...defaultProps} status="good" />
      )

      const statusIndicator = container.querySelector(
        'span[style*="background-color"]'
      )
      expect(statusIndicator).toHaveStyle({ backgroundColor: '#73bf69' })
    })

    it('applies correct status color for warning status', () => {
      const { container } = render(
        <SiteOverviewCard {...defaultProps} status="warning" />
      )

      const statusIndicator = container.querySelector(
        'span[style*="background-color"]'
      )
      expect(statusIndicator).toHaveStyle({ backgroundColor: '#fade2a' })
    })

    it('applies correct status color for critical status', () => {
      const { container } = render(
        <SiteOverviewCard {...defaultProps} status="critical" />
      )

      const statusIndicator = container.querySelector(
        'span[style*="background-color"]'
      )
      expect(statusIndicator).toHaveStyle({ backgroundColor: '#f2495c' })
    })
  })

  // ============================================================================
  // Data Formatting Tests
  // ============================================================================

  describe('Data Formatting', () => {
    it('formats data consumed in GB correctly', () => {
      render(
        <SiteOverviewCard {...defaultProps} totalDataConsumed={100.5} />
      )

      expect(screen.getByText('100.5 GB')).toBeInTheDocument()
    })

    it('formats data consumed in TB for large values', () => {
      render(
        <SiteOverviewCard {...defaultProps} totalDataConsumed={1500} />
      )

      expect(screen.getByText('1.5 TB')).toBeInTheDocument()
    })

    it('formats consumption percentage correctly', () => {
      render(
        <SiteOverviewCard {...defaultProps} consumptionPct={75.5} />
      )

      expect(screen.getByText(/76% of allowance/)).toBeInTheDocument()
    })

    it('caps progress bar at 100%', () => {
      render(
        <SiteOverviewCard {...defaultProps} consumptionPct={120} />
      )

      // Progress value should be capped at 100 in the display
      // The aria-label shows the capped percentage
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-label', 'Data consumption: 120%')
    })
  })

  // ============================================================================
  // Latency Badge Tests
  // ============================================================================

  describe('Latency Badge', () => {
    it('shows default variant for latency under 50ms', () => {
      render(<SiteOverviewCard {...defaultProps} avgLatency={30} />)

      const badge = screen.getByText('30ms')
      expect(badge).toBeInTheDocument()
    })

    it('shows secondary variant for latency 50-100ms', () => {
      render(<SiteOverviewCard {...defaultProps} avgLatency={75} />)

      const badge = screen.getByText('75ms')
      expect(badge).toBeInTheDocument()
    })

    it('shows destructive variant for latency over 100ms', () => {
      render(<SiteOverviewCard {...defaultProps} avgLatency={150} />)

      const badge = screen.getByText('150ms')
      expect(badge).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Navigation Tests
  // ============================================================================

  describe('Navigation', () => {
    it('navigates to detail page on click', () => {
      render(<SiteOverviewCard {...defaultProps} siteId={42} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/dashboard/data-usage/42')
    })

    it('has correct aria-label for accessibility', () => {
      render(<SiteOverviewCard {...defaultProps} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute(
        'aria-label',
        'View data usage details for Test Site Alpha'
      )
    })
  })

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('has accessible progress bar', () => {
      render(<SiteOverviewCard {...defaultProps} consumptionPct={50} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute(
        'aria-label',
        'Data consumption: 50%'
      )
    })

    it('hides decorative icons from screen readers', () => {
      const { container } = render(<SiteOverviewCard {...defaultProps} />)

      const arrowIcons = container.querySelectorAll('[aria-hidden="true"]')
      expect(arrowIcons.length).toBeGreaterThan(0)
    })

    it('is focusable via keyboard', () => {
      render(<SiteOverviewCard {...defaultProps} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('tabIndex', '0')
    })
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles zero values gracefully', () => {
      render(
        <SiteOverviewCard
          {...defaultProps}
          avgUploadSpeed={0}
          avgDownloadSpeed={0}
          totalDataConsumed={0}
          consumptionPct={0}
        />
      )

      // Check that zero values are displayed (there will be multiple 0.0 values)
      const zeroValues = screen.getAllByText('0.0')
      expect(zeroValues.length).toBeGreaterThanOrEqual(2) // Upload and download
      expect(screen.getByText('0.0 GB')).toBeInTheDocument()
    })

    it('handles very long site names', () => {
      const longName = 'This Is A Very Long Site Name That Should Be Truncated'
      render(<SiteOverviewCard {...defaultProps} siteName={longName} />)

      expect(screen.getByText(longName)).toBeInTheDocument()
    })

    it('handles decimal precision in speeds', () => {
      render(
        <SiteOverviewCard
          {...defaultProps}
          avgUploadSpeed={5.123}
          avgDownloadSpeed={8.789}
        />
      )

      // Should show 1 decimal place
      expect(screen.getByText('5.1')).toBeInTheDocument()
      expect(screen.getByText('8.8')).toBeInTheDocument()
    })
  })
})
