import { getUserFeedbackSummary } from "@/actions/user-feedback"
import { UserFeedbackTable } from "@/components/admin/maintenance/user-feedback-table"
import { ErrorState } from "@/components/ui/error-state"

export const dynamic = "force-dynamic"

export default async function UserFeedbackPage() {
  const result = await getUserFeedbackSummary()

  if (!result.success) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">User Feedback</h1>
          <ErrorState title="Failed to load user feedback" message={result.error} />
        </div>
      </div>
    )
  }

  const summaries = result.data || []

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">User Feedback</h1>
          <p className="text-sm text-slate-400">
            Review aggregated user marks to identify media for deletion or retention.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Total Items</div>
            <div className="text-2xl font-bold text-white">{summaries.length}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">High Priority</div>
            <div className="text-2xl font-bold text-red-400">
              {summaries.filter((s) => s.deletionScore >= 15).length}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Review Needed</div>
            <div className="text-2xl font-bold text-amber-400">
              {summaries.filter((s) => s.deletionScore >= 8 && s.deletionScore < 15).length}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Keep</div>
            <div className="text-2xl font-bold text-green-400">
              {summaries.filter((s) => s.deletionScore < 8 || s.markCounts.KEEP_FOREVER > 0).length}
            </div>
          </div>
        </div>

        <UserFeedbackTable initialData={summaries} />
      </div>
    </div>
  )
}
