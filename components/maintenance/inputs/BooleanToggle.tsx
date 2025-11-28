"use client"

import type { Condition } from "@/lib/validations/maintenance"
import { Button } from "@/components/ui/button"

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
      <Button
        type="button"
        onClick={() => onChange({ ...condition, value: true })}
        variant={value === true ? "success" : "secondary"}
        size="md"
        data-testid="boolean-toggle-true"
      >
        True
      </Button>
      <Button
        type="button"
        onClick={() => onChange({ ...condition, value: false })}
        variant={value === false ? "danger" : "secondary"}
        size="md"
        data-testid="boolean-toggle-false"
      >
        False
      </Button>
    </div>
  )
}
