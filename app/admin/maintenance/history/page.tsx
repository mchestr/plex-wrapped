import { getDeletionHistory, getDeletionStats } from "@/actions/maintenance"
import { DeletionHistoryClient } from "@/components/admin/maintenance/deletion-history-client"

export const dynamic = 'force-dynamic'

export default async function DeletionHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    mediaType?: string
    deletedBy?: string
    filesDeleted?: string
    startDate?: string
    endDate?: string
  }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)

  // Parse filters
  const filters: {
    mediaType?: "MOVIE" | "TV_SERIES" | "EPISODE"
    deletedBy?: string
    filesDeleted?: boolean
    startDate?: Date
    endDate?: Date
    page: number
    pageSize: number
  } = {
    page,
    pageSize: 50,
  }

  if (params.mediaType && ["MOVIE", "TV_SERIES", "EPISODE"].includes(params.mediaType)) {
    filters.mediaType = params.mediaType as "MOVIE" | "TV_SERIES" | "EPISODE"
  }

  if (params.deletedBy) {
    filters.deletedBy = params.deletedBy
  }

  if (params.filesDeleted) {
    filters.filesDeleted = params.filesDeleted === "true"
  }

  if (params.startDate) {
    filters.startDate = new Date(params.startDate)
  }

  if (params.endDate) {
    filters.endDate = new Date(params.endDate)
  }

  const [historyResult, statsResult] = await Promise.all([
    getDeletionHistory(filters),
    getDeletionStats({
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
  ])

  if (!historyResult.success || !historyResult.data) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">
              {historyResult.error || "Failed to load deletion history"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">
              {statsResult.error || "Failed to load deletion statistics"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Deletion History</h1>
          <p className="text-sm text-slate-400">
            View all media deletions and reclaimed storage space
          </p>
        </div>

        <DeletionHistoryClient
          deletions={historyResult.data.deletions}
          pagination={historyResult.data.pagination}
          stats={statsResult.data}
          currentFilters={{
            mediaType: params.mediaType,
            deletedBy: params.deletedBy,
            filesDeleted: params.filesDeleted,
            startDate: params.startDate,
            endDate: params.endDate,
          }}
        />
      </div>
    </div>
  )
}
