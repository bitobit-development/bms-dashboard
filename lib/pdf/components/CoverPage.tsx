/**
 * PDF Cover Page Component
 *
 * Professional cover page with branding, title, and date range.
 */

import React from 'react'
import { Page, Text, View } from '@react-pdf/renderer'
import { styles, colors } from '../styles'

interface CoverPageProps {
  dateRange: string
  totalSites: number
  generatedAt: Date
}

export const CoverPage: React.FC<CoverPageProps> = ({
  dateRange,
  totalSites,
  generatedAt,
}) => {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.coverContainer}>
        {/* Company/Product Name */}
        <Text
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: colors.primary,
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          BMS Dashboard
        </Text>

        {/* Report Title */}
        <View
          style={{
            width: '100%',
            height: 4,
            backgroundColor: colors.accent,
            marginBottom: 32,
          }}
        />

        <Text style={styles.coverTitle}>
          Network Usage Report
        </Text>

        {/* Date Range */}
        <Text style={styles.coverSubtitle}>
          {dateRange}
        </Text>

        {/* Site Count */}
        <Text
          style={{
            fontSize: 14,
            color: colors.text.secondary,
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          {totalSites} {totalSites === 1 ? 'Site' : 'Sites'} Included
        </Text>

        {/* Generated Date */}
        <Text
          style={{
            fontSize: 10,
            color: colors.text.muted,
            marginTop: 48,
          }}
        >
          Generated on {generatedAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })} at {generatedAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {/* Decorative Element */}
        <View
          style={{
            width: 100,
            height: 4,
            backgroundColor: colors.accent,
            marginTop: 32,
          }}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          BMS Dashboard - Network Analytics
        </Text>
        <Text style={styles.footerText}>
          Confidential
        </Text>
      </View>
    </Page>
  )
}
