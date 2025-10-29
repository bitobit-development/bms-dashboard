import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { EnergyFlowDiagram } from '@/components/dashboard/energy-flow-arrows/energy-flow-diagram'
import type { TelemetryReading } from '@/src/db/schema'

type SiteEnergyFlowProps = {
  telemetry: TelemetryReading
}

export const SiteEnergyFlow = ({ telemetry }: SiteEnergyFlowProps) => {
  // Transform telemetry data to match EnergyFlowDiagram expected format
  // Derive grid import/export from gridPowerKw (positive = import, negative = export)
  const gridPower = telemetry.gridPowerKw || 0
  const gridImport = gridPower > 0 ? gridPower : 0
  const gridExport = gridPower < 0 ? Math.abs(gridPower) : 0

  const energyFlowData = {
    solarPowerKw: telemetry.solarPowerKw || 0,
    batteryPowerKw: telemetry.batteryPowerKw || 0, // negative = charging, positive = discharging
    loadPowerKw: telemetry.loadPowerKw || 0,
    gridImportKw: gridImport,
    gridExportKw: gridExport,
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
