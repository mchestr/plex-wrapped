import { getMaintenanceStats } from "@/actions/maintenance"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function MaintenanceDashboard() {
  const statsResult = await getMaintenanceStats()

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">Failed to load maintenance statistics</p>
          </div>
        </div>
      </div>
    )
  }

  const stats = statsResult.data

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Library Maintenance</h1>
              <p className="text-sm text-slate-400">
                Automate library cleanup with rules and scheduled scans
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/maintenance/candidates"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Candidates
              </Link>
              <Link
                href="/admin/maintenance/history"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </Link>
              <Link
                href="/admin/maintenance/rules/new"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Rule
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Rules Stats */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">{stats.rules.total}</div>
              <div className="text-sm text-slate-400">Total Rules</div>
              <div className="flex gap-2 text-xs">
                <span className="text-green-400">{stats.rules.enabled} active</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{stats.rules.disabled} disabled</span>
              </div>
            </div>
          </div>

          {/* Pending Candidates */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">{stats.candidates.pending}</div>
              <div className="text-sm text-slate-400">Pending Review</div>
              <div className="text-xs text-slate-500">
                {stats.candidates.total} total candidates
              </div>
            </div>
          </div>

          {/* Approved Candidates */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">{stats.candidates.approved}</div>
              <div className="text-sm text-slate-400">Approved</div>
              <div className="text-xs text-slate-500">
                Ready for deletion
              </div>
            </div>
          </div>

          {/* Total Deletions */}
          <Link href="/admin/maintenance/history" className="bg-slate-800/50 rounded-lg border border-slate-700 p-6 hover:bg-slate-800/70 transition-colors block">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">{stats.totalDeletions}</div>
              <div className="text-sm text-slate-400">Total Deletions</div>
              <div className="text-xs text-slate-500">
                Click to view history
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Scans */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Recent Scans</h2>
              <p className="text-sm text-slate-400 mt-1">Latest completed maintenance scans</p>
            </div>
            <Link
              href="/admin/maintenance/rules"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All Rules
            </Link>
          </div>
          <div className="overflow-x-auto">
            {stats.recentScans.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">No scans yet</h3>
                <p className="text-slate-400 mb-4">Create a maintenance rule to start scanning your library.</p>
                <Link
                  href="/admin/maintenance/rules/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Rule
                </Link>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rule</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Items Scanned</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Items Flagged</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {stats.recentScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{scan.rule.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          scan.status === 'COMPLETED' ? 'bg-green-400/10 text-green-400' :
                          scan.status === 'RUNNING' ? 'bg-blue-400/10 text-blue-400' :
                          scan.status === 'FAILED' ? 'bg-red-400/10 text-red-400' :
                          'bg-slate-400/10 text-slate-400'
                        }`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{scan.itemsScanned}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">{scan.itemsFlagged}</span>
                          {scan.itemsFlagged > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-400/10 text-yellow-400">
                              Needs Review
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {scan.completedAt ? new Date(scan.completedAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <Link
            href="/admin/maintenance/rules"
            className="bg-slate-800/50 rounded-lg border border-slate-700 p-6 hover:border-cyan-500/50 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  Manage Rules
                </h3>
                <p className="text-sm text-slate-400">
                  Create and configure automated maintenance rules for your library
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/admin/maintenance/candidates"
            className="bg-slate-800/50 rounded-lg border border-slate-700 p-6 hover:border-cyan-500/50 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  Review Candidates
                </h3>
                <p className="text-sm text-slate-400">
                  Review and approve media flagged for deletion by maintenance rules
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
