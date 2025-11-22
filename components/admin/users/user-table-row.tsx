"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { RegenerateWrappedButton } from "./regenerate-wrapped-button"
import { UnshareUserButton } from "./unshare-user-button"
import { UserStatusBadge } from "./user-status-badge"

interface UserTableRowProps {
  user: {
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
  currentYear: number
}

export function UserTableRow({ user, currentYear }: UserTableRowProps) {
  const router = useRouter()

  const handleRowClick = () => {
    router.push(`/admin/users/${user.id}`)
  }

  return (
    <tr
      key={user.id}
      className="hover:bg-slate-700/20 transition-colors cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="px-2 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {user.image ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <span className="text-slate-400 text-xs font-medium">
                {(user.name || user.email || "U")[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-white truncate">
              {user.name || "Unknown"}
            </div>
            {user.email && (
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        {user.isAdmin ? (
          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">
            Admin
          </span>
        ) : (
          <span className="px-1.5 py-0.5 bg-slate-700/50 text-slate-300 text-xs font-medium rounded">
            User
          </span>
        )}
      </td>
      <td className="px-2 py-2">
        <span className="text-xs text-slate-300">
          {user.totalWrappedCount}
        </span>
      </td>
      <td className="px-2 py-2">
        <div className="text-xs">
          {user.hasPlexAccess === true ? (
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 font-medium rounded">
              Yes
            </span>
          ) : user.hasPlexAccess === false ? (
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 font-medium rounded">
              No
            </span>
          ) : (
            <span className="text-slate-500">—</span>
          )}
        </div>
      </td>
      <td className="px-2 py-2">
        {user.totalLlmUsage ? (
          <div className="text-xs">
            <Link
              href={`/admin/llm-usage?userId=${user.id}`}
              className="text-green-400 font-medium hover:text-green-300 transition-colors underline"
            >
              ${user.totalLlmUsage.cost.toFixed(3)}
            </Link>
            <div className="text-xs text-slate-400 truncate">
              {user.totalLlmUsage.provider}
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-500">—</span>
        )}
      </td>
      <td className="px-2 py-2">
        <div className="text-xs text-slate-400">
          {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
        </div>
        <div className="text-xs text-slate-500">
          {new Date(user.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
          {user.wrappedStatus === "completed" ? (
            <>
              <Link
                href={`/admin/users/${user.id}/wrapped`}
                className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded transition-colors inline-block text-center"
              >
                View
              </Link>
              <RegenerateWrappedButton userId={user.id} />
            </>
          ) : user.wrappedStatus ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">
                {user.wrappedStatus === "generating" ? "Generating..." : "Not ready"}
              </span>
              {user.wrappedStatus === "failed" && (
                <RegenerateWrappedButton userId={user.id} />
              )}
            </div>
          ) : (
            <RegenerateWrappedButton userId={user.id} />
          )}
          {/* Show unshare button only for non-admin users with Plex access */}
          {!user.isAdmin && user.hasPlexAccess === true && (
            <UnshareUserButton userId={user.id} userName={user.name} />
          )}
        </div>
      </td>
    </tr>
  )
}

