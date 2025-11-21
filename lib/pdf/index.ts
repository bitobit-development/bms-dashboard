/**
 * PDF Generation Module
 *
 * Exports for PDF document generation using react-pdf.
 */

export { NetworkUsageDocument } from './NetworkUsageDocument'
export { CoverPage } from './components/CoverPage'
export { ExecutiveSummary } from './components/ExecutiveSummary'
export { SiteDetailPage } from './components/SiteDetailPage'
export { styles, colors, getStatusColor, getStatusBadgeStyle } from './styles'
export type { PdfSiteData, PdfAggregateData } from './utils/dataTransform'
export {
  transformSiteData,
  calculateAggregateData,
  generateInsights,
  formatSpeed,
  formatLatency,
  formatDataGB,
  formatPercentage,
  formatDate,
  formatDateRange,
  formatLocation,
  calculateStatus,
  getStatusLabel,
} from './utils/dataTransform'
