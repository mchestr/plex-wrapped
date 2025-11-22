"use client"

import { useState } from "react"
import { StyledDropdown } from "@/components/ui/styled-dropdown"

export interface UsersFilter {
  plexAccess: "all" | "yes" | "no" | "unknown"
  role: "all" | "admin" | "user"
  wrappedStatus: "all" | "completed" | "generating" | "failed" | "none"
}

interface UsersFilterProps {
  onFilterChange: (filter: UsersFilter) => void
  defaultFilter?: Partial<UsersFilter>
}

export function UsersFilter({ onFilterChange, defaultFilter }: UsersFilterProps) {
  const [filter, setFilter] = useState<UsersFilter>({
    plexAccess: defaultFilter?.plexAccess ?? "yes",
    role: defaultFilter?.role ?? "all",
    wrappedStatus: defaultFilter?.wrappedStatus ?? "all",
  })

  const updateFilter = (updates: Partial<UsersFilter>) => {
    const newFilter = { ...filter, ...updates }
    setFilter(newFilter)
    onFilterChange(newFilter)
  }

  const handleClear = () => {
    const clearedFilter: UsersFilter = {
      plexAccess: "yes",
      role: "all",
      wrappedStatus: "all",
    }
    setFilter(clearedFilter)
    onFilterChange(clearedFilter)
  }

  const hasActiveFilters = filter.plexAccess !== "yes" || filter.role !== "all" || filter.wrappedStatus !== "all"

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 mb-4 relative z-20">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative z-30">
            <label className="block text-xs text-slate-400 mb-1.5">Plex Access</label>
            <StyledDropdown
              value={filter.plexAccess}
              onChange={(value) => updateFilter({ plexAccess: value as UsersFilter["plexAccess"] })}
              options={[
                { value: "all", label: "All" },
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unknown", label: "Unknown" },
              ]}
              size="sm"
            />
          </div>
          <div className="relative z-30">
            <label className="block text-xs text-slate-400 mb-1.5">Role</label>
            <StyledDropdown
              value={filter.role}
              onChange={(value) => updateFilter({ role: value as UsersFilter["role"] })}
              options={[
                { value: "all", label: "All" },
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ]}
              size="sm"
            />
          </div>
          <div className="relative z-30">
            <label className="block text-xs text-slate-400 mb-1.5">Wrapped Status</label>
            <StyledDropdown
              value={filter.wrappedStatus}
              onChange={(value) => updateFilter({ wrappedStatus: value as UsersFilter["wrappedStatus"] })}
              options={[
                { value: "all", label: "All" },
                { value: "completed", label: "Completed" },
                { value: "generating", label: "Generating" },
                { value: "failed", label: "Failed" },
                { value: "none", label: "None" },
              ]}
              size="sm"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

