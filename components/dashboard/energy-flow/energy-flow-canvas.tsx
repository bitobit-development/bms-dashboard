'use client'

import { useEffect, useState, useRef } from 'react'
import { FlowParticle } from './flow-particle'
import { EnergyFlow } from './types'

interface Particle {
  id: string
  type: EnergyFlow['type']
  power: number
  delay: number
}

interface EnergyFlowCanvasProps {
  flows: EnergyFlow[]
  isPaused?: boolean
}

const MAX_PARTICLES = 30

export function EnergyFlowCanvas({ flows, isPaused = false }: EnergyFlowCanvasProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    const generateParticles = () => {
      const activeFlows = flows.filter((f) => f.isActive && f.power > 0.1)

      if (activeFlows.length === 0) return

      const newParticles: Particle[] = []

      activeFlows.forEach((flow) => {
        // Generate 1-3 particles based on power level
        const particleCount = Math.max(1, Math.min(3, Math.ceil(flow.power / 10)))

        for (let i = 0; i < particleCount; i++) {
          newParticles.push({
            id: crypto.randomUUID(),
            type: flow.type,
            power: flow.power,
            delay: i * 300, // Stagger particles by 300ms
          })
        }
      })

      setParticles((prev) => {
        const combined = [...prev, ...newParticles]
        // Keep only the latest MAX_PARTICLES
        return combined.slice(-MAX_PARTICLES)
      })
    }

    // Generate particles every 1.5 seconds
    intervalRef.current = setInterval(generateParticles, 1500)

    // Generate initial particles immediately
    generateParticles()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [flows, isPaused])

  const handleParticleComplete = (id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {particles.map((particle) => (
        <FlowParticle
          key={particle.id}
          type={particle.type}
          power={particle.power}
          delay={particle.delay}
          onComplete={() => handleParticleComplete(particle.id)}
        />
      ))}
    </svg>
  )
}
