"use client"

/**
 * @deprecated This component is deprecated. Use StyledDropdown instead for consistent styling across the project.
 * StyledDropdown provides the same functionality with better visual consistency and supports optgroups.
 */

import { ReactNode } from "react"

export interface SelectOption {
  value: string
  label: string | ReactNode
  disabled?: boolean
}

export interface SelectOptGroup {
  label: string
  options: SelectOption[]
}

interface StyledSelectProps {
  value: string
  onChange: (value: string) => void
  options?: SelectOption[]
  optgroups?: SelectOptGroup[]
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  name?: string
  "data-testid"?: string
}

export function StyledSelect({
  value,
  onChange,
  options = [],
  optgroups = [],
  placeholder,
  className = "",
  disabled = false,
  id,
  name,
  "data-testid": testId,
}: StyledSelectProps) {
  return (
    <select
      id={id}
      name={name}
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-cyan-400 focus:ring-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}

      {/* Render flat options if provided */}
      {options.length > 0 &&
        options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {typeof option.label === "string" ? option.label : String(option.label)}
          </option>
        ))}

      {/* Render optgroups if provided */}
      {optgroups.length > 0 &&
        optgroups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {typeof option.label === "string" ? option.label : String(option.label)}
              </option>
            ))}
          </optgroup>
        ))}
    </select>
  )
}
