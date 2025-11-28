"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MediaDetails } from "@/actions/user-feedback"
import { addMediaToDeletionQueue, ignoreMediaForever } from "@/actions/user-feedback"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MarkType } from "@/lib/validations/maintenance"

interface MediaMarkDetailsViewProps {
  details: MediaDetails
}

export function MediaMarkDetailsView({ details }: MediaMarkDetailsViewProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleAddToQueue = async () => {
    setLoading(true)
    try {
      const result = await addMediaToDeletionQueue(details.plexRatingKey)

      if (result.success) {
        showToast(`${details.title} added to deletion queue`, "success")
        router.push("/admin/maintenance/user-feedback")
      } else {
        showToast(result.error || "Failed to add to queue", "error")
      }
    } catch (error) {
      showToast("An error occurred", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleIgnore = async () => {
    setLoading(true)
    try {
      const result = await ignoreMediaForever(details.plexRatingKey)

      if (result.success) {
        showToast(`${details.title} will be kept forever`, "success")
        router.push("/admin/maintenance/user-feedback")
      } else {
        showToast(result.error || "Failed to ignore media", "error")
      }
    } catch (error) {
      showToast("An error occurred", "error")
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: bigint | null) => {
    if (!bytes) return "N/A"
    const gb = Number(bytes) / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  const getMarkTypeLabel = (markType: MarkType) => {
    const labels: Record<MarkType, string> = {
      FINISHED_WATCHING: "Finished Watching",
      NOT_INTERESTED: "Not Interested",
      KEEP_FOREVER: "Keep Forever",
      REWATCH_CANDIDATE: "Rewatch Candidate",
      POOR_QUALITY: "Poor Quality",
      WRONG_VERSION: "Wrong Version",
    }
    return labels[markType]
  }

  const getMarkTypeBadgeColor = (markType: MarkType) => {
    const colors: Record<MarkType, string> = {
      FINISHED_WATCHING: "bg-blue-500/20 text-blue-400",
      NOT_INTERESTED: "bg-red-500/20 text-red-400",
      KEEP_FOREVER: "bg-green-500/20 text-green-400",
      REWATCH_CANDIDATE: "bg-cyan-500/20 text-cyan-400",
      POOR_QUALITY: "bg-orange-500/20 text-orange-400",
      WRONG_VERSION: "bg-purple-500/20 text-purple-400",
    }
    return colors[markType]
  }

  const getRecommendationDetails = () => {
    switch (details.recommendation) {
      case "delete":
        return {
          label: "Delete",
          color: "bg-red-500/20 text-red-400 border-red-500/50",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          ),
          message:
            "Strong consensus for deletion. Multiple users have indicated this media should be removed.",
        }
      case "review":
        return {
          label: "Review",
          color: "bg-amber-500/20 text-amber-400 border-amber-500/50",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ),
          message: "Mixed feedback. Review user marks and watch statistics before making a decision.",
        }
      case "keep":
        return {
          label: "Keep",
          color: "bg-green-500/20 text-green-400 border-green-500/50",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          message: "Should be kept. Low deletion score or users have marked it to keep forever.",
        }
    }
  }

  const recommendation = getRecommendationDetails()

  return (
    <div className="space-y-6">
      {/* Recommendation Section */}
      <div
        className={`bg-slate-800/50 backdrop-blur-sm border ${recommendation.color} rounded-lg p-6`}
      >
        <div className="flex items-start gap-4">
          <div className={recommendation.color}>{recommendation.icon}</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Recommendation: {recommendation.label}</h2>
            <p className="text-sm text-slate-300 mb-4">{recommendation.message}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Deletion Score:</span>
              <span className="text-2xl font-bold text-white">{details.deletionScore}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAddToQueue}
              disabled={loading}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : "Add to Deletion Queue"}
            </button>
            <button
              onClick={handleIgnore}
              disabled={loading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : "Keep Forever"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Watch Statistics */}
        {details.watchStats && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Watch Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Plays</span>
                <span className="text-lg font-semibold text-white">
                  {details.watchStats.totalPlays}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Unique Viewers</span>
                <span className="text-lg font-semibold text-white">
                  {details.watchStats.uniqueViewers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Last Watched</span>
                <span className="text-sm text-white">
                  {details.watchStats.lastWatched
                    ? new Date(details.watchStats.lastWatched).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* File Information */}
        {details.fileInfo && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">File Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">File Size</span>
                <span className="text-lg font-semibold text-white">
                  {formatFileSize(details.fileInfo.size)}
                </span>
              </div>
              {details.fileInfo.quality && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Quality</span>
                  <span className="text-sm text-white">{details.fileInfo.quality}</span>
                </div>
              )}
              {details.fileInfo.path && (
                <div>
                  <span className="text-sm text-slate-400 block mb-1">Path</span>
                  <span className="text-xs text-slate-300 font-mono break-all">
                    {details.fileInfo.path}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Marks */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">User Marks ({details.marks.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-xs uppercase text-slate-400 font-medium border-b border-slate-700">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Media Title</th>
                <th className="px-4 py-3">Mark Type</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Marked Date</th>
                <th className="px-4 py-3">Via</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {details.marks.map((mark) => (
                <tr key={mark.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">
                      {mark.userName || "Unknown User"}
                    </div>
                    {mark.userEmail && (
                      <div className="text-xs text-slate-400">{mark.userEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">
                      {mark.parentTitle ? `${mark.parentTitle} - ` : ""}{mark.title}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${getMarkTypeBadgeColor(mark.markType)}`}>
                      {getMarkTypeLabel(mark.markType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">
                      {mark.note || <span className="text-slate-500 italic">No note</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">
                      {new Date(mark.markedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400">{mark.markedVia}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
