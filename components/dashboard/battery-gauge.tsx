'use client'

import { Battery } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BatteryGaugeProps {
  level: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  isCharging?: boolean
  className?: string
}

export function BatteryGauge({ level, size = 'md', showLabel = true, isCharging = false, className }: BatteryGaugeProps) {
  const clampedLevel = Math.max(0, Math.min(100, level))

  // Color coding based on charge level
  const getColor = () => {
    if (clampedLevel >= 60) return 'text-green-500'
    if (clampedLevel >= 20) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getStrokeColor = () => {
    if (clampedLevel >= 60) return '#10b981'
    if (clampedLevel >= 20) return '#f59e0b'
    return '#ef4444'
  }

  const sizes = {
    sm: { dimension: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { dimension: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { dimension: 160, strokeWidth: 10, fontSize: 'text-4xl' },
  }

  const { dimension, strokeWidth, fontSize } = sizes[size]
  const radius = (dimension - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedLevel / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: dimension, height: dimension }}>
        {/* Background circle */}
        <svg width={dimension} height={dimension} className="rotate-[-90deg]">
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted"
            opacity={0.2}
          />
          {/* Progress circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-1000 ease-in-out',
              isCharging && 'animate-pulse-glow'
            )}
            style={{
              filter: isCharging ? `drop-shadow(0 0 4px ${getStrokeColor()})` : undefined,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Battery className={cn('mb-1', getColor(), size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-6 w-6' : 'h-4 w-4')} />
          <span className={cn('font-bold', getColor(), fontSize)}>
            {Math.round(clampedLevel)}%
          </span>
        </div>

        {/* Charging indicator */}
        {isCharging && (
          <div className="absolute top-1 right-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
          </div>
        )}
      </div>

      {showLabel && (
        <span className="text-sm text-muted-foreground font-medium">
          Battery Charge
        </span>
      )}
    </div>
  )
}
