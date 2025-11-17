import { type TautulliInput } from "@/lib/validations/tautulli";

export async function testTautulliConnection(config: TautulliInput): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${config.protocol}://${config.hostname}:${config.port}/api/v2?apikey=${config.apiKey}&cmd=get_server_info`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: "Invalid API key" }
      }
      if (response.status === 404) {
        return { success: false, error: "Tautulli server not found at this address" }
      }
      return { success: false, error: `Connection failed: ${response.statusText}` }
    }

    const data = await response.json()

    // Check if Tautulli API returned an error
    if (data.response?.result === "error") {
      return { success: false, error: data.response?.message || "Tautulli API error" }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { success: false, error: "Connection timeout - check your hostname and port" }
      }
      return { success: false, error: `Connection error: ${error.message}` }
    }
    return { success: false, error: "Failed to connect to Tautulli server" }
  }
}

