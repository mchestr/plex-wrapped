"use client"

import { useState } from "react"

interface ExpandablePromptProps {
  content: string
  title: string
  characterCount?: number
  characterCountSuffix?: string
}

export function ExpandablePrompt({ content, title, characterCount, characterCountSuffix }: ExpandablePromptProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          <span>{isExpanded ? "Collapse" : "Expand"}</span>
          <span className="text-xs">{isExpanded ? "↑" : "↓"}</span>
        </button>
      </div>
      <div
        className={`bg-slate-900/50 rounded-lg p-4 overflow-x-auto transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[5000px]" : "max-h-[300px] overflow-y-auto"
        }`}
      >
        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
          {content}
        </pre>
      </div>
      {characterCount !== undefined && (
        <div className="mt-2 text-xs text-slate-500">
          {characterCount.toLocaleString()} characters
          {characterCountSuffix && ` ${characterCountSuffix}`}
        </div>
      )}
    </div>
  )
}

