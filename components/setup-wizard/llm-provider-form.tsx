"use client"

import { getDevDefaults } from "@/actions/dev-defaults"
import { saveLLMProvider } from "@/actions/setup"
import { type LLMProviderInput } from "@/lib/validations/llm-provider"
import { useEffect, useState, useTransition } from "react"

interface LLMProviderFormProps {
  onComplete: () => void
  onBack?: () => void
}

export function LLMProviderForm({ onComplete, onBack }: LLMProviderFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<LLMProviderInput>({
    provider: "openai",
    apiKey: "",
    model: "",
  })

  useEffect(() => {
    // Load dev defaults on mount
    getDevDefaults().then((defaults) => {
      if (defaults.llmProvider) {
        setFormData((prev) => ({
          provider: defaults.llmProvider?.provider ?? prev.provider,
          apiKey: defaults.llmProvider?.apiKey ?? prev.apiKey,
          model: defaults.llmProvider?.model ?? prev.model,
        }))
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    startTransition(async () => {
      const result = await saveLLMProvider(formData)
      if (result.success) {
        setIsSuccess(true)
        onComplete()
      } else {
        setErrors({ submit: result.error || "Failed to save LLM provider configuration" })
      }
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const providerInfo = {
    openai: {
      name: "OpenAI",
      description: "Configure OpenAI API access for AI-powered features.",
      apiKeyHelp: "Get your API key from https://platform.openai.com/api-keys",
      modelPlaceholder: "gpt-4, gpt-3.5-turbo, etc. (optional)",
    },
    openrouter: {
      name: "OpenRouter",
      description: "Configure OpenRouter API access for AI-powered features with access to multiple models.",
      apiKeyHelp: "Get your API key from https://openrouter.ai/keys",
      modelPlaceholder: "openai/gpt-4, anthropic/claude-3-opus, etc. (optional)",
    },
  }

  const currentProvider = providerInfo[formData.provider]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">
          AI Provider Configuration
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          {currentProvider.description}
        </p>
      </div>

      <div>
        <label
          htmlFor="provider"
          className="block text-sm font-medium text-cyan-400 mb-2"
        >
          Provider
        </label>
        <select
          id="provider"
          name="provider"
          value={formData.provider}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-slate-800/50 border border-slate-600 text-white shadow-sm focus:border-cyan-400 focus:ring-cyan-400 focus:ring-1 sm:text-sm px-3 py-2 transition-colors"
        >
          <option value="openai" className="bg-slate-800">OpenAI</option>
          <option value="openrouter" className="bg-slate-800">OpenRouter</option>
        </select>
        <p className="mt-1 text-xs text-slate-400">
          Choose between OpenAI or OpenRouter for AI features
        </p>
      </div>

      <div>
        <label
          htmlFor="apiKey"
          className="block text-sm font-medium text-cyan-400 mb-2"
        >
          API Key
        </label>
        <input
          type="password"
          id="apiKey"
          name="apiKey"
          required
          value={formData.apiKey}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 shadow-sm focus:border-cyan-400 focus:ring-cyan-400 focus:ring-1 sm:text-sm px-3 py-2 transition-colors"
          placeholder={`Your ${currentProvider.name} API key`}
        />
        <p className="mt-1 text-xs text-slate-400">
          {currentProvider.apiKeyHelp}
        </p>
        {errors.apiKey && (
          <p className="mt-1 text-sm text-red-400">{errors.apiKey}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="model"
          className="block text-sm font-medium text-cyan-400 mb-2"
        >
          Default Model <span className="text-slate-500 text-xs">(Optional)</span>
        </label>
        <input
          type="text"
          id="model"
          name="model"
          value={formData.model || ""}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 shadow-sm focus:border-cyan-400 focus:ring-cyan-400 focus:ring-1 sm:text-sm px-3 py-2 transition-colors"
          placeholder={currentProvider.modelPlaceholder}
        />
        <p className="mt-1 text-xs text-slate-400">
          Specify a default model to use. If not provided, a default will be selected automatically.
        </p>
        {errors.model && (
          <p className="mt-1 text-sm text-red-400">{errors.model}</p>
        )}
      </div>

      {errors.submit && (
        <div className="rounded-md bg-red-900/30 border border-red-500/50 p-4">
          <p className="text-sm text-red-300">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isPending || isSuccess}
            className="inline-flex justify-center rounded-md border border-slate-600 bg-slate-800/80 hover:bg-slate-700/80 py-2 px-6 text-sm font-medium text-slate-200 shadow-lg hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 hover:border-slate-500"
          >
            Back
          </button>
        )}
        <div className={onBack ? "ml-auto" : "ml-auto"}>
          <button
            type="submit"
            disabled={isPending || isSuccess}
            className="inline-flex justify-center rounded-md border border-slate-600 bg-slate-800/80 hover:bg-slate-700/80 py-2 px-6 text-sm font-medium text-slate-200 shadow-lg hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 hover:border-slate-500"
          >
            {isPending ? "Testing connection..." : isSuccess ? "Success!" : "Continue"}
          </button>
        </div>
      </div>
    </form>
  )
}

