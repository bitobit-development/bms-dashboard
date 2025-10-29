'use client'

import { useEffect, useState } from 'react'
import { EnergyFlowType, FLOW_COLORS, FLOW_PATHS } from './types'

interface FlowParticleProps {
  type: EnergyFlowType
  power: number
  delay?: number
  onComplete: () => void
}

function calculateDuration(power: number): number {
  // Speed ranges from 2s (low power) to 0.8s (high power)
  const minDuration = 0.8
  const maxDuration = 2
  const normalized = Math.min(power / 30, 1) // Normalize to 30kW max
  return maxDuration - normalized * (maxDuration - minDuration)
}

function getPathString(type: EnergyFlowType): string {
  const path = FLOW_PATHS[type]
  if (path.controlPoint) {
    return `M ${path.start.x} ${path.start.y} Q ${path.controlPoint.x} ${path.controlPoint.y} ${path.end.x} ${path.end.y}`
  }
  return `M ${path.start.x} ${path.start.y} L ${path.end.x} ${path.end.y}`
}

export function FlowParticle({ type, power, delay = 0, onComplete }: FlowParticleProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const color = FLOW_COLORS[type]
  const duration = calculateDuration(power)
  const pathString = getPathString(type)

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsAnimating(true)
    }, delay)

    const completeTimer = setTimeout(() => {
      onComplete()
    }, delay + duration * 1000)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(completeTimer)
    }
  }, [delay, duration, onComplete])

  if (!isAnimating) return null

  return (
    <>
      <defs>
        <path id={`path-${type}`} d={pathString} />
      </defs>
      <circle r="3" fill={color} opacity="0.8">
        <animateMotion
          dur={`${duration}s`}
          repeatCount="1"
          keyPoints="0;1"
          keyTimes="0;1"
          calcMode="linear"
        >
          <mpath href={`#path-${type}`} />
        </animateMotion>
        <animate
          attributeName="opacity"
          values="0;0.8;0.8;0"
          keyTimes="0;0.1;0.9;1"
          dur={`${duration}s`}
          repeatCount="1"
        />
      </circle>
    </>
  )
}
