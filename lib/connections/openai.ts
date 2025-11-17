
export async function testOpenAIConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = "https://api.openai.com/v1/models"

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
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

    // Check if OpenAI API returned an error
    if (data.error) {
      return { success: false, error: data.error.message || "OpenAI API error" }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { success: false, error: "Connection timeout - please check your internet connection" }
      }
      return { success: false, error: `Connection error: ${error.message}` }
    }
    return { success: false, error: "Failed to connect to OpenAI API" }
  }
}

