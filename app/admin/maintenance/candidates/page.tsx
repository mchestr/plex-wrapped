"use client"

import { getMaintenanceCandidates, updateCandidateReviewStatus, bulkUpdateCandidates } from "@/actions/maintenance"
import { useToast } from "@/components/ui/toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ReviewStatus, MediaType } from "@/lib/validations/maintenance"

type MaintenanceCandidate = {
  id: string
  mediaType: string
  plexRatingKey: string
  title: string
  year: number | null
  poster: string | null
  fileSize: bigint | null
  playCount: number
  lastWatchedAt: Date | null
  addedAt: Date | null
  reviewStatus: ReviewStatus
  flaggedAt: Date
  scan: {
    id: string
    rule: {
      id: string
      name: string
      actionType: string
    }
  }
}

export default function CandidatesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatus | "ALL">("PENDING")
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType | "ALL">("ALL")

  const { data: candidatesResult, isLoading, error } = useQuery({
    queryKey: ['maintenance-candidates', reviewStatusFilter, mediaTypeFilter],
    queryFn: async () => {
      const filters: { reviewStatus?: ReviewStatus; mediaType?: MediaType } = {}
      if (reviewStatusFilter !== "ALL") {
        filters.reviewStatus = reviewStatusFilter
      }
      if (mediaTypeFilter !== "ALL") {
        filters.mediaType = mediaTypeFilter
      }

      const result = await getMaintenanceCandidates(filters)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch candidates')
      }
      return result.data as MaintenanceCandidate[]
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReviewStatus }) => {
      const result = await updateCandidateReviewStatus(id, status)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update status')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-candidates'] })
      toast.showSuccess('Status updated successfully')
    },
    onError: (error) => {
      toast.showError(error instanceof Error ? error.message : 'Failed to update status')
    },
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ReviewStatus }) => {
      const result = await bulkUpdateCandidates(ids, status)
      if (!result.success) {
        throw new Error(result.error || 'Failed to bulk update')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-candidates'] })
      toast.showSuccess(`${variables.ids.length} candidates ${variables.status.toLowerCase()}`)
      setSelectedCandidates(new Set())
    },
    onError: (error) => {
      toast.showError(error instanceof Error ? error.message : 'Failed to bulk update')
    },
  })

  function toggleCandidate(id: string) {
    const newSelected = new Set(selectedCandidates)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCandidates(newSelected)
  }

  function toggleAll() {
    if (!candidatesResult) return

    if (selectedCandidates.size === candidatesResult.length) {
      setSelectedCandidates(new Set())
    } else {
      setSelectedCandidates(new Set(candidatesResult.map(c => c.id)))
    }
  }

  function handleApprove(id: string) {
    updateStatusMutation.mutate({ id, status: "APPROVED" })
  }

  function handleReject(id: string) {
    updateStatusMutation.mutate({ id, status: "REJECTED" })
  }

  function handleBulkApprove() {
    if (selectedCandidates.size === 0) return
    bulkUpdateMutation.mutate({ ids: Array.from(selectedCandidates), status: "APPROVED" })
  }

  function handleBulkReject() {
    if (selectedCandidates.size === 0) return
    bulkUpdateMutation.mutate({ ids: Array.from(selectedCandidates), status: "REJECTED" })
  }

  function formatFileSize(bytes: bigint | number | null): string {
    if (!bytes) return 'Unknown'
    const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes
    const gb = numBytes / (1024 ** 3)
    if (gb >= 1) return `${gb.toFixed(2)} GB`
    const mb = numBytes / (1024 ** 2)
    return `${mb.toFixed(2)} MB`
  }

  function formatDate(date: Date | null): string {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString()
  }

  function getMediaTypeLabel(mediaType: string) {
    return mediaType.replace('_', ' ')
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">Failed to load candidates</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Review Candidates</h1>
          <p className="text-slate-400">Review media flagged for deletion by maintenance rules</p>
        </div>

        {/* Filters and Bulk Actions */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Review Status</label>
                <select
                  value={reviewStatusFilter}
                  onChange={(e) => setReviewStatusFilter(e.target.value as ReviewStatus | "ALL")}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Media Type</label>
                <select
                  value={mediaTypeFilter}
                  onChange={(e) => setMediaTypeFilter(e.target.value as MediaType | "ALL")}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Types</option>
                  <option value="MOVIE">Movie</option>
                  <option value="TV_SERIES">TV Series</option>
                  <option value="EPISODE">Episode</option>
                </select>
              </div>
            </div>

            {selectedCandidates.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkUpdateMutation.isPending}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve ({selectedCandidates.size})
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={bulkUpdateMutation.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject ({selectedCandidates.size})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Candidates Table */}
        {!candidatesResult || candidatesResult.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
            <svg className="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">No candidates found</h3>
            <p className="text-slate-400">No media matching the current filters.</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.size === candidatesResult.length && candidatesResult.length > 0}
                        onChange={toggleAll}
                        className="rounded border-slate-600 text-cyan-600 focus:ring-cyan-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Media</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">File Size</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Play Count</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Watched</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Matched Rule</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {candidatesResult.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.has(candidate.id)}
                          onChange={() => toggleCandidate(candidate.id)}
                          className="rounded border-slate-600 text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {candidate.poster ? (
                            <img
                              src={candidate.poster}
                              alt={candidate.title}
                              className="w-10 h-14 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-slate-700 rounded flex items-center justify-center">
                              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">{candidate.title}</div>
                            {candidate.year && (
                              <div className="text-xs text-slate-400">{candidate.year}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400">
                          {getMediaTypeLabel(candidate.mediaType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatFileSize(candidate.fileSize)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {candidate.playCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(candidate.lastWatchedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{candidate.scan.rule.name}</div>
                        <div className={`text-xs mt-1 ${
                          candidate.scan.rule.actionType === 'AUTO_DELETE'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}>
                          {candidate.scan.rule.actionType === 'AUTO_DELETE' ? 'Auto Delete' : 'Flag for Review'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          candidate.reviewStatus === 'APPROVED' ? 'bg-green-400/10 text-green-400' :
                          candidate.reviewStatus === 'REJECTED' ? 'bg-red-400/10 text-red-400' :
                          candidate.reviewStatus === 'DELETED' ? 'bg-slate-400/10 text-slate-400' :
                          'bg-yellow-400/10 text-yellow-400'
                        }`}>
                          {candidate.reviewStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {candidate.reviewStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(candidate.id)}
                                disabled={updateStatusMutation.isPending}
                                className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReject(candidate.id)}
                                disabled={updateStatusMutation.isPending}
                                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
