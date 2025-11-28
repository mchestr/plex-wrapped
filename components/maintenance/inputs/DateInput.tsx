"use client"

import type { Condition } from "@/lib/validations/maintenance"

interface DateInputProps {
  condition: Condition
  onChange: (condition: Condition) => void
}

export function DateInput({
  condition,
  onChange,
}: DateInputProps) {
  return (
    <input
      type="date"
      value={(condition.value as string) || ''}
      onChange={(e) => onChange({ ...condition, value: e.target.value })}
      className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
    />
  )
}
