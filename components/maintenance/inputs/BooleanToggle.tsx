"use client"

import type { Condition } from "@/lib/validations/maintenance"

interface BooleanToggleProps {
  condition: Condition
  onChange: (condition: Condition) => void
}

export function BooleanToggle({
  condition,
  onChange,
}: BooleanToggleProps) {
  const value = condition.value as boolean

  return (
    <div className="flex-1 flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange({ ...condition, value: true })}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
          value === true
            ? 'bg-green-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        }`}
      >
        True
      </button>
      <button
        type="button"
        onClick={() => onChange({ ...condition, value: false })}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
          value === false
            ? 'bg-red-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        }`}
      >
        False
      </button>
    </div>
  )
}
