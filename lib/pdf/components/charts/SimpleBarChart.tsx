/**
 * SimpleBarChart for PDF
 *
 * A horizontal bar chart using react-pdf primitives.
 * Used for health distribution and comparison charts.
 */

import React from 'react'
import { View, Text, Svg, Rect } from '@react-pdf/renderer'
import { colors } from '../../styles'

export interface BarDataItem {
  label: string
  value: number
  color?: string
}

interface SimpleBarChartProps {
  data: BarDataItem[]
  maxValue?: number
  height?: number
  showLabels?: boolean
  showValues?: boolean
  title?: string
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  maxValue,
  height = 120,
  showLabels = true,
  showValues = true,
  title,
}) => {
  const calculatedMax = maxValue || Math.max(...data.map(d => d.value), 1)
  const barHeight = Math.min(20, (height - 20) / data.length - 4)
  const chartWidth = 300
  const labelWidth = showLabels ? 80 : 0
  const valueWidth = showValues ? 50 : 0
  const barAreaWidth = chartWidth - labelWidth - valueWidth

  return (
    <View style={{ marginBottom: 12 }}>
      {title && (
        <Text style={{
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 8,
          color: colors.text.primary,
        }}>
          {title}
        </Text>
      )}
      <View style={{ width: chartWidth }}>
        {data.map((item, index) => {
          const barWidth = (item.value / calculatedMax) * barAreaWidth
          const barColor = item.color || colors.accent

          return (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
                height: barHeight,
              }}
            >
              {showLabels && (
                <Text style={{
                  width: labelWidth,
                  fontSize: 8,
                  color: colors.text.secondary,
                  paddingRight: 4,
                }}>
                  {item.label}
                </Text>
              )}
              <Svg width={barAreaWidth} height={barHeight}>
                {/* Background bar */}
                <Rect
                  x={0}
                  y={0}
                  width={barAreaWidth}
                  height={barHeight}
                  fill={colors.bg.lightGray}
                  rx={2}
                />
                {/* Value bar */}
                <Rect
                  x={0}
                  y={0}
                  width={Math.max(barWidth, 2)}
                  height={barHeight}
                  fill={barColor}
                  rx={2}
                />
              </Svg>
              {showValues && (
                <Text style={{
                  width: valueWidth,
                  fontSize: 8,
                  color: colors.text.primary,
                  paddingLeft: 4,
                  textAlign: 'right',
                }}>
                  {item.value.toLocaleString()}
                </Text>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

/**
 * Horizontal stacked bar for percentages (e.g., health distribution)
 */
interface StackedBarProps {
  segments: { value: number; color: string; label?: string }[]
  height?: number
  width?: number
  showLegend?: boolean
}

export const StackedBar: React.FC<StackedBarProps> = ({
  segments,
  height = 16,
  width = 300,
  showLegend = true,
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) return null

  let currentX = 0

  return (
    <View>
      <Svg width={width} height={height}>
        {segments.map((segment, index) => {
          const segmentWidth = (segment.value / total) * width
          const x = currentX
          currentX += segmentWidth

          return (
            <Rect
              key={index}
              x={x}
              y={0}
              width={Math.max(segmentWidth, 0)}
              height={height}
              fill={segment.color}
              rx={index === 0 ? 4 : 0}
              ry={index === 0 ? 4 : 0}
            />
          )
        })}
      </Svg>
      {showLegend && (
        <View style={{ flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' }}>
          {segments.map((segment, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 12,
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: segment.color,
                  borderRadius: 2,
                  marginRight: 4,
                }}
              />
              <Text style={{ fontSize: 8, color: colors.text.secondary }}>
                {segment.label || ''} ({segment.value})
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
