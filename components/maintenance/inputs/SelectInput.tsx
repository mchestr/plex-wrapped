"use client"

import type { Condition } from "@/lib/validations/maintenance"
import { StyledDropdown } from "@/components/ui/styled-dropdown"

interface SelectInputProps {
  condition: Condition
  onChange: (condition: Condition) => void
  options: Array<{ value: string; label: string }>
}

export function SelectInput({
  condition,
  onChange,
  options,
}: SelectInputProps) {
  return (
    <div className="flex-1">
      <StyledDropdown
        value={(condition.value as string) || ''}
        onChange={(value) => onChange({ ...condition, value })}
        options={options}
        placeholder="Select..."
        size="md"
      />
    </div>
  )
}
