"use client"

import Link from "next/link"
import { motion } from "framer-motion"

interface DiscordSupportStepProps {
  onComplete: () => void
  onBack: () => void
  discordEnabled: boolean
  instructions?: string | null
}

export function DiscordSupportStep({ onComplete, onBack, discordEnabled, instructions }: DiscordSupportStepProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4C3.45 4 3 4.45 3 5v12c0 .55.45 1 1 1h3v3.5L11.5 18H20c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-7.37 8.5c-.22.25-.6.33-.9.17-.99-.5-1.94-1.12-2.82-1.88a18.19 18.19 0 01-1.76-1.75c-.2-.23-.23-.57-.06-.82l1.14-1.71c.24-.36.75-.44 1.09-.19.31.23.65.46 1.02.69.32.19.41.61.2.91l-.53.79a9.4 9.4 0 001.58 1.22l.67-.89c.24-.31.68-.39 1-.2.37.22.74.43 1.1.66.35.22.46.69.23 1.03l-.96 1.41z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white">
          Join the Discord
        </h2>
        <p className="text-slate-300 text-base max-w-xl mx-auto">
          Link your Discord account to unlock instant access to support, outage alerts, and a private community of other Plex members.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Live Support",
              description: "Chat directly with admins when something breaks.",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              ),
            },
            {
              title: "Community Picks",
              description: "See what others are watching and share recommendations.",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-5M7 4H2v5M21 3l-6 6M3 21l6-6" />
                </svg>
              ),
            },
            {
              title: "Faster Help",
              description: "Linked role proves you’re a Plex member, so the bot responds instantly.",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.title} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <div className="text-indigo-400 mb-2">{item.icon}</div>
              <h3 className="text-white font-semibold">{item.title}</h3>
              <p className="text-sm text-slate-400 mt-1">{item.description}</p>
            </div>
          ))}
        </div>

        {instructions && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Server Notes</div>
            <p className="whitespace-pre-line">{instructions}</p>
          </div>
        )}

        <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <p className="text-white font-medium">
              {discordEnabled ? "Ready to link your Discord?" : "Discord linking is coming soon"}
            </p>
            <p className="text-sm text-slate-400">
              {discordEnabled
                ? "We’ll open a new window with the support portal. Come back after linking to continue."
                : "Your Plex admin hasn’t enabled the Discord portal yet."}
            </p>
          </div>
          {discordEnabled ? (
            <Link
              href="/discord/link"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
            >
              Open Portal
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h6m0 0v6m0-6L10 16" />
              </svg>
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-400 rounded-lg font-medium cursor-not-allowed"
            >
              Portal Unavailable
            </button>
          )}
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
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
      </motion.div>
    </div>
  )
}

