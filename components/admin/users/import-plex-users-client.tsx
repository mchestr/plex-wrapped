"use client"

import { useState } from "react"
import { ImportPlexUsersButton, ImportResultMessage } from "./import-plex-users-button"

export function ImportPlexUsersClient() {
  const [result, setResult] = useState<{
    success: boolean
    imported: number
    skipped: number
    errors: string[]
  } | null>(null)

  return (
    <div className="flex flex-col items-end">
      <ImportPlexUsersButton onResult={setResult} />
      {result && (
        <div className="absolute left-0 right-0 top-full mt-4">
          <ImportResultMessage result={result} />
        </div>
      )}
    </div>
  )
}

