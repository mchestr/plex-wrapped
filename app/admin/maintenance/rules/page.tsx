"use client"

import { getMaintenanceRules, deleteMaintenanceRule, toggleMaintenanceRule, triggerManualScan } from "@/actions/maintenance"
import { useToast } from "@/components/ui/toast"
import { ConfirmModal } from "@/components/admin/shared/confirm-modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

type MaintenanceRule = {
  id: string
  name: string
  description: string | null
  enabled: boolean
  mediaType: string
  actionType: string
  schedule: string | null
  createdAt: Date
  scans: Array<{
    id: string
    status: string
    itemsScanned: number
    itemsFlagged: number
    completedAt: Date | null
  }>
  _count: {
    scans: number
  }
}

export default function RulesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [ruleIdToDelete, setRuleIdToDelete] = useState<string | null>(null)

  const { data: rulesResult, isLoading, error } = useQuery({
    queryKey: ['maintenance-rules'],
    queryFn: async () => {
      const result = await getMaintenanceRules()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch rules')
      }
      return result.data as MaintenanceRule[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteMaintenanceRule(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete rule')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-rules'] })
      toast.showSuccess('Rule deleted successfully')
      setRuleIdToDelete(null)
    },
    onError: (error) => {
      toast.showError(error instanceof Error ? error.message : 'Failed to delete rule')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const result = await toggleMaintenanceRule(id, enabled)
      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle rule')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-rules'] })
      toast.showSuccess(variables.enabled ? 'Rule enabled' : 'Rule disabled')
    },
    onError: (error) => {
      toast.showError(error instanceof Error ? error.message : 'Failed to toggle rule')
    },
  })

  const scanMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await triggerManualScan(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to trigger scan')
      }
      return result
    },
    onSuccess: () => {
      toast.showSuccess('Scan queued successfully')
      queryClient.invalidateQueries({ queryKey: ['maintenance-rules'] })
    },
    onError: (error) => {
      toast.showError(error instanceof Error ? error.message : 'Failed to trigger scan')
    },
  })

  function handleDeleteClick(id: string) {
    setRuleIdToDelete(id)
  }

  function handleDeleteConfirm() {
    if (ruleIdToDelete) {
      deleteMutation.mutate(ruleIdToDelete)
    }
  }

  function handleToggle(id: string, currentEnabled: boolean) {
    toggleMutation.mutate({ id, enabled: !currentEnabled })
  }

  function handleManualScan(id: string) {
    scanMutation.mutate(id)
  }

  function getMediaTypeLabel(mediaType: string) {
    return mediaType.replace('_', ' ')
  }

  function getActionTypeLabel(actionType: string) {
    switch (actionType) {
      case 'FLAG_FOR_REVIEW':
        return 'Flag for Review'
      case 'AUTO_DELETE':
        return 'Auto Delete'
      default:
        return actionType
    }
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
            <p className="text-red-400">Failed to load maintenance rules</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Maintenance Rules</h1>
            <p className="text-slate-400">Configure automated library maintenance rules</p>
          </div>
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

        {!rulesResult || rulesResult.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
            <svg className="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">No rules yet</h3>
            <p className="text-slate-400 mb-4">Create a maintenance rule to start automating library cleanup.</p>
            <Link
              href="/admin/maintenance/rules/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Rule
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rule Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Media Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Scans</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Run</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {rulesResult.map((rule) => {
                    const lastScan = rule.scans[0]

                    return (
                      <tr key={rule.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">{rule.name}</div>
                            {rule.description && (
                              <div className="text-xs text-slate-400 mt-1">{rule.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400">
                            {getMediaTypeLabel(rule.mediaType)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rule.actionType === 'AUTO_DELETE'
                              ? 'bg-red-400/10 text-red-400'
                              : 'bg-yellow-400/10 text-yellow-400'
                          }`}>
                            {getActionTypeLabel(rule.actionType)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggle(rule.id, rule.enabled)}
                            disabled={toggleMutation.isPending}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              rule.enabled
                                ? 'bg-green-400/10 text-green-400 hover:bg-green-400/20'
                                : 'bg-slate-400/10 text-slate-400 hover:bg-slate-400/20'
                            }`}
                          >
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {rule._count.scans} total
                          {lastScan && lastScan.itemsFlagged > 0 && (
                            <span className="ml-2 text-yellow-400">
                              ({lastScan.itemsFlagged} flagged)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {lastScan?.completedAt
                            ? new Date(lastScan.completedAt).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleManualScan(rule.id)}
                              disabled={!rule.enabled || scanMutation.isPending}
                              className="text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Run Scan"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </button>
                            <Link
                              href={`/admin/maintenance/rules/${rule.id}/edit`}
                              className="text-slate-400 hover:text-white transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(rule.id)}
                              className="text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={ruleIdToDelete !== null}
          onClose={() => setRuleIdToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Maintenance Rule"
          message="Are you sure you want to delete this rule? This will also delete all associated scans and candidates. This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        />
      </div>
    </div>
  )
}
