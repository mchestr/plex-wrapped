"use client"

import { useState } from "react"
import type { Condition } from "@/lib/validations/maintenance"

interface MultiTextInputProps {
  condition: Condition
  onChange: (condition: Condition) => void
}

export function MultiTextInput({
  condition,
  onChange,
}: MultiTextInputProps) {
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
