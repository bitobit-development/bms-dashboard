import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EnergyFlowDiagram } from '@/components/dashboard/energy-flow-arrows/energy-flow-diagram'
import type { TelemetryReading } from '@/src/db/schema'

type SiteEnergyFlowProps = {
  telemetry: TelemetryReading
}

export const SiteEnergyFlow = ({ telemetry }: SiteEnergyFlowProps) => {
  // Transform telemetry data to match EnergyFlowDiagram expected format
  const energyFlowData = {
    solarPowerKw: telemetry.solarPowerKw || 0,
    batteryPowerKw: telemetry.batteryPowerKw || 0, // negative = charging, positive = discharging
    loadPowerKw: telemetry.loadPowerKw || 0,
    gridImportKw: (telemetry.gridPowerKw || 0) > 0 ? (telemetry.gridPowerKw || 0) : 0,
    gridExportKw: (telemetry.gridPowerKw || 0) < 0 ? Math.abs(telemetry.gridPowerKw || 0) : 0,
    batteryChargeLevel: telemetry.batteryChargeLevel || 0,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <EnergyFlowDiagram telemetry={energyFlowData} />
      </CardContent>
    </Card>
  )
}
