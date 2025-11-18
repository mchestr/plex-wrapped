"use client"

import { useState, useTransition } from "react"
import { importPlexUsers } from "@/actions/import-plex-users"

interface ImportPlexUsersButtonProps {
  onResult?: (result: {
    success: boolean
    imported: number
    skipped: number
    errors: string[]
  }) => void
}

export function ImportPlexUsersButton({ onResult }: ImportPlexUsersButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleImport = () => {
    startTransition(async () => {
      const importResult = await importPlexUsers()
      onResult?.(importResult)
    })
  }

  return (
    <button
      onClick={handleImport}
      disabled={isPending}
      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      {isPending ? "Importing..." : "Import Plex Users"}
    </button>
  )
}

export function ImportResultMessage({
  result,
}: {
  result: {
    success: boolean
    imported: number
    skipped: number
    errors: string[]
  } | null
}) {
  if (!result) return null

  return (
    <div
      className={`p-4 rounded-md ${
        result.success
          ? "bg-green-900/30 border border-green-500/50"
          : "bg-red-900/30 border border-red-500/50"
      }`}
    >
      <p
        className={`text-sm font-medium mb-2 ${
          result.success ? "text-green-300" : "text-red-300"
        }`}
      >
        {result.success ? "Import Complete!" : "Import Failed"}
      </p>
      <div className="text-sm text-slate-300 space-y-1">
        <p>Imported: {result.imported} user{result.imported !== 1 ? "s" : ""}</p>
        {result.skipped > 0 && (
          <p>Skipped: {result.skipped} user{result.skipped !== 1 ? "s" : ""} (already exist)</p>
        )}
        {result.errors.length > 0 && (
          <div className="mt-2">
            <p className={`font-medium ${result.success ? "text-yellow-300" : "text-red-300"}`}>
              {result.success ? "Warnings:" : "Errors:"}
            </p>
            <ul className={`list-disc list-inside ${result.success ? "text-yellow-200" : "text-red-200"} max-h-32 overflow-y-auto`}>
              {result.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

