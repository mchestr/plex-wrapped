import { getConfig } from "@/actions/admin"
import { getShareAnalyticsStats } from "@/actions/share-analytics"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLLMUsageStats } from "@/lib/wrapped/usage"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { LLMToggle } from "./admin/llm-toggle"

export async function AdminFooter() {
  const session = await getServerSession(authOptions)

  // Only show admin panel if user is admin
  if (!session?.user?.isAdmin) {
    return null
  }

  // Fetch token/cost stats, total users, and share stats
  const [stats, totalUsers, shareStats] = await Promise.all([
    getLLMUsageStats(),
    prisma.user.count(),
    getShareAnalyticsStats(),
  ])
  const config = await getConfig()

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm border-t border-slate-700 px-4 py-2 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            <span className="text-slate-500">User:</span>{" "}
            <span className="text-white font-mono">
              {session?.user?.name || session?.user?.email || "Anonymous"}
            </span>
          </span>
          {session && (
            <>
              <span className="text-slate-600">|</span>
              <span>
                <span className="text-slate-500">Admin:</span>{" "}
                <span
                  className={`font-mono ${
                    session.user.isAdmin ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {session.user.isAdmin ? "Yes" : "No"}
                </span>
              </span>
              {session.user.id && (
                <>
                  <span className="text-slate-600">|</span>
                  <span>
                    <span className="text-slate-500">ID:</span>{" "}
                    <span className="text-white font-mono text-[10px]">
                      {session.user.id.slice(0, 8)}...
                    </span>
                  </span>
                </>
              )}
              <span className="text-slate-600">|</span>
              <span>
                <span className="text-slate-500">Tokens:</span>{" "}
                <span className="text-cyan-400 font-mono">
                  {stats.totalTokens.toLocaleString()}
                </span>
              </span>
              <span className="text-slate-600">|</span>
              <span>
                <span className="text-slate-500">Cost:</span>{" "}
                <span className="text-green-400 font-mono">
                  ${stats.totalCost.toFixed(4)}
                </span>
              </span>
              <span className="text-slate-600">|</span>
              <span>
                <span className="text-slate-500">Users:</span>{" "}
                <span className="text-purple-400 font-mono">
                  {totalUsers.toLocaleString()}
                </span>
              </span>
              <span className="text-slate-600">|</span>
              <span>
                <span className="text-slate-500">Generations:</span>{" "}
                <span className="text-blue-400 font-mono">
                  {stats.totalRequests.toLocaleString()}
                </span>
              </span>
              <span className="text-slate-600">|</span>
              <Link
                href="/admin/shares"
                className="hover:text-cyan-300 transition-colors"
              >
                <span className="text-slate-500">Shares:</span>{" "}
                <span className="text-cyan-400 font-mono">
                  {shareStats.totalShares.toLocaleString()}
                </span>
              </Link>
              <span className="text-slate-600">|</span>
              <Link
                href="/admin/shares"
                className="hover:text-green-300 transition-colors"
              >
                <span className="text-slate-500">Visits:</span>{" "}
                <span className="text-green-400 font-mono">
                  {shareStats.totalVisits.toLocaleString()}
                </span>
              </Link>
              <span className="text-slate-600">|</span>
              <LLMToggle initialDisabled={config.llmDisabled} />
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
          >
            Home
          </Link>
          <Link
            href="/admin"
            className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
          >
            Dashboard →
          </Link>
        </div>
      </div>
    </footer>
  )
}

