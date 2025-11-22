"use client"

import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useState } from "react"

interface ProfileStepProps {
  onComplete: () => void
  onBack: () => void
}

export function ProfileStep({ onComplete, onBack }: ProfileStepProps) {
  const { data: session } = useSession()
  const [displayName, setDisplayName] = useState(session?.user?.name || "")

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-2"
      >
        <h2 className="text-2xl font-bold text-white">Your Profile</h2>
        <p className="text-slate-400">Tell us a bit about yourself (optional)</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-2">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-slate-500">
            This is how your name will appear on your wrapped. You can change this later.
          </p>
        </div>

        {session?.user?.image && (
          <div className="flex items-center space-x-4">
            <img
              src={session.user.image}
              alt="Profile"
              className="w-16 h-16 rounded-full border-2 border-cyan-500"
            />
            <div>
              <p className="text-white font-medium">{session.user.name || "User"}</p>
              <p className="text-sm text-slate-400">{session.user.email}</p>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex justify-between pt-4"
      >
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-cyan-500/20"
        >
          Continue
        </button>
      </motion.div>
    </div>
  )
}

