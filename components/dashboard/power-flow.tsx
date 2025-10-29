'use client'

import { ArrowRight, Sun, Home, Zap, Battery } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PowerFlowProps {
  solarPowerKw: number
  batteryPowerKw: number
  loadPowerKw: number
  gridPowerKw: number
  className?: string
}

export function PowerFlow({
  solarPowerKw,
  batteryPowerKw,
  loadPowerKw,
  gridPowerKw,
  className,
}: PowerFlowProps) {
  const isGridImport = gridPowerKw > 0
  const isGridExport = gridPowerKw < 0
  const isBatteryCharging = batteryPowerKw > 0
  const isBatteryDischarging = batteryPowerKw < 0

  const PowerNode = ({ icon: Icon, label, power, color }: { icon: any; label: string; power: number; color: string }) => (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('rounded-full p-4 shadow-lg', color)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{Math.abs(power).toFixed(1)} kW</div>
      </div>
    </div>
  )

  const FlowArrow = ({ active, reverse }: { active: boolean; reverse?: boolean }) => (
    <div className={cn('flex items-center justify-center', reverse && 'rotate-180')}>
      <ArrowRight
        className={cn(
          'h-6 w-6 transition-all duration-300',
          active ? 'text-green-500 animate-pulse' : 'text-muted'
        )}
      />
    </div>
  )

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-8">
          {/* Top row: Solar */}
          <div className="flex justify-center">
            <PowerNode icon={Sun} label="Solar" power={solarPowerKw} color="bg-yellow-500" />
          </div>

          {/* Middle row: Battery and Grid */}
          <div className="flex justify-around items-center">
            <PowerNode
              icon={Battery}
              label={isBatteryCharging ? 'Charging' : isBatteryDischarging ? 'Discharging' : 'Battery'}
              power={batteryPowerKw}
              color={isBatteryCharging ? 'bg-purple-600' : isBatteryDischarging ? 'bg-orange-500' : 'bg-purple-500'}
            />

            <FlowArrow active={isBatteryCharging || isBatteryDischarging} />

            <PowerNode
              icon={Zap}
              label={isGridImport ? 'Grid Import' : isGridExport ? 'Grid Export' : 'Grid'}
              power={gridPowerKw}
              color={isGridImport ? 'bg-blue-500' : isGridExport ? 'bg-green-500' : 'bg-blue-400'}
            />
          </div>

          {/* Bottom row: Load */}
          <div className="flex flex-col items-center gap-2">
            <FlowArrow active={loadPowerKw > 0} />
            <PowerNode icon={Home} label="Load" power={loadPowerKw} color="bg-slate-600" />
          </div>
        </div>

        {/* Power flow summary */}
        <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Generation:</span>
            <span className="ml-2 font-semibold text-green-600">
              {solarPowerKw.toFixed(1)} kW
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Consumption:</span>
            <span className="ml-2 font-semibold text-red-600">
              {loadPowerKw.toFixed(1)} kW
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
