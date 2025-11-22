/**
 * PDF Executive Summary Component
 *
 * High-level overview with aggregate metrics and key insights.
 */

import React from 'react'
import { Page, Text, View } from '@react-pdf/renderer'
import { styles, colors } from '../styles'
import type { PdfAggregateData } from '../utils/dataTransform'
import { StackedBar } from './charts'

interface ExecutiveSummaryProps {
  aggregateData: PdfAggregateData
  insights: string[]
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  aggregateData,
  insights,
}) => {
  const { totalSites, dateRange, overallSummary } = aggregateData

  return (
    <Page size="A4" style={styles.page} wrap>
      {/* Header */}
      <View wrap={false}>
        <Text style={styles.header}>Executive Summary</Text>
        <Text style={styles.bodySecondary}>
          Network usage analysis for {totalSites} {totalSites === 1 ? 'site' : 'sites'} over the period: {dateRange}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Key Metrics Grid */}
      <View wrap={false}>
        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>

        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{overallSummary.avgUploadSpeed}</Text>
            <Text style={styles.metricLabel}>Avg Upload Speed</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{overallSummary.avgDownloadSpeed}</Text>
            <Text style={styles.metricLabel}>Avg Download Speed</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{overallSummary.avgLatency}</Text>
            <Text style={styles.metricLabel}>Avg Latency</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{overallSummary.totalDataConsumed}</Text>
            <Text style={styles.metricLabel}>Total Data Consumed</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{overallSummary.avgUtilizationPct}</Text>
            <Text style={styles.metricLabel}>Avg Utilization</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalSites}</Text>
            <Text style={styles.metricLabel}>Total Sites</Text>
          </View>
        </View>
      </View>

      {/* Site Health Status */}
      <View style={styles.divider} />

      <View wrap={false}>
        <Text style={styles.sectionTitle}>Site Health Distribution</Text>

        <View style={styles.card}>
          {/* Health Distribution Chart */}
          <StackedBar
            segments={[
              { value: overallSummary.healthySites, color: colors.success, label: 'Healthy' },
              { value: overallSummary.warningSites, color: colors.warning, label: 'Warning' },
              { value: overallSummary.criticalSites, color: colors.critical, label: 'Critical' },
            ]}
            height={20}
            width={450}
            showLegend={true}
          />

          {/* Health Summary Numbers */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: 16, marginTop: 12 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.success, marginBottom: 4 }}>
                {overallSummary.healthySites}
              </Text>
              <Text style={styles.label}>Healthy</Text>
            </View>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.warning, marginBottom: 4 }}>
                {overallSummary.warningSites}
              </Text>
              <Text style={styles.label}>Warning</Text>
            </View>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.critical, marginBottom: 4 }}>
                {overallSummary.criticalSites}
              </Text>
              <Text style={styles.label}>Critical</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Key Insights */}
      {insights.length > 0 && (
        <>
          <View style={styles.divider} />

          <View wrap={false}>
            <Text style={styles.sectionTitle}>Key Insights</Text>

            <View style={styles.card}>
              {insights.map((insight, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    marginBottom: index < insights.length - 1 ? 8 : 0,
                  }}
                >
                  <Text style={{ color: colors.accent, fontSize: 12, marginRight: 8 }}>•</Text>
                  <Text style={{ ...styles.body, flex: 1 }}>{insight}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Legend */}
      <View style={styles.divider} />

      <View wrap={false}>
        <Text style={styles.sectionTitle}>Report Guide</Text>

        <View style={styles.box}>
          <Text style={{ ...styles.body, marginBottom: 8 }}>
            This report provides detailed network usage metrics for each site, including:
          </Text>
          <View style={{ paddingLeft: 12 }}>
            <Text style={{ ...styles.bodySecondary, marginBottom: 4 }}>
              • Speed Metrics: Upload/download speeds compared to allocated bandwidth
            </Text>
            <Text style={{ ...styles.bodySecondary, marginBottom: 4 }}>
              • Latency Metrics: Network responsiveness and performance
            </Text>
            <Text style={{ ...styles.bodySecondary, marginBottom: 4 }}>
              • Data Consumption: Total data usage against allowances
            </Text>
            <Text style={{ ...styles.bodySecondary }}>
              • Status Indicators: Health classification based on utilization
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Executive Summary</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </View>
    </Page>
  )
}
