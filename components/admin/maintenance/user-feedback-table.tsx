"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { MediaMarkSummary } from "@/actions/user-feedback"
import { MediaType, MarkType } from "@/lib/validations/maintenance"
import { addMediaToDeletionQueue, ignoreMediaForever } from "@/actions/user-feedback"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface UserFeedbackTableProps {
  initialData: MediaMarkSummary[]
}

type SortField = "title" | "deletionScore" | "userCount" | "fileSize"
type SortOrder = "asc" | "desc"

export function UserFeedbackTable({ initialData }: UserFeedbackTableProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState<string | null>(null)

  // Filters
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType | "all">("all")
  const [markTypeFilter, setMarkTypeFilter] = useState<MarkType | "all">("all")
  const [minUserCount, setMinUserCount] = useState(1)

  // Sorting
  const [sortField, setSortField] = useState<SortField>("deletionScore")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((item) => {
      if (mediaTypeFilter !== "all" && item.mediaType !== mediaTypeFilter) {
        return false
      }

      if (markTypeFilter !== "all") {
        if (item.markCounts[markTypeFilter] === 0) {
          return false
        }
      }

      if (item.uniqueUserCount < minUserCount) {
        return false
      }

      return true
    })

    filtered.sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "title":
          compareValue = a.title.localeCompare(b.title)
          break
        case "deletionScore":
          compareValue = a.deletionScore - b.deletionScore
          break
        case "userCount":
          compareValue = a.uniqueUserCount - b.uniqueUserCount
          break
        case "fileSize":
          compareValue = Number(a.totalFileSize || 0) - Number(b.totalFileSize || 0)
          break
      }

      return sortOrder === "desc" ? -compareValue : compareValue
    })

    return filtered
  }, [data, mediaTypeFilter, markTypeFilter, minUserCount, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const handleAddToQueue = async (item: MediaMarkSummary) => {
    setLoading(item.plexRatingKey)
    try {
      const result = await addMediaToDeletionQueue(item.plexRatingKey)

      if (result.success) {
        showToast(`${item.title} added to deletion queue`, "success")
        // Remove from list
        setData((prev) => prev.filter((d) => d.plexRatingKey !== item.plexRatingKey))
      } else {
        showToast(result.error || "Failed to add to queue", "error")
      }
    } catch (error) {
      showToast("An error occurred", "error")
    } finally {
      setLoading(null)
    }
  }

  const handleIgnore = async (item: MediaMarkSummary) => {
    setLoading(item.plexRatingKey)
    try {
      const result = await ignoreMediaForever(item.plexRatingKey)

      if (result.success) {
        showToast(`${item.title} will be kept forever`, "success")
        // Remove from list
        setData((prev) => prev.filter((d) => d.plexRatingKey !== item.plexRatingKey))
      } else {
        showToast(result.error || "Failed to ignore media", "error")
      }
    } catch (error) {
      showToast("An error occurred", "error")
    } finally {
      setLoading(null)
    }
  }

  const getRecommendationBadge = (item: MediaMarkSummary) => {
    if (item.markCounts.KEEP_FOREVER > 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Keep</span>
    }
    if (item.deletionScore >= 15) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Delete</span>
    }
    if (item.deletionScore >= 8) {
      return <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400">Review</span>
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Keep</span>
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortOrder === "asc" ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Media Type</label>
            <select
              value={mediaTypeFilter}
              onChange={(e) => setMediaTypeFilter(e.target.value as MediaType | "all")}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Types</option>
              <option value="MOVIE">Movies</option>
              <option value="TV_SERIES">TV Series</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mark Type</label>
            <select
              value={markTypeFilter}
              onChange={(e) => setMarkTypeFilter(e.target.value as MarkType | "all")}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Marks</option>
              <option value="FINISHED_WATCHING">Finished Watching</option>
              <option value="NOT_INTERESTED">Not Interested</option>
              <option value="KEEP_FOREVER">Keep Forever</option>
              <option value="REWATCH_CANDIDATE">Rewatch Candidate</option>
              <option value="POOR_QUALITY">Poor Quality</option>
              <option value="WRONG_VERSION">Wrong Version</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Min User Count</label>
            <input
              type="number"
              min="1"
              value={minUserCount}
              onChange={(e) => setMinUserCount(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-xs uppercase text-slate-400 font-medium border-b border-slate-700">
                <th
                  className="px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-2">
                    Title
                    <SortIcon field="title" />
                  </div>
                </th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">User Marks</th>
                <th
                  className="px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => handleSort("userCount")}
                >
                  <div className="flex items-center gap-2">
                    Users
                    <SortIcon field="userCount" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => handleSort("deletionScore")}
                >
                  <div className="flex items-center gap-2">
                    Score
                    <SortIcon field="deletionScore" />
                  </div>
                </th>
                <th className="px-4 py-3">Recommendation</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No feedback found matching filters
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((item) => (
                  <tr
                    key={item.plexRatingKey}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/maintenance/user-feedback/${item.plexRatingKey}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{item.title}</div>
                      {item.year && <div className="text-xs text-slate-400">{item.year}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">
                        {item.mediaType === "MOVIE" ? "Movie" : "TV Series"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 text-xs">
                        {item.markCounts.FINISHED_WATCHING > 0 && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                            Finished: {item.markCounts.FINISHED_WATCHING}
                          </span>
                        )}
                        {item.markCounts.NOT_INTERESTED > 0 && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
                            Not Interested: {item.markCounts.NOT_INTERESTED}
                          </span>
                        )}
                        {item.markCounts.KEEP_FOREVER > 0 && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                            Keep: {item.markCounts.KEEP_FOREVER}
                          </span>
                        )}
                        {item.markCounts.POOR_QUALITY > 0 && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
                            Poor Quality: {item.markCounts.POOR_QUALITY}
                          </span>
                        )}
                        {item.markCounts.WRONG_VERSION > 0 && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                            Wrong Version: {item.markCounts.WRONG_VERSION}
                          </span>
                        )}
                        {item.markCounts.REWATCH_CANDIDATE > 0 && (
                          <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                            Rewatch: {item.markCounts.REWATCH_CANDIDATE}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white font-medium">{item.uniqueUserCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white font-medium">{item.deletionScore}</span>
                    </td>
                    <td className="px-4 py-3">{getRecommendationBadge(item)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddToQueue(item)}
                          disabled={loading === item.plexRatingKey}
                          className="px-3 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {loading === item.plexRatingKey ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            "Add to Queue"
                          )}
                        </button>
                        <button
                          onClick={() => handleIgnore(item)}
                          disabled={loading === item.plexRatingKey}
                          className="px-3 py-1 text-xs font-medium bg-slate-500/20 text-slate-400 rounded hover:bg-slate-500/30 transition-colors disabled:opacity-50"
                        >
                          {loading === item.plexRatingKey ? <LoadingSpinner size="sm" /> : "Ignore"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-slate-400 text-center">
        Showing {filteredAndSortedData.length} of {data.length} items
      </div>
    </div>
  )
}
