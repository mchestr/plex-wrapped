"use client"

import type { Condition } from "@/lib/validations/maintenance"

interface RangeInputProps {
  condition: Condition
  onChange: (condition: Condition) => void
  unit?: string
}

export function RangeInput({
  condition,
  onChange,
  unit,
}: RangeInputProps) {
  const values = (condition.value as number[]) || [0, 0]
  const [min, max] = values

  const convertToStorage = (displayValue: number): number => {
    if (unit === 'bytes') {
      return displayValue * 1024 * 1024 * 1024 // GB to bytes
    } else if (unit === 'kbps') {
      return displayValue * 1000 // Mbps to kbps
    }
    return displayValue
  }

  const convertToDisplay = (storageValue: number): number => {
    if (unit === 'bytes') {
      return storageValue / (1024 * 1024 * 1024) // bytes to GB
    } else if (unit === 'kbps') {
      return storageValue / 1000 // kbps to Mbps
    }
    return storageValue
  }

  const handleMinChange = (value: string) => {
    const num = parseFloat(value) || 0
    onChange({ ...condition, value: [convertToStorage(num), max] })
  }

  const handleMaxChange = (value: string) => {
    const num = parseFloat(value) || 0
    onChange({ ...condition, value: [min, convertToStorage(num)] })
  }

  return (
    <div className="flex-1 flex items-center gap-2">
      <input
        type="number"
        value={convertToDisplay(min)}
        onChange={(e) => handleMinChange(e.target.value)}
        placeholder="Min"
        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        step="any"
      />
      <span className="text-slate-400">to</span>
      <input
        type="number"
        value={convertToDisplay(max)}
        onChange={(e) => handleMaxChange(e.target.value)}
        placeholder="Max"
        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        step="any"
      />
      {unit && (
        <span className="text-xs text-slate-400">
          {unit === 'bytes' ? 'GB' : unit === 'kbps' ? 'Mbps' : unit === 'minutes' ? 'min' : ''}
        </span>
      )}
    </div>
  )
}
