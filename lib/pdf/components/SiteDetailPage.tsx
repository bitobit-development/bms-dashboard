/**
 * PDF Site Detail Page Component
 *
 * Individual page for each site with metrics tables and summary.
 */

import React from 'react'
import { Page, Text, View } from '@react-pdf/renderer'
import { styles, colors, getStatusBadgeStyle } from '../styles'
import { getStatusLabel } from '../utils/dataTransform'
import type { PdfSiteData } from '../utils/dataTransform'
import { SimpleLineChart, Sparkline } from './charts'

interface SiteDetailPageProps {
  siteData: PdfSiteData
}

export const SiteDetailPage: React.FC<SiteDetailPageProps> = ({ siteData }) => {
  const { site, summary, speedData, latencyData, consumptionData } = siteData

  return (
    <Page size="A4" style={styles.page} wrap>
      {/* Site Header */}
      <View wrap={false} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.header}>{site.name}</Text>
          <Text style={styles.bodySecondary}>
            {site.location} • Allocated: {site.allocatedBandwidth} Mbps
          </Text>
        </View>

        <View style={getStatusBadgeStyle(summary.status)}>
          <Text>{getStatusLabel(summary.status)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Summary Metrics Grid */}
      <View wrap={false}>
        <Text style={styles.sectionTitle}>Performance Summary</Text>

        <View style={{ flexDirection: 'row', marginBottom: 12, gap: 8 }}>
          <View style={styles.metricCard}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
              {summary.avgUploadSpeed}
            </Text>
            <Text style={styles.metricLabel}>Avg Upload</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
              {summary.avgDownloadSpeed}
            </Text>
            <Text style={styles.metricLabel}>Avg Download</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
              {summary.avgLatency}
            </Text>
            <Text style={styles.metricLabel}>Avg Latency</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 12, gap: 8 }}>
          <View style={styles.metricCard}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
              {summary.utilizationPct}
            </Text>
            <Text style={styles.metricLabel}>Utilization</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
              {summary.totalDataConsumed}
            </Text>
            <Text style={styles.metricLabel}>Data Consumed</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
              {summary.consumptionPct}
            </Text>
            <Text style={styles.metricLabel}>Consumption %</Text>
          </View>
        </View>
      </View>

      {/* Speed Metrics Table */}
      <View style={styles.divider} />

      <View wrap={false}>
        <Text style={styles.sectionTitle}>Speed Metrics</Text>
      </View>

      <View style={styles.box} wrap={false}>
        {/* Speed Trend Chart */}
        {speedData.length > 1 && (
          <View style={{ marginBottom: 12 }}>
            <SimpleLineChart
              labels={speedData.map(d => d.date)}
              series={[
                { name: 'Upload', data: speedData.map(d => parseFloat(d.upload) || 0), color: colors.chart.blue },
                { name: 'Download', data: speedData.map(d => parseFloat(d.download) || 0), color: colors.chart.green },
              ]}
              width={470}
              height={80}
              showLegend={true}
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          <Text style={{ ...styles.label, fontSize: 9 }}>Peak Upload: {summary.peakUploadSpeed}</Text>
          <Text style={{ ...styles.label, fontSize: 9, marginLeft: 16 }}>Peak Download: {summary.peakDownloadSpeed}</Text>
        </View>

        {speedData.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader} wrap={false}>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Month</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: 'right' }}>Upload (Mbps)</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: 'right' }}>Download (Mbps)</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: 'right' }}>Allocated (Mbps)</Text>
            </View>
            {speedData.slice(0, 5).map((row, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
                <Text style={{ ...styles.tableCell, flex: 2 }}>{row.date}</Text>
                <Text style={{ ...styles.tableCell, flex: 2, textAlign: 'right' }}>{row.upload}</Text>
                <Text style={{ ...styles.tableCell, flex: 2, textAlign: 'right' }}>{row.download}</Text>
                <Text style={{ ...styles.tableCell, flex: 2, textAlign: 'right' }}>{row.allocated}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.bodySecondary}>No speed data available for this period.</Text>
        )}
      </View>

      {/* Latency Metrics Table */}
      <View wrap={false}>
        <Text style={styles.sectionTitle}>Latency Metrics</Text>
      </View>

      <View style={styles.box} wrap={false}>
        {/* Latency Trend Chart */}
        {latencyData.length > 1 && (
          <View style={{ marginBottom: 12 }}>
            <SimpleLineChart
              labels={latencyData.map(d => d.date)}
              series={[
                { name: 'Avg', data: latencyData.map(d => parseFloat(d.avg) || 0), color: colors.chart.blue },
                { name: 'Min', data: latencyData.map(d => parseFloat(d.min) || 0), color: colors.chart.green, dashed: true },
                { name: 'Max', data: latencyData.map(d => parseFloat(d.max) || 0), color: colors.chart.red, dashed: true },
              ]}
              width={470}
              height={80}
              showLegend={true}
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          <Text style={{ ...styles.label, fontSize: 9 }}>Min: {summary.minLatency}</Text>
          <Text style={{ ...styles.label, fontSize: 9, marginLeft: 16 }}>Max: {summary.maxLatency}</Text>
        </View>

        {latencyData.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader} wrap={false}>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Month</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: 'right' }}>Avg (ms)</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: 'right' }}>Min (ms)</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: 'right' }}>Max (ms)</Text>
            </View>
            {latencyData.slice(0, 5).map((row, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
                <Text style={{ ...styles.tableCell, flex: 2 }}>{row.date}</Text>
                <Text style={{ ...styles.tableCell, flex: 2, textAlign: 'right' }}>{row.avg}</Text>
                <Text style={{ ...styles.tableCell, flex: 2, textAlign: 'right' }}>{row.min}</Text>
                <Text style={{ ...styles.tableCell, flex: 2, textAlign: 'right' }}>{row.max}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.bodySecondary}>No latency data available for this period.</Text>
        )}
      </View>

      {/* Data Consumption Table */}
      <View wrap={false}>
        <Text style={styles.sectionTitle}>Data Consumption</Text>
      </View>

      <View style={styles.box} wrap={false}>
        {consumptionData.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader} wrap={false}>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Month</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: 'right' }}>Consumed (GB)</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2, textAlign: 'right' }}>Allowance (GB)</Text>
            </View>
            {consumptionData.slice(0, 5).map((row, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
                <Text style={{ ...styles.tableCell, flex: 2 }}>{row.date}</Text>
                <Text style={{ ...styles.tableCell, flex: 2, textAlign: 'right' }}>{row.consumed}</Text>
                <Text style={{ ...styles.tableCell, flex: 2, textAlign: 'right' }}>{row.allowance}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.bodySecondary}>No consumption data available for this period.</Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{site.name}</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </View>
    </Page>
  )
}
