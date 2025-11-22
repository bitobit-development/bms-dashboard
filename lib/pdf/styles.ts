/**
 * PDF Styles
 *
 * Shared styles for consistent branding across PDF exports.
 * Uses professional typography and brand colors.
 */

import { StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts (optional - we'll use built-in Helvetica)
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
// })

export const colors = {
  // Brand colors (from dashboard theme)
  primary: '#0f172a',      // slate-900
  secondary: '#334155',    // slate-700
  accent: '#3b82f6',       // blue-500
  success: '#10b981',      // green-500
  warning: '#f59e0b',      // amber-500
  critical: '#ef4444',     // red-500

  // Chart colors (Grafana-inspired)
  chart: {
    blue: '#5794f2',       // upload, avg
    green: '#73bf69',      // download, min
    red: '#f2495c',        // max, critical
    gray: '#8e8e8e',       // allocated, baseline
    purple: '#b877d9',     // secondary series
    orange: '#ff9830',     // tertiary series
  },

  // Text colors
  text: {
    primary: '#0f172a',    // slate-900
    secondary: '#64748b',  // slate-500
    muted: '#94a3b8',      // slate-400
    white: '#ffffff',
  },

  // Background colors
  bg: {
    white: '#ffffff',
    gray: '#f8fafc',       // slate-50
    lightGray: '#f1f5f9',  // slate-100
    border: '#e2e8f0',     // slate-200
  },
}

export const styles = StyleSheet.create({
  // Page layout
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.text.primary,
    backgroundColor: colors.bg.white,
  },

  pageWithHeader: {
    paddingTop: 80, // Space for header
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 40,
  },

  // Headers
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.primary,
  },

  subheader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: colors.secondary,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: colors.primary,
  },

  // Text
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.text.primary,
  },

  bodySecondary: {
    fontSize: 9,
    lineHeight: 1.4,
    color: colors.text.secondary,
  },

  label: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.text.muted,
    marginBottom: 2,
  },

  // Layout
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  column: {
    flexDirection: 'column',
  },

  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceBetween: {
    justifyContent: 'space-between',
  },

  // Containers
  section: {
    marginBottom: 20,
  },

  card: {
    padding: 16,
    backgroundColor: colors.bg.gray,
    borderRadius: 4,
    marginBottom: 12,
  },

  box: {
    padding: 12,
    backgroundColor: colors.bg.white,
    border: `1px solid ${colors.bg.border}`,
    borderRadius: 4,
    marginBottom: 8,
  },

  // Tables
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `1px solid ${colors.bg.border}`,
  },

  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: colors.bg.gray,
    borderBottom: `1px solid ${colors.bg.border}`,
  },

  tableCell: {
    fontSize: 9,
    color: colors.text.primary,
  },

  // Status badges
  badge: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 12,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  badgeGood: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },

  badgeWarning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },

  badgeCritical: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },

  // Metrics
  metricCard: {
    padding: 12,
    backgroundColor: colors.bg.white,
    border: `1px solid ${colors.bg.border}`,
    borderRadius: 4,
    marginRight: 8,
    flex: 1,
  },

  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },

  metricLabel: {
    fontSize: 8,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTop: `1px solid ${colors.bg.border}`,
  },

  footerText: {
    fontSize: 8,
    color: colors.text.muted,
  },

  // Cover page specific
  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  coverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },

  coverSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },

  // Dividers
  divider: {
    height: 1,
    backgroundColor: colors.bg.border,
    marginTop: 12,
    marginBottom: 12,
  },

  dividerThick: {
    height: 2,
    backgroundColor: colors.primary,
    marginTop: 16,
    marginBottom: 16,
  },

  // Chart styles
  chartContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.bg.gray,
    borderRadius: 4,
  },

  chartTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.primary,
  },

  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },

  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },

  chartLegendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },

  chartLegendText: {
    fontSize: 7,
    color: colors.text.secondary,
  },
})

// Helper function to get status color
export const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
  switch (status) {
    case 'good':
      return colors.success
    case 'warning':
      return colors.warning
    case 'critical':
      return colors.critical
    default:
      return colors.text.secondary
  }
}

// Helper function to get status badge style (merged with base badge)
export const getStatusBadgeStyle = (status: 'good' | 'warning' | 'critical') => {
  const baseStyle = styles.badge
  switch (status) {
    case 'good':
      return { ...baseStyle, ...styles.badgeGood }
    case 'warning':
      return { ...baseStyle, ...styles.badgeWarning }
    case 'critical':
      return { ...baseStyle, ...styles.badgeCritical }
    default:
      return baseStyle
  }
}
