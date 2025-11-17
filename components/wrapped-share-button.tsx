"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

interface WrappedShareButtonProps {
  shareToken: string
  year: number
}

export function WrappedShareButton({
  shareToken,
  year,
}: WrappedShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/wrapped/share/${shareToken}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="relative">
      {/* Animated glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-lg blur-md opacity-40"
        animate={{
          opacity: [0.2, 0.35, 0.2],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.button
        onClick={handleCopy}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-lg text-lg font-bold transition-all flex items-center gap-3 shadow-xl border-2 border-white/20"
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 8px 20px rgba(34, 211, 238, 0.25), 0 0 0 0 rgba(34, 211, 238, 0.4)",
            "0 12px 28px rgba(168, 85, 247, 0.35), 0 0 0 4px rgba(168, 85, 247, 0.2)",
            "0 8px 20px rgba(34, 211, 238, 0.25), 0 0 0 0 rgba(34, 211, 238, 0.4)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{
          scale: 1.08,
          boxShadow: "0 12px 32px rgba(168, 85, 247, 0.4), 0 0 0 4px rgba(168, 85, 247, 0.3)"
        }}
        whileTap={{ scale: 0.98 }}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="copied"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <motion.svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342c-.4 0-.622-.248-.622-.55 0-.343.222-.55.622-.55h2.014v-2.014c0-.4.248-.622.55-.622.343 0 .55.222.55.622v2.014h2.014c.4 0 .622.248.622.55 0 .343-.222.55-.622.55h-2.014v2.014c0 .4-.248.622-.55.622-.343 0-.55-.222-.55-.622v-2.014H8.684z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 8h2a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V10a2 2 0 012-2h2m6-4h4a2 2 0 012 2v2M10 4H6a2 2 0 00-2 2v2m8-4v8m0 0l-3-3m3 3l3-3"
                />
              </motion.svg>
              <span>Share Your Wrapped</span>
              <motion.svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                animate={{
                  x: [0, 4, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </motion.svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {showTooltip && !copied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap shadow-lg z-50"
          >
            Share your wrapped summary
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-slate-800"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

