"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  deletePromptTemplate,
  setActivePromptTemplate,
} from "@/actions/prompts"
import { PromptTemplate } from "@prisma/client"

interface PromptTemplateActionsProps {
  template: PromptTemplate
}

export function PromptTemplateActions({ template }: PromptTemplateActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSetActive = async () => {
    if (!template.isActive) {
      startTransition(async () => {
        const result = await setActivePromptTemplate(template.id)
        if (result.success) {
          router.refresh()
          setError(null)
        } else {
          setError(result.error || "Failed to set active template")
        }
      })
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      return
    }

    startTransition(async () => {
      const result = await deletePromptTemplate(template.id)
      if (result.success) {
        router.push("/admin/prompts")
      } else {
        setError(result.error || "Failed to delete template")
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded text-xs">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!template.isActive && (
          <button
            onClick={handleSetActive}
            disabled={isPending}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
          >
            Set Active
          </button>
        )}
        <Link
          href={`/admin/prompts/${template.id}/edit`}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded transition-colors"
        >
          Edit
        </Link>
        <Link
          href={`/admin/playground?templateId=${template.id}`}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
        >
          Playground
        </Link>
        {!template.isActive && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

