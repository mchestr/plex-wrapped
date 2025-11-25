"use client"

import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from "react"

interface ChatContextType {
  isOpen: boolean
  toggleChat: () => void
  openChat: () => void
  closeChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), [])
  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({ isOpen, toggleChat, openChat, closeChat }),
    [isOpen, toggleChat, openChat, closeChat]
  )

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}

