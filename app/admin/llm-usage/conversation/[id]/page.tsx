import { getLLMUsageRecords } from "@/actions/admin"
import { aggregateLlmUsage } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatTimeRange(start: Date, end: Date) {
  const sameDay = start.toDateString() === end.toDateString()
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const startDate = dateFormatter.format(start)
  const endDate = dateFormatter.format(end)
  const startTime = timeFormatter.format(start)
  const endTime = timeFormatter.format(end)

  if (sameDay) {
    // Example: "Nov 24 · 10:12–10:14"
    return `${startDate} · ${startTime}–${endTime}`
  }

  // Example: "Nov 24 10:12 → Nov 25 11:03"
  return `${startDate} ${startTime} → ${endDate} ${endTime}`
}

function getDurationLabel(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime()
  if (ms <= 0) return "0s"
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remSeconds = seconds % 60
  if (minutes < 60) {
    return remSeconds > 0 ? `${minutes}m ${remSeconds}s` : `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`
}

function getLastUserSnippet(prompt: string, maxLength: number = 80): string | null {
  try {
    const parsed = JSON.parse(prompt) as Array<{ role?: string; content?: unknown }>
    if (!Array.isArray(parsed)) return null
    const userMessages = parsed.filter((m) => m.role === "user" && typeof m.content === "string")
    const last = userMessages[userMessages.length - 1]
    if (!last || typeof last.content !== "string") return null
    const trimmed = last.content.trim()
    if (!trimmed) return null
    if (trimmed.length <= maxLength) return trimmed
    return trimmed.slice(0, maxLength - 1) + "…"
  } catch {
    return null
  }
}

export default async function LLMConversationPage({
  params,
}: {
  params: { id: string }
}) {
  const conversationId = params.id

  // For now, fetch first page with a generous page size – chatbot conversations are short
  const { records } = await getLLMUsageRecords(1, 100, undefined, conversationId)

  if (!records.length) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/admin/llm-usage"
            className="text-sm text-cyan-400 hover:text-cyan-300 mb-4 inline-block"
          >
            ← Back to LLM Requests
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Conversation LLM Usage
          </h1>
          <p className="text-sm text-slate-400">
            No LLM usage records were found for this conversation.
          </p>
        </div>
      </div>
    )
  }

  const summary = aggregateLlmUsage(
    records.map((r) => ({
      totalTokens: r.totalTokens,
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
      cost: r.cost,
      provider: r.provider,
      model: r.model,
    }))
  )

  const user = records[0].user
  const startedAt = records.reduce(
    (earliest, r) => (r.createdAt < earliest ? r.createdAt : earliest),
    records[0].createdAt
  )
  const endedAt = records.reduce(
    (latest, r) => (r.createdAt > latest ? r.createdAt : latest),
    records[0].createdAt
  )
  const callsCount = records.length

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/llm-usage"
            className="text-sm text-cyan-400 hover:text-cyan-300 mb-4 inline-block"
          >
            ← Back to LLM Requests
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Conversation LLM Usage
          </h1>
          <p className="text-sm text-slate-400">
            Inspect individual LLM calls that belong to this chat conversation.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">User</div>
            <div className="flex items-center gap-2">
              {user.image ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-slate-400 text-xs font-medium">
                    {(user.name || user.email || "U")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-white">
                  {user.name || "Unknown"}
                </div>
                {user.email && (
                  <div className="text-xs text-slate-400">{user.email}</div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Conversation Summary</div>
            <div className="text-2xl font-bold text-cyan-400">
              {callsCount} call{callsCount === 1 ? "" : "s"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {formatTimeRange(startedAt, endedAt)} ({getDurationLabel(startedAt, endedAt)})
            </div>
            {summary?.model && (
              <div className="text-xs text-slate-500 mt-1">
                Model: <span className="font-mono text-slate-300">{summary.model}</span>
              </div>
            )}
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Total Usage</div>
            <div className="text-2xl font-bold text-green-400">
              ${summary?.cost.toFixed(4) ?? "0.0000"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {summary?.totalTokens.toLocaleString() ?? "0"} tokens
            </div>
            <div className="text-xs text-slate-500">
              {summary?.promptTokens.toLocaleString() ?? "0"} prompt +{" "}
              {summary?.completionTokens.toLocaleString() ?? "0"} completion
            </div>
          </div>
        </div>

        {/* Per-call table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/30 border-b border-slate-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    Model
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {records.map((record, index) => {
                  const promptSnippet = getLastUserSnippet(record.prompt)
                  return (
                  <tr key={record.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-300">
                      #{index + 1}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-slate-300">
                        {formatDateTime(record.createdAt)}
                      </div>
                      {promptSnippet && (
                        <div className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                          <span className="uppercase tracking-wide mr-1">User:</span>
                          {promptSnippet}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-slate-300 font-mono truncate max-w-[160px]">
                        {record.model || <span className="text-slate-500">—</span>}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-white font-medium">
                          {record.totalTokens.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 hidden sm:block">
                          {record.promptTokens.toLocaleString()} +{" "}
                          {record.completionTokens.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-400 font-medium">
                        ${record.cost.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/llm-usage/${record.id}`}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded transition-colors inline-block"
                      >
                        View Request
                      </Link>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


