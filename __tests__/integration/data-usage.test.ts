/**
 * Integration Tests for Data Usage Feature
 *
 * Tests cover:
 * - Loading overview page with site cards
 * - Navigation to site detail
 * - Date range filtering
 * - Data export functionality
 * - End-to-end data flow
 */

// IMPORTANT: jest.mock calls are hoisted to the top of the file
// They must appear before any imports that use the mocked modules

jest.mock('@/src/db', () => ({
  __esModule: true,
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        innerJoin: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(() => Promise.resolve([])),
          })),
        })),
        where: jest.fn(() => ({
          orderBy: jest.fn(() => Promise.resolve([])),
          limit: jest.fn(() => Promise.resolve([])),
        })),
        limit: jest.fn(() => Promise.resolve([])),
      })),
    })),
  },
}))

jest.mock('@/app/stack', () => ({
  __esModule: true,
  stackServerApp: {
    getUser: jest.fn(),
  },
}))

jest.mock('date-fns', () => ({
  __esModule: true,
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === 'yyyy-MM') {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      return `${year}-${month}`
    }
    if (formatStr === 'yyyy-MM-dd') {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return date.toISOString()
  }),
}))

import { db } from '@/src/db'
import { stackServerApp } from '@/app/stack'
import {
  getNetworkOverview,
  getSiteNetworkMetrics,
  getMonthlyComparison,
  exportNetworkData,
  type DateRange,
} from '@/app/actions/network-usage'

// ============================================================================
// Test Data
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const mockDateRange: DateRange = {
  start: new Date(2024, 4, 1),
  end: new Date(2024, 10, 30),
}

const mockSiteSummaries = [
  {
    siteId: 1,
    siteName: 'Site Alpha',
    avgUploadSpeed: 5.5,
    avgDownloadSpeed: 8.2,
    allocatedBandwidth: 15,
    utilizationPct: 54.67,
    totalDataConsumed: 107374182400,
    consumptionPct: 50,
    avgLatency: 45.5,
    month: '2024-05',
  },
  {
    siteId: 2,
    siteName: 'Site Beta',
    avgUploadSpeed: 7.0,
    avgDownloadSpeed: 10.5,
    allocatedBandwidth: 15,
    utilizationPct: 70,
    totalDataConsumed: 161061273600,
    consumptionPct: 75,
    avgLatency: 38.0,
    month: '2024-05',
  },
  {
    siteId: 3,
    siteName: 'Pholela School',
    avgUploadSpeed: 25.0,
    avgDownloadSpeed: 45.0,
    allocatedBandwidth: 100,
    utilizationPct: 45,
    totalDataConsumed: 536870912000,
    consumptionPct: 25,
    avgLatency: 30.0,
    month: '2024-05',
  },
]

const mockDailyData = [
  {
    siteId: 1,
    siteName: 'Site Alpha',
    date: '2024-05-01',
    avgUploadSpeed: 5.5,
    avgDownloadSpeed: 8.2,
    maxUploadSpeed: 8.0,
    maxDownloadSpeed: 12.0,
    allocatedBandwidth: 15,
    avgLatency: 45.5,
    minLatency: 30.0,
    maxLatency: 80.0,
    totalDataConsumed: 3221225472,
    dataAllowance: 6442450944,
    activeHours: 12,
  },
]

// ============================================================================
// Integration Test: Overview Page Loading
// ============================================================================

describe('Data Usage Feature - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Overview Page Loading', () => {
    it('loads overview page with site cards', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mockOrderBy = jest.fn().mockResolvedValue(mockSiteSummaries)
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getNetworkOverview(mockDateRange)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBe(3)
        expect(result.data[0].siteName).toBeDefined()
        expect(result.data[0].avgUploadSpeed).toBeDefined()
        expect(result.data[0].status).toBeDefined()
      }
    })

    it('displays sites sorted alphabetically', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mockOrderBy = jest.fn().mockResolvedValue(mockSiteSummaries)
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getNetworkOverview(mockDateRange)

      expect(result.success).toBe(true)
      if (result.success) {
        // Should be sorted: Pholela School, Site Alpha, Site Beta
        expect(result.data[0].siteName).toBe('Pholela School')
        expect(result.data[1].siteName).toBe('Site Alpha')
        expect(result.data[2].siteName).toBe('Site Beta')
      }
    })

    it('calculates correct status for each site', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mockOrderBy = jest.fn().mockResolvedValue(mockSiteSummaries)
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getNetworkOverview(mockDateRange)

      expect(result.success).toBe(true)
      if (result.success) {
        // Site Alpha: 54.67% -> good
        const siteAlpha = result.data.find((s) => s.siteName === 'Site Alpha')
        expect(siteAlpha?.status).toBe('good')

        // Site Beta: 70% -> warning
        const siteBeta = result.data.find((s) => s.siteName === 'Site Beta')
        expect(siteBeta?.status).toBe('warning')

        // Pholela: 45% -> good
        const pholela = result.data.find((s) => s.siteName === 'Pholela School')
        expect(pholela?.status).toBe('good')
      }
    })
  })

  // ============================================================================
  // Integration Test: Site Detail Navigation
  // ============================================================================

  describe('Site Detail Navigation', () => {
    it('navigates to site detail and loads metrics', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mockSiteInfo = { id: 1, name: 'Site Alpha' }
      const mockDailyMetrics = [mockDailyData[0]]

      let callCount = 0
      ;(db.select as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          const mockLimit = jest.fn().mockResolvedValue([mockSiteInfo])
          const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
          const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
          return { from: mockFrom }
        } else {
          const mockOrderBy = jest.fn().mockResolvedValue(mockDailyMetrics)
          const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
          const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
          return { from: mockFrom }
        }
      })

      const result = await getSiteNetworkMetrics(1, mockDateRange)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.site.id).toBe(1)
        expect(result.data.site.name).toBe('Site Alpha')
        expect(result.data.speedData).toBeDefined()
        expect(result.data.latencyData).toBeDefined()
        expect(result.data.consumptionData).toBeDefined()
        expect(result.data.summary).toBeDefined()
      }
    })

    it('returns correct bandwidth for Pholela School', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const pholelaInfo = { id: 3, name: 'Pholela School' }

      let callCount = 0
      ;(db.select as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          const mockLimit = jest.fn().mockResolvedValue([pholelaInfo])
          const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
          const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
          return { from: mockFrom }
        } else {
          const mockOrderBy = jest.fn().mockResolvedValue([])
          const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
          const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
          return { from: mockFrom }
        }
      })

      const result = await getSiteNetworkMetrics(3, mockDateRange)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.site.allocatedBandwidth).toBe(100)
      }
    })

    it('returns 15 Mbps for regular sites', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const regularSiteInfo = { id: 1, name: 'Site Alpha' }

      let callCount = 0
      ;(db.select as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          const mockLimit = jest.fn().mockResolvedValue([regularSiteInfo])
          const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
          const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
          return { from: mockFrom }
        } else {
          const mockOrderBy = jest.fn().mockResolvedValue([])
          const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
          const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
          return { from: mockFrom }
        }
      })

      const result = await getSiteNetworkMetrics(1, mockDateRange)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.site.allocatedBandwidth).toBe(15)
      }
    })
  })

  // ============================================================================
  // Integration Test: Date Range Filtering
  // ============================================================================

  describe('Date Range Filtering', () => {
    it('filters data by date range', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const narrowRange: DateRange = {
        start: new Date(2024, 4, 1), // May 1
        end: new Date(2024, 4, 31), // May 31
      }

      const mockOrderBy = jest.fn().mockResolvedValue([mockSiteSummaries[0]])
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getNetworkOverview(narrowRange)

      expect(result.success).toBe(true)
      expect(mockWhere).toHaveBeenCalled()
    })

    it('aggregates data across multiple months', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const multiMonthData = [
        { ...mockSiteSummaries[0], month: '2024-05' },
        { ...mockSiteSummaries[0], month: '2024-06', avgUploadSpeed: 6.5 },
      ]

      const mockOrderBy = jest.fn().mockResolvedValue(multiMonthData)
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getNetworkOverview(mockDateRange)

      expect(result.success).toBe(true)
      if (result.success) {
        // Should aggregate to single site entry
        expect(result.data.length).toBe(1)
        // Average of 5.5 and 6.5 = 6.0
        expect(result.data[0].avgUploadSpeed).toBeCloseTo(6.0, 1)
      }
    })
  })

  // ============================================================================
  // Integration Test: Data Export
  // ============================================================================

  describe('Data Export', () => {
    it('exports data successfully in CSV format', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mockOrderBy = jest.fn().mockResolvedValue([mockDailyData[0]])
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await exportNetworkData({
        format: 'csv',
        dateRange: mockDateRange,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.mimeType).toBe('text/csv')
        expect(result.data).toContain('Site ID')
        expect(result.data).toContain('Site Alpha')
      }
    })

    it('exports data successfully in JSON format', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mockOrderBy = jest.fn().mockResolvedValue([mockDailyData[0]])
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await exportNetworkData({
        format: 'json',
        dateRange: mockDateRange,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.mimeType).toBe('application/json')
        const parsed = JSON.parse(result.data)
        expect(Array.isArray(parsed)).toBe(true)
        expect(parsed[0].siteName).toBe('Site Alpha')
      }
    })

    it('filters export by site IDs', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const multiSiteData = [
        { ...mockDailyData[0], siteId: 1, siteName: 'Site Alpha' },
        { ...mockDailyData[0], siteId: 2, siteName: 'Site Beta' },
      ]

      const mockOrderBy = jest.fn().mockResolvedValue(multiSiteData)
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await exportNetworkData({
        format: 'json',
        dateRange: mockDateRange,
        siteIds: [1], // Only Site Alpha
      })

      expect(result.success).toBe(true)
      if (result.success) {
        const parsed = JSON.parse(result.data)
        expect(parsed.length).toBe(1)
        expect(parsed[0].siteId).toBe(1)
      }
    })
  })

  // ============================================================================
  // Integration Test: Monthly Comparison
  // ============================================================================

  describe('Monthly Comparison', () => {
    it('returns comparison data for multiple months', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mayData = [mockSiteSummaries[0], mockSiteSummaries[1]]
      const juneData = [
        { ...mockSiteSummaries[0], month: '2024-06', avgUploadSpeed: 6.0 },
      ]

      let callCount = 0
      ;(db.select as jest.Mock).mockImplementation(() => {
        callCount++
        const data = callCount === 1 ? mayData : juneData
        const mockOrderBy = jest.fn().mockResolvedValue(data)
        const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
        const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
        const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
        return { from: mockFrom }
      })

      const result = await getMonthlyComparison(['2024-05', '2024-06'])

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBe(2)
        expect(result.data[0].month).toBe('2024-05')
        expect(result.data[0].sites.length).toBe(2)
        expect(result.data[1].month).toBe('2024-06')
        expect(result.data[1].sites.length).toBe(1)
      }
    })

    it('calculates totals for each month', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mayData = [mockSiteSummaries[0]] // Single site

      const mockOrderBy = jest.fn().mockResolvedValue(mayData)
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getMonthlyComparison(['2024-05'])

      expect(result.success).toBe(true)
      if (result.success && result.data.length > 0) {
        const totals = result.data[0].totals
        expect(totals.avgUploadSpeed).toBeCloseTo(5.5, 1)
        expect(totals.avgDownloadSpeed).toBeCloseTo(8.2, 1)
      }
    })
  })

  // ============================================================================
  // Integration Test: Error Handling
  // ============================================================================

  describe('Error Handling', () => {
    it('handles authentication errors gracefully', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(null)

      const overviewResult = await getNetworkOverview(mockDateRange)
      const metricsResult = await getSiteNetworkMetrics(1, mockDateRange)
      const comparisonResult = await getMonthlyComparison(['2024-05'])
      const exportResult = await exportNetworkData({
        format: 'csv',
        dateRange: mockDateRange,
      })

      expect(overviewResult.success).toBe(false)
      expect(metricsResult.success).toBe(false)
      expect(comparisonResult.success).toBe(false)
      expect(exportResult.success).toBe(false)

      if (!overviewResult.success) {
        expect(overviewResult.error).toBe('Not authenticated')
      }
    })

    it('handles database errors gracefully', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)
      ;(db.select as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection lost')
      })

      const result = await getNetworkOverview(mockDateRange)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Database connection lost')
      }
    })

    it('handles site not found error', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mockLimit = jest.fn().mockResolvedValue([])
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getSiteNetworkMetrics(9999, mockDateRange)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Site not found')
      }
    })

    it('handles no data found for export', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mockOrderBy = jest.fn().mockResolvedValue([])
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await exportNetworkData({
        format: 'csv',
        dateRange: mockDateRange,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('No data found for the specified criteria')
      }
    })
  })

  // ============================================================================
  // Integration Test: Data Consistency
  // ============================================================================

  describe('Data Consistency', () => {
    it('maintains consistent data types in responses', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const mockOrderBy = jest.fn().mockResolvedValue(mockSiteSummaries)
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getNetworkOverview(mockDateRange)

      expect(result.success).toBe(true)
      if (result.success) {
        result.data.forEach((site) => {
          expect(typeof site.siteId).toBe('number')
          expect(typeof site.siteName).toBe('string')
          expect(typeof site.avgUploadSpeed).toBe('number')
          expect(typeof site.avgDownloadSpeed).toBe('number')
          expect(typeof site.allocatedBandwidth).toBe('number')
          expect(typeof site.utilizationPct).toBe('number')
          expect(typeof site.totalDataConsumed).toBe('number')
          expect(typeof site.consumptionPct).toBe('number')
          expect(typeof site.avgLatency).toBe('number')
          expect(['good', 'warning', 'critical']).toContain(site.status)
        })
      }
    })

    it('rounds numeric values to appropriate precision', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)

      const preciseData = [
        {
          ...mockSiteSummaries[0],
          avgUploadSpeed: 5.12345,
          avgDownloadSpeed: 8.98765,
        },
      ]

      const mockOrderBy = jest.fn().mockResolvedValue(preciseData)
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
      ;(db.select as jest.Mock).mockReturnValue({ from: mockFrom })

      const result = await getNetworkOverview(mockDateRange)

      expect(result.success).toBe(true)
      if (result.success && result.data.length > 0) {
        // Should be rounded to 2 decimal places
        const decimalPlaces = (n: number) => {
          const str = n.toString()
          const parts = str.split('.')
          return parts.length === 2 ? parts[1].length : 0
        }

        expect(decimalPlaces(result.data[0].avgUploadSpeed)).toBeLessThanOrEqual(
          2
        )
        expect(
          decimalPlaces(result.data[0].avgDownloadSpeed)
        ).toBeLessThanOrEqual(2)
      }
    })
  })
})
