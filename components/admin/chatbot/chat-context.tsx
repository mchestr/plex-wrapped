"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface ChatContextType {
  isOpen: boolean
  toggleChat: () => void
  openChat: () => void
  closeChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => setIsOpen((prev) => !prev)
  const openChat = () => setIsOpen(true)
  const closeChat = () => setIsOpen(false)

  return (
    <ChatContext.Provider value={{ isOpen, toggleChat, openChat, closeChat }}>
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

