"use client"

import type { Condition } from "@/lib/validations/maintenance"

interface MultiSelectInputProps {
  condition: Condition
  onChange: (condition: Condition) => void
  options: Array<{ value: string; label: string }>
}

export function MultiSelectInput({
  condition,
  onChange,
  options,
}: MultiSelectInputProps) {
  const values = (condition.value as string[]) || []

  const toggleValue = (optValue: string) => {
    if (values.includes(optValue)) {
      onChange({ ...condition, value: values.filter(v => v !== optValue) })
    } else {
      onChange({ ...condition, value: [...values, optValue] })
    }
  }

  return (
    <div className="flex-1 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-600 rounded cursor-pointer hover:border-slate-500 transition-colors"
          >
            <input
              type="checkbox"
              checked={values.includes(opt.value)}
              onChange={() => toggleValue(opt.value)}
              className="rounded border-slate-600 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm text-white">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
