"use client"

import { motion } from "framer-motion"
import { WrappedShareButton } from "./wrapped-share-button"

interface WrappedViewerNavigationProps {
  currentSectionIndex: number
  totalSections: number
  onPrevious: () => void
  onNext: () => void
  onShowAll: () => void
  isShared?: boolean
  shareToken?: string
  year: number
}

export function WrappedViewerNavigation({
  currentSectionIndex,
  totalSections,
  onPrevious,
  onNext,
  onShowAll,
  isShared,
  shareToken,
  year,
}: WrappedViewerNavigationProps) {
  return (
    <div className="mt-8 flex justify-between items-center">
      {currentSectionIndex > 0 && (
        <button
          onClick={onPrevious}
          className="px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-md text-white hover:border-cyan-500 transition-colors"
        >
          Previous
        </button>
      )}
      {currentSectionIndex === 0 && <div />}
      {!isShared && shareToken && currentSectionIndex === totalSections - 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
        >
          <WrappedShareButton
            shareToken={shareToken}
            year={year}
          />
        </motion.div>
      )}
      {currentSectionIndex < totalSections - 1 ? (
        <button
          onClick={onNext}
          className="px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-md text-white hover:border-cyan-500 transition-colors"
        >
          Next
        </button>
      ) : (
        <button
          onClick={onShowAll}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-lg text-base font-semibold transition-all shadow-lg border border-white/10"
        >
          Show All
        </button>
      )}
    </div>
  )
}

