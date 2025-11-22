"use client"

import { motion } from "framer-motion"

interface ReportIssuesStepProps {
  onComplete: () => void
  onBack: () => void
}

export function ReportIssuesStep({ onComplete, onBack }: ReportIssuesStepProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-pink-500/10 rounded-full text-pink-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white">
          Reporting Issues
        </h2>
        <p className="text-slate-300 text-base">
          Having trouble with playback, subtitles, or missing content?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-6"
      >
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 text-slate-300 space-y-4">
          <p>
            If you encounter any issues, please report them so we can fix them as soon as possible.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-900/50 p-4 rounded-lg flex items-start space-x-3">
              <div className="text-pink-400 mt-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white">Contact Admin</h4>
                <p className="text-sm text-slate-400 mt-1">
                   Reach out directly to the server owner.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic text-center pt-2">
            Please include the movie/show name and a description of the problem.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex justify-between pt-4"
      >
        <button
          onClick={onBack}
          className="px-4 py-2 text-slate-400 hover:text-white transition-colors font-medium"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
        >
          Finish
        </button>
      </motion.div>
    </div>
  )
}

