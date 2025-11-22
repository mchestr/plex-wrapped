"use client"

import { useState, useMemo } from "react"
import { UserTableRow } from "./user-table-row"
import { UsersFilter, type UsersFilter as UsersFilterType } from "./users-filter"

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  plexUserId: string | null
  isAdmin: boolean
  wrappedStatus: string | null
  wrappedGeneratedAt: Date | null
  totalWrappedCount: number
  hasPlexAccess: boolean | null
  totalLlmUsage: {
    totalTokens: number
    promptTokens: number
    completionTokens: number
    cost: number
    provider: string | null
    model: string | null
    count: number
  } | null
  llmUsage: {
    totalTokens: number
    promptTokens: number
    completionTokens: number
    cost: number
    provider: string | null
    model: string | null
    count: number
  } | null
  createdAt: Date
}

interface UsersListClientProps {
  users: User[]
  currentYear: number
}

export function UsersListClient({ users, currentYear }: UsersListClientProps) {
  const [filter, setFilter] = useState<UsersFilterType>({
    plexAccess: "yes",
    role: "all",
    wrappedStatus: "all",
  })

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Filter by Plex Access
      if (filter.plexAccess !== "all") {
        if (filter.plexAccess === "yes" && user.hasPlexAccess !== true) return false
        if (filter.plexAccess === "no" && user.hasPlexAccess !== false) return false
        if (filter.plexAccess === "unknown" && user.hasPlexAccess !== null) return false
      }

      // Filter by Role
      if (filter.role !== "all") {
        if (filter.role === "admin" && !user.isAdmin) return false
        if (filter.role === "user" && user.isAdmin) return false
      }

      // Filter by Wrapped Status
      if (filter.wrappedStatus !== "all") {
        if (filter.wrappedStatus === "completed" && user.wrappedStatus !== "completed") return false
        if (filter.wrappedStatus === "generating" && user.wrappedStatus !== "generating") return false
        if (filter.wrappedStatus === "failed" && user.wrappedStatus !== "failed") return false
        if (filter.wrappedStatus === "none" && user.wrappedStatus !== null) return false
      }

      return true
    })
  }, [users, filter])

  return (
    <>
      <UsersFilter onFilterChange={setFilter} />

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg relative z-0">
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full table-fixed">
            <thead className="bg-slate-700/30 border-b border-slate-700">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-40">
                  User
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-16">
                  Role
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-20">
                  Wraps
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">
                  Plex Access
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">
                  <div>Cost</div>
                  <div className="text-xs font-normal text-slate-500">(All Time)</div>
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">
                  Created
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-slate-400">
                    No users found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <UserTableRow key={user.id} user={user} currentYear={currentYear} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

