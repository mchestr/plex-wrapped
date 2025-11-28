"use client"

import type { Condition } from "@/lib/validations/maintenance"
import { StyledDropdown } from "@/components/ui/styled-dropdown"

interface RelativeDateInputProps {
  condition: Condition
  onChange: (condition: Condition) => void
}

export function RelativeDateInput({
  condition,
  onChange,
}: RelativeDateInputProps) {
  const value = (condition.value as number) || 0
  const unit = condition.valueUnit || 'days'

  return (
    <div className="flex-1 flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange({ ...condition, value: parseInt(e.target.value) || 0 })}
        placeholder="Enter number"
        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        min="1"
      />
      <StyledDropdown
        value={unit}
        onChange={(value) => onChange({ ...condition, valueUnit: value as any })}
        options={[
          { value: 'days', label: 'days' },
          { value: 'months', label: 'months' },
          { value: 'years', label: 'years' },
        ]}
        size="md"
        className="w-28"
      />
      <span className="text-xs text-slate-400">ago</span>
    </div>
  )
}
