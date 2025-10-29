import { notFound } from 'next/navigation'
import { getSiteById } from '@/app/actions/sites-actions'
import { SiteDetailHeader } from '@/components/dashboard/sites/site-detail-header'
import { SiteOverview } from '@/components/dashboard/sites/site-overview'
import { SiteAlerts } from '@/components/dashboard/sites/site-alerts'
import { SiteEquipment } from '@/components/dashboard/sites/site-equipment'
import { SiteCharts } from '@/components/dashboard/sites/site-charts'
import { SiteEnergyFlow } from '@/components/dashboard/sites/site-energy-flow'

type PageProps = {
  params: Promise<{ siteId: string }>
}

export default async function SiteDetailPage({ params }: PageProps) {
  const { siteId } = await params
  const id = parseInt(siteId, 10)

  if (isNaN(id)) {
    notFound()
  }

  const result = await getSiteById(id)

  if (!result.success || !result.site) {
    notFound()
  }

  const { site, latestTelemetry, activeAlerts, equipment, historicalData, weather } = result

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <SiteDetailHeader site={site} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <SiteOverview site={site} telemetry={latestTelemetry} />

          {/* Energy Flow */}
          {latestTelemetry && (
            <SiteEnergyFlow telemetry={latestTelemetry} />
          )}

          {/* Charts */}
          <SiteCharts
            siteId={id}
            historicalData={historicalData}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Alerts */}
          <SiteAlerts siteId={id} alerts={activeAlerts} />

          {/* Equipment */}
          <SiteEquipment siteId={id} equipment={equipment} />
        </div>
      </div>
    </div>
  )
}
