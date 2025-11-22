"use client"

import { setLLMDisabled, updateLLMProvider, updateOverseerr, updatePlexServer, updateTautulli } from "@/actions/admin"
import { StyledDropdown } from "@/components/ui/styled-dropdown"
import { StyledInput } from "@/components/ui/styled-input"
import { constructServerUrl } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

interface LLMProviderFormProps {
  provider: { provider: string; model: string | null; apiKey: string; temperature: number | null; maxTokens: number | null } | null
}

export function LLMProviderForm({ provider }: LLMProviderFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    provider: provider?.provider || "openai",
    apiKey: provider?.apiKey || "",
    model: provider?.model || "",
    temperature: provider?.temperature ?? 0.8,
    maxTokens: provider?.maxTokens ?? 6000,
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
    setError(null)

    startTransition(async () => {
      const result = await updateLLMProvider({
        provider: formData.provider,
        apiKey: formData.apiKey,
        model: formData.model || undefined,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
      })

      if (result.success) {
        setIsEditing(false)
        router.refresh()
      } else {
        setError(result.error || "Failed to update LLM provider")
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
                  {provider.model || "Default"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Temperature</div>
                <div className="text-sm text-white">
                  {provider.temperature ?? "Default (0.8)"}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Max Tokens</div>
                <div className="text-sm text-white">
                  {provider.maxTokens ?? "Default (6000)"}
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
          {provider ? "Edit" : "Configure"}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Provider</label>
          <select
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-cyan-400 focus:ring-1"
            disabled={isPending}
          >
            <option value="openai">OpenAI</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Model (optional)</label>
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
                { value: "", label: "Select a model (optional)" },
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
            <span className="text-slate-500 ml-1">(optional, default: 0.8)</span>
          </label>
          <StyledInput
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0.8 })}
            placeholder="0.8"
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-slate-500">
            Note: GPT-5 models only support temperature 1 (default)
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Max Tokens (1-100000)
            <span className="text-slate-500 ml-1">(optional, default: 6000)</span>
          </label>
          <StyledInput
            type="number"
            min="1"
            max="100000"
            step="1"
            value={formData.maxTokens}
            onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 6000 })}
            placeholder="6000"
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-slate-500">
            Maximum number of tokens to generate in the response
          </p>
        </div>
      </div>
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
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
            setError(null)
            setFormData({
              provider: provider?.provider || "openai",
              apiKey: provider?.apiKey || "",
              model: provider?.model || "",
              temperature: provider?.temperature ?? 0.8,
              maxTokens: provider?.maxTokens ?? 6000,
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
  type: "plex" | "tautulli" | "overseerr"
  server: { name: string; hostname: string; port: number; protocol: string; token?: string; apiKey?: string; publicUrl?: string | null } | null
}

export function ServerForm({ type, server }: ServerFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const getServerUrl = () => {
    if (!server) return ""
    return constructServerUrl(server.protocol as "http" | "https", server.hostname, server.port)
  }

  const [formData, setFormData] = useState({
    name: server?.name || "",
    url: getServerUrl(),
    publicUrl: server?.publicUrl || "",
    token: server?.token || "",
    apiKey: server?.apiKey || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
      } else {
        result = await updateOverseerr({
          name: formData.name,
          url: formData.url,
          apiKey: formData.apiKey!,
          publicUrl: formData.publicUrl || undefined,
        })
      }

      if (result.success) {
        setIsEditing(false)
        router.refresh()
      } else {
        setError(result.error || `Failed to update ${type} configuration`)
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
                <div className="text-white font-mono text-xs">{getServerUrl()}</div>
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
          {server ? "Edit" : "Configure"}
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
            placeholder={type === "plex" ? "https://example.com:32400" : type === "tautulli" ? "http://example.com:8181" : "http://example.com:5055"}
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
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
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
            setError(null)
            setFormData({
              name: server?.name || "",
              url: getServerUrl(),
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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleToggle = () => {
    setError(null)
    startTransition(async () => {
      const result = await setLLMDisabled(!disabled)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || "Failed to update LLM status")
      }
    })
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`px-3 py-1 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center border ${
          disabled
            ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30 hover:border-green-500/50"
            : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 hover:border-red-500/50"
        }`}
      >
        {isPending ? "Updating..." : disabled ? "Enable LLM" : "Disable LLM"}
      </button>
      {error && (
        <div className="mt-2 text-xs text-red-400">{error}</div>
      )}
    </div>
  )
}

