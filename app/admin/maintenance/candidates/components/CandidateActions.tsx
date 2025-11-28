"use client"

import { Button } from "@/components/ui/button"

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
      <Button
        onClick={onBulkApprove}
        disabled={isPending}
        variant="success"
        size="md"
        data-testid="bulk-approve-button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Approve ({selectedCount})
      </Button>
      <Button
        onClick={onBulkReject}
        disabled={isPending}
        variant="danger"
        size="md"
        data-testid="bulk-reject-button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Reject ({selectedCount})
      </Button>
    </div>
  )
}
