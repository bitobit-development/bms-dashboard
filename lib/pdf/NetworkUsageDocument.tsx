/**
 * Network Usage PDF Document
 *
 * Main PDF document component that combines all pages.
 * Uses react-pdf to generate a professional multi-page PDF report.
 */

import React from 'react'
import { Document } from '@react-pdf/renderer'
import { CoverPage } from './components/CoverPage'
import { ExecutiveSummary } from './components/ExecutiveSummary'
import { SiteDetailPage } from './components/SiteDetailPage'
import type { PdfSiteData, PdfAggregateData } from './utils/dataTransform'

interface NetworkUsageDocumentProps {
  aggregateData: PdfAggregateData
  sites: PdfSiteData[]
  insights: string[]
  generatedAt: Date
}

export const NetworkUsageDocument: React.FC<NetworkUsageDocumentProps> = ({
  aggregateData,
  sites,
  insights,
  generatedAt,
}) => {
  return (
    <Document
      title={`Network Usage Report - ${aggregateData.dateRange}`}
      author="BMS Dashboard"
      subject="Network Usage Analytics"
      keywords="network, usage, metrics, analytics, performance"
      creator="BMS Dashboard"
      producer="BMS Dashboard"
    >
      {/* Cover Page */}
      <CoverPage
        dateRange={aggregateData.dateRange}
        totalSites={aggregateData.totalSites}
        generatedAt={generatedAt}
      />

      {/* Executive Summary */}
      <ExecutiveSummary
        aggregateData={aggregateData}
        insights={insights}
      />

      {/* Individual Site Pages */}
      {sites.map((siteData) => (
        <SiteDetailPage
          key={siteData.site.id}
          siteData={siteData}
        />
      ))}
    </Document>
  )
}
