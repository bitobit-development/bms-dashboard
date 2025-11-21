/**
 * SimpleLineChart for PDF
 *
 * A line/area chart using react-pdf SVG primitives.
 * Used for speed trends and latency over time.
 */

import React from 'react'
import { View, Text, Svg, Path, Line, Circle } from '@react-pdf/renderer'
import { colors } from '../../styles'

export interface DataPoint {
  label: string
  value: number
}

export interface SeriesData {
  name: string
  data: number[]
  color: string
  dashed?: boolean
}

interface SimpleLineChartProps {
  labels: string[]
  series: SeriesData[]
  width?: number
  height?: number
  title?: string
  showGrid?: boolean
  showLegend?: boolean
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  labels,
  series,
  width = 280,
  height = 80,
  title,
  showGrid = true,
  showLegend = true,
}) => {
  const padding = { top: 10, right: 10, bottom: 20, left: 30 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Find min/max across all series
  const allValues = series.flatMap(s => s.data)
  const maxValue = Math.max(...allValues, 1)
  const minValue = Math.min(...allValues, 0)
  const valueRange = maxValue - minValue || 1

  // Generate path for a series
  const generatePath = (data: number[]): string => {
    if (data.length === 0) return ''

    const points = data.map((value, index) => {
      const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth
      const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight
      return { x, y }
    })

    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ')
  }

  // Generate Y-axis labels
  const yAxisLabels = [maxValue, (maxValue + minValue) / 2, minValue]

  return (
    <View style={{ marginBottom: 12 }}>
      {title && (
        <Text style={{
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 6,
          color: colors.text.primary,
        }}>
          {title}
        </Text>
      )}
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {showGrid && (
          <>
            {/* Horizontal grid lines */}
            {[0, 0.5, 1].map((ratio, i) => (
              <Line
                key={`h-${i}`}
                x1={padding.left}
                y1={padding.top + ratio * chartHeight}
                x2={width - padding.right}
                y2={padding.top + ratio * chartHeight}
                stroke={colors.bg.border}
                strokeWidth={0.5}
              />
            ))}
            {/* Vertical grid lines */}
            {labels.slice(0, Math.min(labels.length, 6)).map((_, i, arr) => {
              const x = padding.left + (i / Math.max(arr.length - 1, 1)) * chartWidth
              return (
                <Line
                  key={`v-${i}`}
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartHeight}
                  stroke={colors.bg.border}
                  strokeWidth={0.5}
                />
              )
            })}
          </>
        )}

        {/* Series lines */}
        {series.map((s, index) => (
          <Path
            key={index}
            d={generatePath(s.data)}
            stroke={s.color}
            strokeWidth={1.5}
            strokeDasharray={s.dashed ? '4 2' : undefined}
            fill="none"
          />
        ))}
      </Svg>

      {/* X-axis labels */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: padding.left,
        paddingRight: padding.right,
        marginTop: -16,
      }}>
        {labels.filter((_, i) => i === 0 || i === labels.length - 1).map((label, i) => (
          <Text key={i} style={{ fontSize: 6, color: colors.text.muted }}>
            {label}
          </Text>
        ))}
      </View>

      {/* Legend */}
      {showLegend && series.length > 1 && (
        <View style={{ flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' }}>
          {series.map((s, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 2,
                  backgroundColor: s.color,
                  marginRight: 4,
                }}
              />
              <Text style={{ fontSize: 7, color: colors.text.secondary }}>
                {s.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

/**
 * Mini sparkline chart for compact display
 */
interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 24,
  color = colors.accent,
}) => {
  if (data.length < 2) return null

  const maxValue = Math.max(...data, 1)
  const minValue = Math.min(...data, 0)
  const range = maxValue - minValue || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - minValue) / range) * height
    return { x, y }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  return (
    <Svg width={width} height={height}>
      <Path d={pathD} stroke={color} strokeWidth={1} fill="none" />
    </Svg>
  )
}
