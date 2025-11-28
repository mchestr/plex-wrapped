"use client"

import type { Condition } from "@/lib/validations/maintenance"

interface NumberInputProps {
  condition: Condition
  onChange: (condition: Condition) => void
  unit?: string
  min?: number
  max?: number
}

export function NumberInput({
  condition,
  onChange,
  unit,
  min,
  max,
}: NumberInputProps) {
  const getPlaceholder = () => {
    if (unit === 'bytes') return 'Size in GB (e.g., 10)'
    if (unit === 'minutes') return 'Duration in minutes'
    if (unit === 'kbps') return 'Bitrate in Mbps'
    return 'Enter number'
  }

  const handleChange = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      onChange({ ...condition, value: null })
      return
    }

    // Convert display units to storage units
    let finalValue = num
    if (unit === 'bytes') {
      finalValue = num * 1024 * 1024 * 1024 // GB to bytes
    } else if (unit === 'kbps') {
      finalValue = num * 1000 // Mbps to kbps
    }

    onChange({ ...condition, value: finalValue })
  }

  const getDisplayValue = () => {
    const val = condition.value as number
    if (!val) return ''

    if (unit === 'bytes') {
      return (val / (1024 * 1024 * 1024)).toString()
    } else if (unit === 'kbps') {
      return (val / 1000).toString()
    }
    return val.toString()
  }

  return (
    <div className="flex-1 flex items-center gap-2">
      <input
        type="number"
        value={getDisplayValue()}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={getPlaceholder()}
        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        step="any"
        min={min}
        max={max}
      />
      {unit && (
        <span className="text-xs text-slate-400">
          {unit === 'bytes' ? 'GB' : unit === 'kbps' ? 'Mbps' : unit === 'minutes' ? 'min' : ''}
        </span>
      )}
    </div>
  )
}
