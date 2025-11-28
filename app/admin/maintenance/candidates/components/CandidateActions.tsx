"use client"

interface CandidateActionsProps {
  selectedCount: number
  onBulkApprove: () => void
  onBulkReject: () => void
  isPending: boolean
}

export function CandidateActions({
  selectedCount,
  onBulkApprove,
  onBulkReject,
  isPending,
}: CandidateActionsProps) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={onBulkApprove}
        disabled={isPending}
        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Approve ({selectedCount})
      </button>
      <button
        onClick={onBulkReject}
        disabled={isPending}
        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Reject ({selectedCount})
      </button>
    </div>
  )
}
