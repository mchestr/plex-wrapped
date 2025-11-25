import { getAdminSettings } from "@/actions/admin"
import { DiscordIntegrationForm, LLMProviderForm, LLMToggle, ServerForm } from "@/components/admin/settings/settings-edit-forms"
import { WrappedSettingsForm } from "@/components/admin/settings/wrapped-settings-form"
import { getBaseUrl } from "@/lib/utils"

export const dynamic = 'force-dynamic'

type BadgeTone = "success" | "warning" | "danger" | "neutral"

type StatusBadgeProps = {
  label: string
  tone?: BadgeTone
  tooltip?: string
}

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-green-500/15 text-green-300 border border-green-500/30",
  warning: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  danger: "bg-red-500/15 text-red-300 border border-red-500/30",
  neutral: "bg-slate-800/60 text-slate-300 border border-slate-600/70",
}

function StatusBadge({ label, tone = "neutral", tooltip }: StatusBadgeProps) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${toneClasses[tone]}`}
      aria-label={tooltip ?? label}
      title={tooltip ?? label}
    >
      {label}
    </span>
  )
}

type FeatureStatusBadgeProps = {
  featureName: string
  enabled: boolean
}

function FeatureStatusBadge({ featureName, enabled }: FeatureStatusBadgeProps) {
  const label = enabled ? "Feature Enabled" : "Feature Disabled"
  const tooltip = `${featureName} ${label}`
  return (
    <StatusBadge
      label={label}
      tone={enabled ? "success" : "neutral"}
      tooltip={tooltip}
    />
  )
}

export default async function SettingsPage() {
  const settings = await getAdminSettings()
  const baseUrl = getBaseUrl()
  const discordPortalUrl = `${baseUrl}/discord/link`
  const nodeVersion = process.version
  const nodeEnv = process.env.NODE_ENV || "development"
  const databaseProvider = (() => {
    const url = process.env.DATABASE_URL
    if (!url) return "Not configured"
    if (url.startsWith("postgres")) return "PostgreSQL"
    if (url.startsWith("file:") || url.startsWith("sqlite:")) return "SQLite"
    return "Unknown"
  })()

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-sm text-slate-400">
              Manage application configuration and system settings
            </p>
          </div>

          <div className="space-y-6">
            {/* Application Settings */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Application Settings
                </h2>
                <p className="text-xs text-slate-400 mt-1">Core application configuration</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-1">Base URL</div>
                    <div className="text-sm text-white font-mono">{baseUrl}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-1">Environment</div>
                    <StatusBadge
                      label={nodeEnv.toUpperCase()}
                      tone={nodeEnv === "production" ? "success" : "warning"}
                      tooltip={`Environment: ${nodeEnv}`}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-1">Node.js Version</div>
                    <div className="text-sm text-white font-mono">{nodeVersion}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-1">LLM Feature</div>
                    <div className="flex items-center gap-2">
                      <FeatureStatusBadge
                        featureName="LLM"
                        enabled={!settings.config.llmDisabled}
                      />
                      <LLMToggle disabled={settings.config.llmDisabled} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LLM Configuration */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  LLM Configuration
                </h2>
                <p className="text-xs text-slate-400 mt-1">AI provider and model settings for chat assistant and wrapped generation</p>
              </div>
              <div className="p-4 space-y-6">
                {/* Chat Assistant Configuration */}
                <div className="border border-slate-700 rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Chat Assistant
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Configuration for the admin troubleshooting chatbot</p>
                  </div>
                  <LLMProviderForm
                    provider={settings.chatLLMProvider}
                    purpose="chat"
                  />
                </div>

                {/* Wrapped Generation Configuration */}
                <div className="border border-slate-700 rounded-lg p-4">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Wrapped Generation
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Feature controls for generating Plex Wrapped content</p>
                    </div>
                    <FeatureStatusBadge
                      featureName="Plex Wrapped"
                      enabled={settings.config.wrappedEnabled ?? true}
                    />
                  </div>
                  <div className="space-y-4">
                    <WrappedSettingsForm
                      enabled={settings.config.wrappedEnabled ?? true}
                      year={settings.config.wrappedYear}
                    />
                    <div className="pt-4 border-t border-slate-700">
                      <LLMProviderForm
                        provider={settings.wrappedLLMProvider}
                        purpose="wrapped"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Discord Integration */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.22 3.5a1 1 0 0 1 .78-.38h6a1 1 0 0 1 .78.38l1.5 1.86a1 1 0 0 0 .77.37h1.74a1 1 0 0 1 1 1V18a3 3 0 0 1-3 3h-9.5a3 3 0 0 1-3-3V4.5a1 1 0 0 1 .93-1z" />
                    </svg>
                    Discord Linked Roles
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Centralize the Discord Linked Roles feature that controls bot access.
                  </p>
                </div>
                <FeatureStatusBadge
                  featureName="Discord Linked Roles"
                  enabled={Boolean(settings.discordIntegration?.isEnabled)}
                />
              </div>
              <div className="p-4">
                <DiscordIntegrationForm
                  integration={settings.discordIntegration}
                  linkedCount={settings.discordLinkedCount}
                  portalUrl={discordPortalUrl}
                  verificationUrl={`${baseUrl}/api/discord/verify`}
                />
              </div>
            </div>

            {/* Server Configuration */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  Server Configuration
                </h2>
                <p className="text-xs text-slate-400 mt-1">Connected media server integrations</p>
              </div>
              <div className="p-4 space-y-4">
                {/* Plex Server */}
                <div className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11V7h2v4h4v2h-4v4h-2v-4H7v-2h4z"/>
                      </svg>
                      Plex Server
                    </h3>
                    <FeatureStatusBadge
                      featureName="Plex integration"
                      enabled={Boolean(settings.plexServer)}
                    />
                  </div>
                  <ServerForm type="plex" server={settings.plexServer} />
                </div>

                {/* Tautulli */}
                <div className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Tautulli
                    </h3>
                    <FeatureStatusBadge
                      featureName="Tautulli integration"
                      enabled={Boolean(settings.tautulli)}
                    />
                  </div>
                  <ServerForm type="tautulli" server={settings.tautulli} />
                </div>

                {/* Overseerr */}
                <div className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Overseerr
                    </h3>
                    <FeatureStatusBadge
                      featureName="Overseerr integration"
                      enabled={Boolean(settings.overseerr)}
                    />
                  </div>
                  <ServerForm type="overseerr" server={settings.overseerr} />
                </div>

                {/* Sonarr */}
                <div className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Sonarr
                    </h3>
                    <FeatureStatusBadge
                      featureName="Sonarr integration"
                      enabled={Boolean(settings.sonarr)}
                    />
                  </div>
                  <ServerForm type="sonarr" server={settings.sonarr} />
                </div>

                {/* Radarr */}
                <div className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Radarr
                    </h3>
                    <FeatureStatusBadge
                      featureName="Radarr integration"
                      enabled={Boolean(settings.radarr)}
                    />
                  </div>
                  <ServerForm type="radarr" server={settings.radarr} />
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  System Information
                </h2>
                <p className="text-xs text-slate-400 mt-1">Runtime and database information</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-1">Database Provider</div>
                    <div className="text-sm text-white">{databaseProvider}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-1">Database URL</div>
                    <div className="text-sm text-slate-400 font-mono text-xs truncate">
                      {process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***@") || "Not configured"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-1">Last Config Update</div>
                    <div className="text-sm text-slate-300">
                      {settings.config.updatedAt
                        ? new Date(settings.config.updatedAt).toLocaleString()
                        : "Never"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-1">Platform</div>
                    <div className="text-sm text-white">
                      {process.platform === "darwin" ? "macOS" : process.platform === "win32" ? "Windows" : process.platform === "linux" ? "Linux" : process.platform}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
      </div>
    </div>
  )
}

