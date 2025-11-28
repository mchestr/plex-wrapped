"use client"

import { setLLMDisabled, updateChatLLMProvider, updateOverseerr, updatePlexServer, updateRadarr, updateSonarr, updateTautulli, updateWrappedLLMProvider } from "@/actions/admin"
import { updateDiscordIntegrationSettings } from "@/actions/discord"
import { StyledCheckbox } from "@/components/ui/styled-checkbox"
import { StyledDropdown } from "@/components/ui/styled-dropdown"
import { StyledInput } from "@/components/ui/styled-input"
import { useToast } from "@/components/ui/toast"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

interface LLMProviderFormProps {
  provider: { provider: string; model: string | null; apiKey: string; temperature: number | null; maxTokens: number | null } | null
  purpose: "chat" | "wrapped"
}

export function LLMProviderForm({ provider, purpose }: LLMProviderFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()

  const [formData, setFormData] = useState({
    provider: provider?.provider || "openai",
    apiKey: provider?.apiKey || "",
    model: provider?.model || "",
    temperature: provider?.temperature ?? (purpose === "chat" ? 0.7 : 0.8),
    maxTokens: provider?.maxTokens ?? (purpose === "chat" ? 1000 : 6000),
  })

  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [useCustomModel, setUseCustomModel] = useState(false)

  // Load models from pricing API when editing
  useEffect(() => {
    if (isEditing && formData.provider === "openai") {
      setIsLoadingModels(true)
      setModelsError(null)

      fetch("/api/admin/models")
        .then(async (res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch models")
          }
          const data = await res.json()
          if (data.models && Array.isArray(data.models)) {
            setAvailableModels(data.models)
            setModelsError(null)

            // If current model is in the list, switch to dropdown mode
            if (formData.model && data.models.includes(formData.model)) {
              setUseCustomModel(false)
            }
          } else {
            throw new Error("Invalid response format")
          }
        })
        .catch((error) => {
          setAvailableModels([])
          setModelsError(error instanceof Error ? error.message : "Failed to load models")
        })
        .finally(() => {
          setIsLoadingModels(false)
        })
    } else {
      setAvailableModels([])
      setModelsError(null)
    }
  }, [isEditing, formData.provider, formData.model])

  // Initialize useCustomModel based on whether current model is in available models
  useEffect(() => {
    if (formData.model && availableModels.length > 0) {
      setUseCustomModel(!availableModels.includes(formData.model))
    } else if (!formData.model) {
      setUseCustomModel(false)
    }
  }, [formData.model, availableModels])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.model) {
      toast.showError("Model is required")
      return
    }

    startTransition(async () => {
      const updateFn = purpose === "chat" ? updateChatLLMProvider : updateWrappedLLMProvider
      const result = await updateFn({
        provider: formData.provider,
        apiKey: formData.apiKey,
        model: formData.model!,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
      })

      if (result.success) {
        setIsEditing(false)
        toast.showSuccess(`${purpose === "chat" ? "Chat" : "Wrapped"} LLM provider updated successfully`)
        router.refresh()
      } else {
        toast.showError(result.error || `Failed to update ${purpose} LLM provider`)
      }
    })
  }

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {provider ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Provider</div>
                <div className="text-sm text-white">
                  <span className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs font-medium">
                    {provider.provider.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Model</div>
                <div className="text-sm text-white font-mono">
                  {provider.model || "Not configured"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Temperature</div>
                <div className="text-sm text-white">
                  {provider.temperature ?? `Default (${purpose === "chat" ? "0.7" : "0.8"})`}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Max Tokens</div>
                <div className="text-sm text-white">
                  {provider.maxTokens ?? `Default (${purpose === "chat" ? "1000" : "6000"})`}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">No LLM provider configured</div>
          )}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="ml-4 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-medium rounded transition-all flex items-center"
        >
          Edit
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Provider</label>
          <StyledDropdown
            value={formData.provider}
            onChange={(value) => setFormData({ ...formData, provider: value })}
            options={[
              { value: "openai", label: "OpenAI" },
            ]}
            size="md"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Model <span className="text-red-400">*</span></label>
          {!useCustomModel && availableModels.length > 0 ? (
            <StyledDropdown
              value={formData.model || ""}
              onChange={(value) => {
                if (value === "__custom__") {
                  setUseCustomModel(true)
                  setFormData({ ...formData, model: "" })
                } else {
                  setFormData({ ...formData, model: value })
                }
              }}
              options={[
                { value: "", label: "Select a model" },
                ...availableModels.map((model) => ({ value: model, label: model })),
                { value: "__custom__", label: "Enter custom model..." },
              ]}
              size="md"
            />
          ) : useCustomModel || (formData.apiKey && availableModels.length === 0 && !isLoadingModels) ? (
            <StyledInput
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="gpt-4, gpt-3.5-turbo, etc."
              required
              disabled={isPending}
            />
          ) : (
            <div className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-400">
              {isLoadingModels ? "Loading models..." : "Available models"}
            </div>
          )}
          {modelsError && (
            <p className="mt-1 text-xs text-yellow-400">
              {modelsError} - You can still enter a model manually
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
          <StyledInput
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder="sk-..."
            required
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Temperature (0.0-2.0)
            <span className="text-slate-500 ml-1">(optional, default: {purpose === "chat" ? "0.7" : "0.8"})</span>
          </label>
          <StyledInput
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || (purpose === "chat" ? 0.7 : 0.8) })}
            placeholder={purpose === "chat" ? "0.7" : "0.8"}
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-slate-500">
            Note: GPT-5 models only support temperature 1 (default)
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Max Tokens (1-100000)
            <span className="text-slate-500 ml-1">(optional, default: {purpose === "chat" ? "1000" : "6000"})</span>
          </label>
          <StyledInput
            type="number"
            min="1"
            max="100000"
            step="1"
            value={formData.maxTokens}
            onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || (purpose === "chat" ? 1000 : 6000) })}
            placeholder={purpose === "chat" ? "1000" : "6000"}
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-slate-500">
            Maximum number of tokens to generate in the response
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false)
            setFormData({
              provider: provider?.provider || "openai",
              apiKey: provider?.apiKey || "",
              model: provider?.model || "",
              temperature: provider?.temperature ?? (purpose === "chat" ? 0.7 : 0.8),
              maxTokens: provider?.maxTokens ?? (purpose === "chat" ? 1000 : 6000),
            })
            setAvailableModels([])
            setModelsError(null)
            setUseCustomModel(false)
          }}
          disabled={isPending}
          className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface ServerFormProps {
  type: "plex" | "tautulli" | "overseerr" | "sonarr" | "radarr"
  server: { name: string; url: string; token?: string; apiKey?: string; publicUrl?: string | null } | null
}

export function ServerForm({ type, server }: ServerFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: server?.name || "",
    url: server?.url || "",
    publicUrl: server?.publicUrl || "",
    token: server?.token || "",
    apiKey: server?.apiKey || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      let result
      if (type === "plex") {
        result = await updatePlexServer({
          name: formData.name,
          url: formData.url,
          token: formData.token!,
          publicUrl: formData.publicUrl || undefined,
        })
      } else if (type === "tautulli") {
        result = await updateTautulli({
          name: formData.name,
          url: formData.url,
          apiKey: formData.apiKey!,
          publicUrl: formData.publicUrl || undefined,
        })
      } else if (type === "overseerr") {
        result = await updateOverseerr({
          name: formData.name,
          url: formData.url,
          apiKey: formData.apiKey!,
          publicUrl: formData.publicUrl || undefined,
        })
      } else if (type === "sonarr") {
        result = await updateSonarr({
          name: formData.name,
          url: formData.url,
          apiKey: formData.apiKey!,
          publicUrl: formData.publicUrl || undefined,
        })
      } else {
        result = await updateRadarr({
          name: formData.name,
          url: formData.url,
          apiKey: formData.apiKey!,
          publicUrl: formData.publicUrl || undefined,
        })
      }

      if (result.success) {
        setIsEditing(false)
        toast.showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} configuration updated successfully`)
        router.refresh()
      } else {
        toast.showError(result.error || `Failed to update ${type} configuration`)
      }
    })
  }

  if (!isEditing) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {server ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-slate-400 mb-1">Name</div>
                <div className="text-white">{server.name}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Local URL</div>
                <div className="text-white font-mono text-xs">{server.url}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Public URL</div>
                <div className="text-white font-mono text-xs">{server.publicUrl || "Not set"}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">No {type} server configured</div>
          )}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="ml-4 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-medium rounded transition-all whitespace-nowrap flex items-center"
        >
          Edit
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
          <StyledInput
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={`My ${type.charAt(0).toUpperCase() + type.slice(1)} Server`}
            required
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Local URL</label>
          <StyledInput
            type="text"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder={type === "plex" ? "https://example.com:32400" : type === "tautulli" ? "http://example.com:8181" : type === "overseerr" ? "http://example.com:5055" : type === "sonarr" ? "http://example.com:8989" : "http://example.com:7878"}
            required
            disabled={isPending}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Public URL <span className="text-slate-500 font-normal">(optional, e.g. https://{type}.example.com)</span>
          </label>
          <StyledInput
            type="text"
            value={formData.publicUrl}
            onChange={(e) => setFormData({ ...formData, publicUrl: e.target.value })}
            placeholder={`https://${type}.example.com`}
            disabled={isPending}
          />
        </div>
        {type === "plex" ? (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Plex Token</label>
            <StyledInput
              type="password"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              placeholder="Plex authentication token"
              required
              disabled={isPending}
            />
          </div>
        ) : (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
            <StyledInput
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} API key`}
              required
              disabled={isPending}
            />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
          <button
          type="button"
          onClick={() => {
            setIsEditing(false)
            setFormData({
              name: server?.name || "",
              url: server?.url || "",
              publicUrl: server?.publicUrl || "",
              token: server?.token || "",
              apiKey: server?.apiKey || "",
            })
          }}
          disabled={isPending}
          className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface LLMToggleProps {
  disabled: boolean
}

export function LLMToggle({ disabled }: LLMToggleProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await setLLMDisabled(!disabled)
      if (result.success) {
        toast.showSuccess(`LLM ${!disabled ? "disabled" : "enabled"} successfully`)
        router.refresh()
      } else {
        toast.showError(result.error || "Failed to update LLM status")
      }
    })
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-medium rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
      >
        {isPending ? "Updating..." : disabled ? "Enable LLM" : "Disable LLM"}
      </button>
    </div>
  )
}

interface DiscordIntegrationFormProps {
  integration: {
    isEnabled: boolean
    botEnabled?: boolean | null
    clientId?: string | null
    clientSecret?: string | null
    guildId?: string | null
    serverInviteCode?: string | null
    platformName?: string | null
    instructions?: string | null
    updatedAt?: Date
  } | null
  linkedCount: number
  portalUrl: string
}

/**
 * Parses a Discord invite code from either a full URL or just the code
 * Examples:
 * - https://discord.gg/axzpDYH6jz -> axzpDYH6jz
 * - discord.gg/axzpDYH6jz -> axzpDYH6jz
 * - axzpDYH6jz -> axzpDYH6jz
 */
function parseDiscordInviteCode(input: string): string {
  if (!input) return ""

  const trimmed = input.trim()

  // Match Discord invite URLs (https://discord.gg/CODE or discord.gg/CODE)
  const urlMatch = trimmed.match(/discord\.gg\/([a-zA-Z0-9]+)/i)
  if (urlMatch) {
    return urlMatch[1]
  }

  // If it's already just a code, return as-is
  return trimmed
}

export function DiscordIntegrationForm({ integration, linkedCount, portalUrl }: DiscordIntegrationFormProps) {
  const router = useRouter()
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const initialState = {
    isEnabled: integration?.isEnabled ?? false,
    botEnabled: integration?.botEnabled ?? false,
    clientId: integration?.clientId ?? "",
    clientSecret: integration?.clientSecret ?? "",
    guildId: integration?.guildId ?? "",
    serverInviteCode: integration?.serverInviteCode ?? "",
    platformName: integration?.platformName ?? "Plex Wrapped",
    instructions: integration?.instructions ?? "",
  }

  const [formData, setFormData] = useState(initialState)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    startTransition(async () => {
      const result = await updateDiscordIntegrationSettings({
        ...formData,
      })

      if (result.success) {
        setIsEditing(false)
        toast.showSuccess("Discord settings updated successfully")
        router.refresh()
      } else {
        toast.showError(result.error || "Failed to update Discord settings")
      }
    })
  }

  if (!isEditing) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          {integration ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Linked Accounts</div>
                <div className="text-sm text-white">{linkedCount}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Bot Status</div>
                <div className="text-sm text-white">
                  {integration.botEnabled ? (
                    <span className="px-2 py-1 bg-green-500/15 text-green-300 border border-green-500/30 rounded text-xs font-medium">
                      Enabled
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-slate-800/60 text-slate-300 border border-slate-600/70 rounded text-xs font-medium">
                      Disabled
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Portal URL</div>
                <div className="text-xs text-white font-mono truncate" title={portalUrl}>
                  {portalUrl}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">No Discord integration configured</div>
          )}
          {integration?.instructions && (
            <div>
              <div className="text-xs font-medium text-slate-400 mb-1">Instructions</div>
              <p className="text-sm text-slate-300 whitespace-pre-line border border-slate-700 rounded-lg p-3 bg-slate-900/40">
                {integration.instructions}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setIsEditing(true)
          }}
          className="ml-4 px-3 py-1 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-medium rounded transition-all flex items-center whitespace-nowrap"
        >
          Edit
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4 p-4 bg-slate-900/30 border border-slate-700 rounded-lg">
        <StyledCheckbox
          id="discord-enabled"
          checked={formData.isEnabled}
          onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
          disabled={isPending}
          label="Enable Discord Linked Roles"
          description="Allow users to link their Discord account and verify Plex access through Discord Linked Roles"
        />
        <StyledCheckbox
          id="discord-bot-enabled"
          checked={formData.botEnabled}
          onChange={(e) => setFormData({ ...formData, botEnabled: e.target.checked })}
          disabled={isPending}
          label="Enable Discord Bot"
          description="Automatically monitor support channels and verify user roles (runs automatically when enabled)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Client ID {formData.isEnabled && <span className="text-red-400">*</span>}
          </label>
          <StyledInput
            type="text"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            placeholder="Discord application client ID"
            required={formData.isEnabled}
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Client Secret {formData.isEnabled && <span className="text-red-400">*</span>}
          </label>
          <StyledInput
            type="password"
            value={formData.clientSecret}
            onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
            placeholder="Discord application client secret"
            required={formData.isEnabled}
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Guild ID <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <StyledInput
            type="text"
            value={formData.guildId}
            onChange={(e) => setFormData({ ...formData, guildId: e.target.value })}
            placeholder="Discord server (guild) ID"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Server Invite Code <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <StyledInput
            type="text"
            value={formData.serverInviteCode}
            onChange={(e) => {
              const value = e.target.value
              // Parse Discord invite link if full URL is pasted
              const parsedCode = parseDiscordInviteCode(value)
              setFormData({ ...formData, serverInviteCode: parsedCode })
            }}
            placeholder="Discord invite code or full link (e.g., abc123 or https://discord.gg/abc123)"
            disabled={isPending}
          />
          <p className="text-xs text-slate-500 mt-1">
            Paste the invite code or full Discord invite link (e.g., https://discord.gg/axzpDYH6jz)
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Platform Name</label>
          <StyledInput
            type="text"
            value={formData.platformName}
            onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
            placeholder="Displayed in Discord profile"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Server Notes for Onboarding <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Custom notes displayed to users during the onboarding guide's Discord support step. Use this to provide server-specific instructions or important information.
        </p>
        <textarea
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="e.g., Join our Discord server and mention your username in #support for faster help..."
          disabled={isPending}
          className="w-full min-h-[120px] bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false)
            setFormData(initialState)
          }}
          disabled={isPending}
          className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

