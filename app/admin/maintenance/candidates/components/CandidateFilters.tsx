"use client"

import type { ReviewStatus, MediaType } from "@/lib/validations/maintenance"

interface CandidateFiltersProps {
  reviewStatusFilter: ReviewStatus | "ALL"
  mediaTypeFilter: MediaType | "ALL"
  onReviewStatusChange: (status: ReviewStatus | "ALL") => void
  onMediaTypeChange: (type: MediaType | "ALL") => void
}

export function CandidateFilters({
  reviewStatusFilter,
  mediaTypeFilter,
  onReviewStatusChange,
  onMediaTypeChange,
}: CandidateFiltersProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Review Status</label>
        <select
          value={reviewStatusFilter}
          onChange={(e) => onReviewStatusChange(e.target.value as ReviewStatus | "ALL")}
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
          onChange={(e) => onMediaTypeChange(e.target.value as MediaType | "ALL")}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">All Types</option>
          <option value="MOVIE">Movie</option>
          <option value="TV_SERIES">TV Series</option>
          <option value="EPISODE">Episode</option>
        </select>
      </div>
    </div>
  )
}
