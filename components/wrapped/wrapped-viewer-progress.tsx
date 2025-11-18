"use client"

import { motion } from "framer-motion"

interface WrappedViewerProgressProps {
  progress: number
  currentSectionIndex: number
  totalSections: number
}

export function WrappedViewerProgress({
  progress,
  currentSectionIndex,
  totalSections,
}: WrappedViewerProgressProps) {
  return (
    <div className="mb-8">
      <div className="max-w-md mx-auto">
        {/* Progress bar container */}
        <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          {/* Animated progress fill */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
            style={{ boxShadow: "0 0 10px rgba(34, 211, 238, 0.5)" }}
          />
          {/* Glow effect */}
          <motion.div
            className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full"
            style={{
              transform: `translateX(${Math.min((progress / 100) * (100 - 5), 95)}%)`,
              transition: "transform 0.1s linear"
            }}
          />
        </div>
        {/* Section indicators */}
        <div className="flex justify-between mt-3">
          {Array.from({ length: totalSections }).map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                idx < currentSectionIndex
                  ? "bg-cyan-400 scale-125"
                  : idx === currentSectionIndex
                  ? "bg-cyan-400 scale-150 ring-2 ring-cyan-400/50"
                  : "bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

