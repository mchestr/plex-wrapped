"use client"

interface WrappedGeneratorPromptProps {
  year: number
  onGenerate: () => void
  isGenerating: boolean
  error?: string | null
}

export function WrappedGeneratorPrompt({
  year,
  onGenerate,
  isGenerating,
  error,
}: WrappedGeneratorPromptProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-2">Your {year} Plex Wrapped</h2>
      <p className="text-slate-400 mb-4">
        Generate your personalized Plex Wrapped to see your viewing statistics and highlights from
        {year}.
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-md">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Generate My Wrapped
      </button>
    </div>
  )
}

