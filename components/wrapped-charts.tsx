"use client"

import { motion } from "framer-motion"

interface BarChartProps {
  data: Array<{ label: string; value: number }>
  maxValue?: number
  color?: string
  height?: number
  delay?: number
  formatAsTime?: boolean
  disableAnimations?: boolean
}

export function BarChart({ data, maxValue, color = "cyan", height = 180, delay = 0, formatAsTime = false, disableAnimations = false }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1)
  const colors = {
    cyan: "from-cyan-400 to-cyan-600",
    purple: "from-purple-400 to-purple-600",
    pink: "from-pink-400 to-pink-600",
  }
  const gradient = colors[color as keyof typeof colors] || colors.cyan

  // Format value for display
  const formatValue = (value: number): string => {
    if (value === 0) return "0"

    // Format as watch time (minutes) rounded to nearest hour
    if (formatAsTime) {
      // Round to nearest hour
      const hours = Math.round(value / 60)
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24

      const parts: string[] = []
      if (days > 0) parts.push(`${days}d`)
      if (remainingHours > 0) parts.push(`${remainingHours}h`)

      return parts.join(" ") || "0h"
    }

    // Default numeric format
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return value.toFixed(0)
  }

  return (
    <div className="flex items-end justify-center gap-1.5 h-[180px] relative">
      {data.map((item, idx) => {
        const percentage = max > 0 ? (item.value / max) * 100 : 0
        // Calculate bar height in pixels (chart height is 180px)
        // Ensure minimum height for visibility (at least 12px for non-zero values)
        const barHeightPx = item.value > 0
          ? Math.max((percentage / 100) * height, 12)
          : 0

        return (
          <div
            key={idx}
            className="flex flex-col items-center flex-1 group relative"
            style={{ height: `${height}px` }}
          >
            {/* Spacer to push bar to bottom */}
            <div style={{ flex: 1, minHeight: 0 }} />
            {/* Bar container */}
            {formatAsTime || disableAnimations ? (
              <div
                className="w-full relative"
                style={{ height: `${barHeightPx}px` }}
              >
                <div
                  className={`w-full h-full bg-gradient-to-t ${gradient} rounded-t-md relative overflow-hidden`}
                />
              </div>
            ) : (
              <motion.div
                className="w-full relative"
                style={{ height: `${barHeightPx}px` }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{
                  delay: delay + idx * 0.15,
                  duration: 1.5,
                  type: "spring",
                  stiffness: 60,
                }}
              >
                <div
                  className={`w-full h-full bg-gradient-to-t ${gradient} rounded-t-md relative overflow-hidden transition-all`}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    animate={{
                      y: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                      delay: delay + idx * 0.15,
                    }}
                  />
                </div>
              </motion.div>
            )}
            {/* Month label and value on x-axis */}
            <div className="flex flex-col items-center mt-1">
              {formatAsTime || disableAnimations ? (
                <>
                  <span className="text-xs text-slate-400">
                    {item.label.slice(0, 3)}
                  </span>
                  {item.value > 0 && (
                    <span className="text-xs font-semibold text-cyan-300 mt-0.5">
                      {formatValue(item.value)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <motion.span
                    className="text-xs text-slate-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: delay + idx * 0.15 + 0.6 }}
                  >
                    {item.label.slice(0, 3)}
                  </motion.span>
                  {item.value > 0 && (
                    <motion.span
                      className="text-xs font-semibold text-cyan-300 mt-0.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: delay + idx * 0.15 + 0.9 }}
                    >
                      {formatValue(item.value)}
                    </motion.span>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface DonutChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  size?: number
  strokeWidth?: number
  delay?: number
}

export function DonutChart({ data, size = 120, strokeWidth = 12, delay = 0 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return null

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let currentOffset = 0
  const segments = data.map((item, idx) => {
    const percentage = item.value / total
    const strokeDasharray = circumference * percentage
    const strokeDashoffset = circumference - currentOffset
    const color = item.color || (idx === 0 ? "cyan" : idx === 1 ? "purple" : "pink")

    const result = {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      color,
      percentage,
    }
    currentOffset += strokeDasharray
    return result
  })

  const defaultColors = {
    cyan: "#22d3ee",
    purple: "#a855f7",
    pink: "#ec4899",
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((segment, idx) => (
          <motion.circle
            key={idx}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={defaultColors[segment.color as keyof typeof defaultColors] || defaultColors.cyan}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: segment.strokeDashoffset }}
            transition={{
              delay: delay + idx * 0.1,
              duration: 1,
              type: "spring",
              stiffness: 100,
            }}
          />
        ))}
      </svg>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.5 }}
      >
        <div className="text-2xl font-bold text-white">
          {Math.round((segments[0]?.percentage || 0) * 100)}%
        </div>
        <div className="text-xs text-slate-400">{segments[0]?.label}</div>
      </motion.div>
    </div>
  )
}

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  delay?: number
}

export function Sparkline({ data, width = 200, height = 40, color = "cyan", delay = 0 }: SparklineProps) {
  if (data.length === 0) return null

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const points = data.map((value, idx) => {
    const x = (idx / (data.length - 1 || 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(" ")

  const colors = {
    cyan: "#22d3ee",
    purple: "#a855f7",
    pink: "#ec4899",
  }
  const strokeColor = colors[color as keyof typeof colors] || colors.cyan

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            delay,
            duration: 1.5,
            ease: "easeInOut",
          }}
        />
        <motion.polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={`url(#sparkline-gradient-${color})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: delay + 0.3,
            duration: 1,
          }}
        />
      </svg>
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  color?: string
  height?: number
  delay?: number
  showValue?: boolean
}

export function ProgressBar({
  value,
  max,
  label,
  color = "cyan",
  height = 8,
  delay = 0,
  showValue = false
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

  const colors = {
    cyan: "from-cyan-400 to-cyan-600",
    purple: "from-purple-400 to-purple-600",
    pink: "from-pink-400 to-pink-600",
  }
  const gradient = colors[color as keyof typeof colors] || colors.cyan

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showValue && (
            <span className="text-sm font-semibold text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className="relative bg-slate-700/50 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <motion.div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            delay,
            duration: 1,
            type: "spring",
            stiffness: 100,
          }}
        >
          <motion.div
            className="absolute inset-0 bg-white/30"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay,
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}

