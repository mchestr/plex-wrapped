"use client"

import { getDevDefaults } from "@/actions/dev-defaults"
import { savePlexServer } from "@/actions/setup"
import { type PlexServerInput } from "@/lib/validations/plex"
import { memo, useCallback, useEffect, useState, useTransition } from "react"

interface PlexServerFormProps {
  onComplete: () => void
  onBack?: () => void
}

export const PlexServerForm = memo(function PlexServerForm({ onComplete, onBack }: PlexServerFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<PlexServerInput>({
    name: "",
    hostname: "",
    port: 32400,
    protocol: "https",
    token: "",
  })

  useEffect(() => {
    // Load dev defaults on mount
    getDevDefaults().then((defaults) => {
      if (defaults.plex) {
        setFormData((prev) => ({
          name: defaults.plex?.name ?? prev.name,
          hostname: defaults.plex?.hostname ?? prev.hostname,
          port: defaults.plex?.port ?? prev.port,
          protocol: defaults.plex?.protocol ?? prev.protocol,
          token: defaults.plex?.token ?? prev.token,
        }))
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    startTransition(async () => {
      const result = await savePlexServer(formData)
      if (result.success) {
        setIsSuccess(true)
        onComplete()
      } else {
        setErrors({ submit: result.error || "Failed to save Plex server configuration" })
      }
    })
  }

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "port" ? parseInt(value, 10) || 0 : value,
    }))
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Plex Server Configuration
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          Enter your Plex server connection details. You can find your Plex
          token in your Plex account settings.
        </p>
      </div>

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-cyan-400 mb-2"
        >
          Server Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 shadow-sm focus:border-cyan-400 focus:ring-cyan-400 focus:ring-1 sm:text-sm px-3 py-2 transition-colors"
          placeholder="My Plex Server"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="hostname"
          className="block text-sm font-medium text-cyan-400 mb-2"
        >
          Hostname or IP Address
        </label>
        <input
          type="text"
          id="hostname"
          name="hostname"
          required
          value={formData.hostname}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 shadow-sm focus:border-cyan-400 focus:ring-cyan-400 focus:ring-1 sm:text-sm px-3 py-2 transition-colors"
          placeholder="plex.example.com or 192.168.1.100"
        />
        {errors.hostname && (
          <p className="mt-1 text-sm text-red-400">{errors.hostname}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="protocol"
            className="block text-sm font-medium text-cyan-400 mb-2"
          >
            Protocol
          </label>
          <select
            id="protocol"
            name="protocol"
            value={formData.protocol}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-800/50 border border-slate-600 text-white shadow-sm focus:border-cyan-400 focus:ring-cyan-400 focus:ring-1 sm:text-sm px-3 py-2 transition-colors"
          >
            <option value="https" className="bg-slate-800">HTTPS</option>
            <option value="http" className="bg-slate-800">HTTP</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="port"
            className="block text-sm font-medium text-cyan-400 mb-2"
          >
            Port
          </label>
          <input
            type="number"
            id="port"
            name="port"
            required
            min="1"
            max="65535"
            value={formData.port}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md bg-slate-800/50 border border-slate-600 text-white shadow-sm focus:border-cyan-400 focus:ring-cyan-400 focus:ring-1 sm:text-sm px-3 py-2 transition-colors"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="token"
          className="block text-sm font-medium text-cyan-400 mb-2"
        >
          Plex Token
        </label>
        <input
          type="password"
          id="token"
          name="token"
          required
          value={formData.token}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 shadow-sm focus:border-cyan-400 focus:ring-cyan-400 focus:ring-1 sm:text-sm px-3 py-2 transition-colors"
          placeholder="Your Plex authentication token"
        />
        <p className="mt-1 text-xs text-slate-400">
          Find your token at{" "}
          <a
            href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
          >
            Plex Support
          </a>
        </p>
        {errors.token && (
          <p className="mt-1 text-sm text-red-400">{errors.token}</p>
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
})

