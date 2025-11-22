"use client"

import { exportDatabaseDump, importDatabaseDump } from "@/actions/admin"
import { ConfirmModal } from "@/components/admin/shared/confirm-modal"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"

export function DatabaseManagement() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleExport = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await exportDatabaseDump()
      if (result.success && result.data) {
        // Create a blob and download it
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `plex-wrapped-dump-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setSuccess("Database exported successfully")
      } else {
        setError(result.error || "Failed to export database")
      }
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setIsImportModalOpen(true)
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleImport = () => {
    if (!selectedFile) return

    setError(null)
    setSuccess(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      try {
        const dump = JSON.parse(content)
        startTransition(async () => {
          const result = await importDatabaseDump(dump)
          if (result.success) {
            setSuccess("Database imported successfully")
            router.refresh()
          } else {
            setError(result.error || "Failed to import database")
          }
          setSelectedFile(null)
        })
      } catch (err) {
        setError("Invalid JSON file")
        setSelectedFile(null)
      }
    }
    reader.readAsText(selectedFile)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleExport}
          disabled={isPending}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isPending ? "Exporting..." : "Export Database"}
        </button>

        <div className="flex-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {isPending ? "Importing..." : "Import Database"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
          {success}
        </div>
      )}

      <ConfirmModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false)
          setSelectedFile(null)
        }}
        onConfirm={handleImport}
        title="Import Database Dump"
        message="Are you sure you want to import this database dump? This will OVERWRITE all existing data. This action cannot be undone."
        confirmText="Import & Overwrite"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  )
}
