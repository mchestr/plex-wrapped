"use client"

import type { Condition } from "@/lib/validations/maintenance"

interface DateRangeInputProps {
  condition: Condition
  onChange: (condition: Condition) => void
}

export function DateRangeInput({
  condition,
  onChange,
}: DateRangeInputProps) {
  const values = (condition.value as string[]) || ['', '']
  const [start, end] = values

  return (
    <div className="flex-1 flex items-center gap-2">
      <input
        type="date"
        value={start}
        onChange={(e) => onChange({ ...condition, value: [e.target.value, end] })}
        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      <span className="text-slate-400">to</span>
      <input
        type="date"
        value={end}
        onChange={(e) => onChange({ ...condition, value: [start, e.target.value] })}
        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
    </div>
  )
}
