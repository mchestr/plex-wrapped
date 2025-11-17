import { getBaseUrl } from "@/lib/utils"

export async function testOpenRouterConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = "https://openrouter.ai/api/v1/models"

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    // Get the base URL - use window.location.origin for client-side, getBaseUrl() for server-side
    const refererUrl = typeof window !== "undefined" ? window.location.origin : getBaseUrl()

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": refererUrl,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: "Invalid API key" }
      }
      return { success: false, error: `Connection failed: ${response.statusText}` }
    }

    const data = await response.json()

    // Check if OpenRouter API returned an error
    if (data.error) {
      return { success: false, error: data.error.message || "OpenRouter API error" }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { success: false, error: "Connection timeout - please check your internet connection" }
      }
      return { success: false, error: `Connection error: ${error.message}` }
    }
    return { success: false, error: "Failed to connect to OpenRouter API" }
  }
}

