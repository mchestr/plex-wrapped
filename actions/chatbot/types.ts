// Client-facing message type
export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  sources?: Array<{
    tool: string
    description: string
  }>
}

export interface ChatResponse {
  success: boolean
  message?: ChatMessage
  error?: string
  conversationId?: string
}

