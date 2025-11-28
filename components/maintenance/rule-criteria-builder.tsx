"use client"

import { useState } from "react"
import type { RuleCriteria } from "@/types/maintenance"
import { StyledInput } from "@/components/ui/styled-input"
import { StyledDropdown } from "@/components/ui/styled-dropdown"
import { StyledCheckbox } from "@/components/ui/styled-checkbox"

interface RuleCriteriaBuilderProps {
  value: RuleCriteria
  onChange: (criteria: RuleCriteria) => void
  libraryOptions?: Array<{ id: string; name: string }>
}

const TIME_UNITS = [
  { value: "days", label: "Days" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
]

const SIZE_UNITS = [
  { value: "MB", label: "MB" },
  { value: "GB", label: "GB" },
  { value: "TB", label: "TB" },
]

export function RuleCriteriaBuilder({
  value,
  onChange,
  libraryOptions = [],
}: RuleCriteriaBuilderProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateCriteria = (updates: Partial<RuleCriteria>) => {
    onChange({ ...value, ...updates })
  }

  const toggleNeverWatched = (checked: boolean) => {
    updateCriteria({ neverWatched: checked || undefined })
  }

  const updateLastWatchedBefore = (field: "value" | "unit", val: string | number) => {
    const current = value.lastWatchedBefore || { value: 30, unit: "days" as const }
    updateCriteria({
      lastWatchedBefore: {
        ...current,
        [field]: field === "value" ? Number(val) : val,
      },
    })
  }

  const clearLastWatchedBefore = () => {
    updateCriteria({ lastWatchedBefore: undefined })
  }

  const updateAddedBefore = (field: "value" | "unit", val: string | number) => {
    const current = value.addedBefore || { value: 365, unit: "days" as const }
    updateCriteria({
      addedBefore: {
        ...current,
        [field]: field === "value" ? Number(val) : val,
      },
    })
  }

  const clearAddedBefore = () => {
    updateCriteria({ addedBefore: undefined })
  }

  const updateMinFileSize = (field: "value" | "unit", val: string | number) => {
    const current = value.minFileSize || { value: 1, unit: "GB" as const }
    updateCriteria({
      minFileSize: {
        ...current,
        [field]: field === "value" ? Number(val) : val,
      },
    })
  }

  const clearMinFileSize = () => {
    updateCriteria({ minFileSize: undefined })
  }

  const updateMaxPlayCount = (val: string) => {
    const num = parseInt(val)
    updateCriteria({ maxPlayCount: isNaN(num) ? undefined : num })
  }

  const updateMaxQuality = (val: string) => {
    updateCriteria({ maxQuality: val || undefined })
  }

  const updateMaxRating = (val: string) => {
    const num = parseFloat(val)
    updateCriteria({ maxRating: isNaN(num) ? undefined : num })
  }

  const updateLibraryIds = (libraryId: string, checked: boolean) => {
    const current = value.libraryIds || []
    if (checked) {
      updateCriteria({ libraryIds: [...current, libraryId] })
    } else {
      updateCriteria({ libraryIds: current.filter((id) => id !== libraryId) })
    }
  }

  const toggleOperator = () => {
    updateCriteria({ operator: value.operator === "AND" ? "OR" : "AND" })
  }

  return (
    <div className="space-y-6">
      {/* Operator Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700">
        <div>
          <p className="text-sm font-medium text-white">Match Criteria</p>
          <p className="text-xs text-slate-400 mt-1">
            {value.operator === "AND"
              ? "All criteria must match"
              : "Any criteria can match"}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleOperator}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            value.operator === "AND"
              ? "bg-cyan-600 hover:bg-cyan-700 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          {value.operator}
        </button>
      </div>

      {/* Basic Criteria */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white">Basic Criteria</h3>

        {/* Never Watched */}
        <div className="flex items-center gap-3">
          <StyledCheckbox
            id="neverWatched"
            checked={value.neverWatched || false}
            onChange={(e) => toggleNeverWatched(e.target.checked)}
          />
          <label htmlFor="neverWatched" className="text-sm text-slate-200 cursor-pointer">
            Never watched
          </label>
        </div>

        {/* Last Watched Before */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-200">Last watched before</label>
            {value.lastWatchedBefore && (
              <button
                type="button"
                onClick={clearLastWatchedBefore}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <StyledInput
              type="number"
              min="1"
              placeholder="30"
              value={value.lastWatchedBefore?.value || ""}
              onChange={(e) => updateLastWatchedBefore("value", e.target.value)}
              className="flex-1"
            />
            <StyledDropdown
              value={value.lastWatchedBefore?.unit || "days"}
              onChange={(val) => updateLastWatchedBefore("unit", val)}
              options={TIME_UNITS}
              className="w-32"
            />
          </div>
        </div>

        {/* Max Play Count */}
        <div className="space-y-2">
          <label className="text-sm text-slate-200">Max play count</label>
          <StyledInput
            type="number"
            min="0"
            placeholder="e.g., 1"
            value={value.maxPlayCount ?? ""}
            onChange={(e) => updateMaxPlayCount(e.target.value)}
          />
          <p className="text-xs text-slate-400">
            Match items played this many times or fewer
          </p>
        </div>

        {/* Added Before */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-200">Added before</label>
            {value.addedBefore && (
              <button
                type="button"
                onClick={clearAddedBefore}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <StyledInput
              type="number"
              min="1"
              placeholder="365"
              value={value.addedBefore?.value || ""}
              onChange={(e) => updateAddedBefore("value", e.target.value)}
              className="flex-1"
            />
            <StyledDropdown
              value={value.addedBefore?.unit || "days"}
              onChange={(val) => updateAddedBefore("unit", val)}
              options={TIME_UNITS}
              className="w-32"
            />
          </div>
        </div>

        {/* Min File Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-200">Minimum file size</label>
            {value.minFileSize && (
              <button
                type="button"
                onClick={clearMinFileSize}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <StyledInput
              type="number"
              min="0"
              step="0.1"
              placeholder="1"
              value={value.minFileSize?.value || ""}
              onChange={(e) => updateMinFileSize("value", e.target.value)}
              className="flex-1"
            />
            <StyledDropdown
              value={value.minFileSize?.unit || "GB"}
              onChange={(val) => updateMinFileSize("unit", val)}
              options={SIZE_UNITS}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Advanced Criteria Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        Advanced Criteria
      </button>

      {/* Advanced Criteria */}
      {showAdvanced && (
        <div className="space-y-4 pl-6 border-l-2 border-slate-700">
          {/* Max Quality */}
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Max quality</label>
            <StyledInput
              type="text"
              placeholder="e.g., 720p, SD"
              value={value.maxQuality || ""}
              onChange={(e) => updateMaxQuality(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              Match items with this quality or lower
            </p>
          </div>

          {/* Max Rating */}
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Max rating</label>
            <StyledInput
              type="number"
              min="0"
              max="10"
              step="0.1"
              placeholder="e.g., 5.0"
              value={value.maxRating ?? ""}
              onChange={(e) => updateMaxRating(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              Match items rated this value or lower (0-10)
            </p>
          </div>

          {/* Library Selection */}
          {libraryOptions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Libraries</label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-900/50 rounded-lg">
                {libraryOptions.map((library) => (
                  <div key={library.id} className="flex items-center gap-3">
                    <StyledCheckbox
                      id={`library-${library.id}`}
                      checked={value.libraryIds?.includes(library.id) || false}
                      onChange={(e) => updateLibraryIds(library.id, e.target.checked)}
                    />
                    <label
                      htmlFor={`library-${library.id}`}
                      className="text-sm text-slate-200 cursor-pointer"
                    >
                      {library.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Leave empty to match all libraries
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
