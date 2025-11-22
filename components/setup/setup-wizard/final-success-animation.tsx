"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface FinalSuccessAnimationProps {
  onComplete: () => void
  title?: string
  subtitle?: string
}

export function FinalSuccessAnimation({ onComplete, title = "Setup Complete!", subtitle = "Your Plex Wrapped is ready" }: FinalSuccessAnimationProps) {
  const [exhaustParticles, setExhaustParticles] = useState<Array<{ id: number }>>([])
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generate exhaust particles
    const newExhaustParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
    }))
    setExhaustParticles(newExhaustParticles)

    // Generate stars in the sky
    const newStars = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 50, // Upper portion of screen
      delay: Math.random() * 0.5,
    }))
    setStars(newStars)

    // Complete animation after duration
    const timer = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />

      {/* Stars in the sky */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          className="absolute w-1 h-1 rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            boxShadow: "0 0 4px rgba(255, 255, 255, 0.8)",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: star.delay,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}

      {/* Success Content - Centered */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Rocket */}
        <motion.div
          initial={{ y: 0, opacity: 0, scale: 0.5 }}
          animate={{ y: -150, opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.8] }}
          transition={{
            y: {
              duration: 2.5,
              ease: [0.25, 0.1, 0.25, 1], // Ease out cubic
            },
            opacity: {
              duration: 2.5,
              times: [0, 0.1, 0.7, 1],
            },
            scale: {
              duration: 2.5,
              times: [0, 0.2, 0.7, 1],
            },
          }}
          className="relative z-20 mb-8"
        >
          {/* Rocket Body */}
          <div className="relative">
            {/* Rocket SVG */}
            <svg
              width="80"
              height="120"
              viewBox="0 0 80 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              {/* Rocket Body */}
              <path
                d="M40 10 L50 100 L40 110 L30 100 Z"
                fill="url(#rocketGradient)"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
              />
              {/* Rocket Window */}
              <circle cx="40" cy="40" r="12" fill="rgba(34, 211, 238, 0.6)" />
              <circle cx="40" cy="40" r="8" fill="rgba(168, 85, 247, 0.4)" />
              {/* Rocket Fins */}
              <path d="M30 100 L20 110 L30 110 Z" fill="rgba(168, 85, 247, 0.8)" />
              <path d="M50 100 L60 110 L50 110 Z" fill="rgba(168, 85, 247, 0.8)" />
              {/* Gradient Definition */}
              <defs>
                <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>

            {/* Exhaust Trail */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-16">
              {exhaustParticles.map((particle, index) => (
                <motion.div
                  key={particle.id}
                  className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${
                      index % 3 === 0
                        ? "rgba(34, 211, 238, 0.9)"
                        : index % 3 === 1
                        ? "rgba(168, 85, 247, 0.9)"
                        : "rgba(236, 72, 153, 0.9)"
                    } 0%, transparent 70%)`,
                  }}
                  initial={{
                    y: 0,
                    x: (Math.random() - 0.5) * 20,
                    scale: 1,
                    opacity: 1,
                  }}
                  animate={{
                    y: 40 + Math.random() * 20,
                    x: (Math.random() - 0.5) * 40,
                    scale: [1, 1.5, 0],
                    opacity: [1, 0.8, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.05,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Success Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <motion.p
            className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
          >
            {title}
          </motion.p>
          <motion.p
            className="text-lg text-slate-300 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {subtitle}
          </motion.p>
          <motion.p
            className="text-sm text-slate-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            Redirecting to home...
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  )
}

