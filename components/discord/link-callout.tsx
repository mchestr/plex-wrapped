"use client"

import Link from "next/link"

export interface DashboardDiscordConnection {
  username: string
  discriminator?: string | null
  globalName?: string | null
  linkedAt?: string | null
  metadataSyncedAt?: string | null
}

interface DiscordLinkCalloutProps {
  connection: DashboardDiscordConnection | null
  isEnabled: boolean
  connectUrl?: string
}

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return "Pending"
  }
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

const defaultConnectUrl = "/discord/connect?redirect=%2Fdiscord%2Flink"

export function DiscordLinkCallout({ connection, isEnabled, connectUrl = defaultConnectUrl }: DiscordLinkCalloutProps) {
  if (!isEnabled) {
    return (
      <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 text-left text-slate-300 shadow-2xl shadow-black/40 ring-1 ring-white/5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Discord linking</p>
        <p className="mt-2 text-lg font-semibold text-white">Temporarily unavailable</p>
        <p className="mt-1 text-sm text-slate-400">
          Discord support is offline while the integration is being configured. Check back soon.
        </p>
      </div>
    )
  }

  const isConnected = Boolean(connection)
  const primaryHref = isConnected ? "/discord/link" : connectUrl
  const primaryLabel = isConnected ? "View Discord status" : "Link Discord"
  const secondaryHref = isConnected ? connectUrl : "/discord/link"
  const secondaryLabel = isConnected ? "Re-link account" : "See instructions"

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-slate-950/80 p-6 sm:p-8 shadow-2xl shadow-cyan-900/30 ring-1 ring-white/10 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Discord support</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Keep access verified</h3>
          <p className="mt-1 text-sm text-slate-300">
            We use a Discord Linked Role to confirm you still have Plex access. Stay linked to reach moderators and the
            support bot without delays.
          </p>
        </div>
        <span
          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
            isConnected
              ? "text-emerald-300 bg-emerald-500/10 border border-emerald-500/40"
              : "text-amber-300 bg-amber-500/10 border border-amber-500/40"
          }`}
        >
          {isConnected ? "Linked" : "Not linked"}
        </span>
      </div>

      {isConnected ? (
        <dl className="mt-6 grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Connected as</dt>
            <dd className="mt-2 text-base font-semibold text-white">
              {connection?.globalName || connection?.username}
              {connection?.discriminator ? `#${connection.discriminator}` : ""}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Last synced</dt>
            <dd className="mt-2 text-base font-semibold text-white">{formatTimestamp(connection?.metadataSyncedAt)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-6 text-sm text-slate-300">
          Your Plex membership hasn’t been matched to Discord yet. Start the Linked Roles flow to unlock the private
          support bot.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={primaryHref}
          className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01]"
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex min-w-[180px] items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  )
}


