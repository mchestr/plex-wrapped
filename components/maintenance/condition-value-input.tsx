"use client"

/**
 * Type-Specific Value Input Components
 *
 * Renders appropriate input controls based on field type and operator.
 */

import type { Condition } from "@/lib/validations/maintenance"
import type { FieldDefinition } from "@/lib/maintenance/field-registry"
import { StringInput } from "./inputs/StringInput"
import { NumberInput } from "./inputs/NumberInput"
import { DateInput } from "./inputs/DateInput"
import { RelativeDateInput } from "./inputs/RelativeDateInput"
import { DateRangeInput } from "./inputs/DateRangeInput"
import { RangeInput } from "./inputs/RangeInput"
import { BooleanToggle } from "./inputs/BooleanToggle"
import { MultiTextInput } from "./inputs/MultiTextInput"
import { SelectInput } from "./inputs/SelectInput"
import { MultiSelectInput } from "./inputs/MultiSelectInput"

interface ConditionValueInputProps {
  fieldDef: FieldDefinition
  condition: Condition
  onChange: (condition: Condition) => void
}

export function ConditionValueInput({ fieldDef, condition, onChange }: ConditionValueInputProps) {
  // No value needed for these operators
  if (
    condition.operator === 'null' ||
    condition.operator === 'notNull' ||
    condition.operator === 'isEmpty' ||
    condition.operator === 'isNotEmpty'
  ) {
    return (
      <div className="flex-1 px-3 py-2 text-sm text-slate-400 italic">
        no value needed
      </div>
    )
  }

  switch (fieldDef.type) {
    case 'string':
      if (condition.operator === 'in' || condition.operator === 'notIn') {
        return <MultiTextInput condition={condition} onChange={onChange} />
      }
      return <StringInput condition={condition} onChange={onChange} />

    case 'number':
      if (condition.operator === 'between') {
        return <RangeInput condition={condition} onChange={onChange} unit={fieldDef.unit} min={fieldDef.min} max={fieldDef.max} />
      }
      return <NumberInput condition={condition} onChange={onChange} unit={fieldDef.unit} min={fieldDef.min} max={fieldDef.max} />

    case 'date':
      if (condition.operator === 'olderThan' || condition.operator === 'newerThan') {
        return <RelativeDateInput condition={condition} onChange={onChange} />
      }
      if (condition.operator === 'between') {
        return <DateRangeInput condition={condition} onChange={onChange} />
      }
      return <DateInput condition={condition} onChange={onChange} />

    case 'boolean':
      return <BooleanToggle condition={condition} onChange={onChange} />

    case 'array':
      if (condition.operator === 'containsAny' || condition.operator === 'containsAll') {
        return <MultiTextInput condition={condition} onChange={onChange} />
      }
      return <StringInput condition={condition} onChange={onChange} placeholder="Enter value" />

    case 'enum':
      if (fieldDef.enumValues) {
        if (condition.operator === 'in' || condition.operator === 'notIn') {
          return <MultiSelectInput condition={condition} onChange={onChange} options={fieldDef.enumValues} />
        }
        return <SelectInput condition={condition} onChange={onChange} options={fieldDef.enumValues} />
      }
      return <StringInput condition={condition} onChange={onChange} />

    default:
      return <StringInput condition={condition} onChange={onChange} />
  }
}
