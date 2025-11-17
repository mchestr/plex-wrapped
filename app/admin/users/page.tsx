import { getAllUsersWithWrapped } from "@/actions/users"
import { SignOutButton } from "@/components/admin/sign-out-button"
import { UserTableRow } from "@/components/admin/user-table-row"
import { UsersStatsSummary } from "@/components/admin/users-stats-summary"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  if (!session.user.isAdmin) {
    redirect("/")
  }

  const currentYear = new Date().getFullYear()
  const users = await getAllUsersWithWrapped(currentYear)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
            <p className="text-sm text-slate-400">
              {users.length} user{users.length !== 1 ? "s" : ""} in database
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/shares"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded transition-colors"
            >
              Share Analytics
            </Link>
            <Link
              href="/admin/llm-usage"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
            >
              LLM Usage & Tokens
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-slate-700/30 border-b border-slate-700">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-40">
                    User
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">
                    Plex ID
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-16">
                    Role
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-28">
                    {currentYear} Wrapped
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-20">
                    Total
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-16">
                    Shares
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-20">
                    Visits
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-28">
                    <div>Tokens</div>
                    <div className="text-xs font-normal text-slate-500">(All Time)</div>
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
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-2 py-8 text-center text-slate-400">
                      No users found. Users will appear here after they sign in with their Plex account.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <UserTableRow key={user.id} user={user} currentYear={currentYear} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <UsersStatsSummary users={users} />
      </div>
    </main>
  )
}

