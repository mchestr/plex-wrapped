"use client"

import { updateWrappedSettings } from "@/actions/admin"
import { StyledInput } from "@/components/ui/styled-input"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

// ... existing code ...

interface WrappedSettingsFormProps {
  enabled: boolean
  year: number | null
}

export function WrappedSettingsForm({ enabled, year }: WrappedSettingsFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const [formData, setFormData] = useState({
    enabled: enabled,
    year: year ?? currentYear,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (formData.year < 2000 || formData.year > 2100) {
      setError("Year must be between 2000 and 2100")
      return
    }

    startTransition(async () => {
      const result = await updateWrappedSettings({
        enabled: formData.enabled,
        year: formData.year,
      })

      if (result.success) {
        setIsEditing(false)
        setSuccess("Wrapped settings updated")
        router.refresh()
      } else {
        setError(result.error || "Failed to update wrapped settings")
      }
    })
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-slate-400 mb-1">Wrapped Year</div>
            <div className="text-sm text-white font-mono">{year ?? currentYear}</div>
          </div>
        </div>
        {success && (
          <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
            {success}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-medium rounded transition-all"
          >
            Edit
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              disabled={isPending}
              className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-600 focus:ring-cyan-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-white">Enable Wrapped Feature</span>
          </label>
          <p className="mt-1 text-xs text-slate-400">
            When disabled, users cannot generate new wrapped content
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Wrapped Year
          </label>
          <StyledInput
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || currentYear })}
            min="2000"
            max="2100"
            placeholder={currentYear.toString()}
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-slate-400">
            Year for wrapped generation. Leave empty to use current year ({currentYear})
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false)
            setError(null)
            setSuccess(null)
            setFormData({ enabled, year: year ?? currentYear })
          }}
          disabled={isPending}
          className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

