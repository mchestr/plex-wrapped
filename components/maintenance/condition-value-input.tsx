"use client"

/**
 * Type-Specific Value Input Components
 *
 * Renders appropriate input controls based on field type and operator.
 */

import { useState } from "react"
import type { Condition } from "@/lib/validations/maintenance"
import type { FieldDefinition } from "@/lib/maintenance/field-registry"
import { StyledDropdown } from "@/components/ui/styled-dropdown"

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
        return <RangeInput condition={condition} onChange={onChange} unit={fieldDef.unit} />
      }
      return <NumberInput condition={condition} onChange={onChange} unit={fieldDef.unit} />

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

// String Input
function StringInput({
  condition,
  onChange,
  placeholder = "Enter value",
}: {
  condition: Condition
  onChange: (condition: Condition) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={(condition.value as string) || ''}
      onChange={(e) => onChange({ ...condition, value: e.target.value })}
      placeholder={placeholder}
      className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
    />
  )
}

// Number Input (with optional unit conversion display)
function NumberInput({
  condition,
  onChange,
  unit,
}: {
  condition: Condition
  onChange: (condition: Condition) => void
  unit?: string
}) {
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
      />
      {unit && (
        <span className="text-xs text-slate-400">
          {unit === 'bytes' ? 'GB' : unit === 'kbps' ? 'Mbps' : unit === 'minutes' ? 'min' : ''}
        </span>
      )}
    </div>
  )
}

// Range Input (for "between" operator)
function RangeInput({
  condition,
  onChange,
  unit,
}: {
  condition: Condition
  onChange: (condition: Condition) => void
  unit?: string
}) {
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

// Date Input
function DateInput({
  condition,
  onChange,
}: {
  condition: Condition
  onChange: (condition: Condition) => void
}) {
  return (
    <input
      type="date"
      value={(condition.value as string) || ''}
      onChange={(e) => onChange({ ...condition, value: e.target.value })}
      className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
    />
  )
}

// Date Range Input
function DateRangeInput({
  condition,
  onChange,
}: {
  condition: Condition
  onChange: (condition: Condition) => void
}) {
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

// Relative Date Input (for olderThan/newerThan)
function RelativeDateInput({
  condition,
  onChange,
}: {
  condition: Condition
  onChange: (condition: Condition) => void
}) {
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

// Boolean Toggle
function BooleanToggle({
  condition,
  onChange,
}: {
  condition: Condition
  onChange: (condition: Condition) => void
}) {
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

// Multi-Text Input (for arrays of strings)
function MultiTextInput({
  condition,
  onChange,
}: {
  condition: Condition
  onChange: (condition: Condition) => void
}) {
  const [input, setInput] = useState('')
  const values = (condition.value as string[]) || []

  const addValue = () => {
    if (input.trim()) {
      onChange({ ...condition, value: [...values, input.trim()] })
      setInput('')
    }
  }

  const removeValue = (index: number) => {
    onChange({ ...condition, value: values.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex-1 space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
          placeholder="Type and press Enter"
          className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          type="button"
          onClick={addValue}
          className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition-colors"
        >
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-xs text-white"
            >
              {value}
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Select Input (for enum types)
function SelectInput({
  condition,
  onChange,
  options,
}: {
  condition: Condition
  onChange: (condition: Condition) => void
  options: Array<{ value: string; label: string }>
}) {
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

// Multi-Select Input (for enum arrays)
function MultiSelectInput({
  condition,
  onChange,
  options,
}: {
  condition: Condition
  onChange: (condition: Condition) => void
  options: Array<{ value: string; label: string }>
}) {
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
