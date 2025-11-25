import { getAdminSettings } from "@/actions/admin"
import { ChatProvider } from "@/components/admin/chatbot/chat-context"
import { AdminLayoutShell } from "@/components/admin/shared/admin-layout-shell"
import { requireAdmin } from "@/lib/admin"
import React from "react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdmin()
  const settings = await getAdminSettings()
  const hasChatLLM = !!settings.chatLLMProvider

  return (
    <ChatProvider>
      <AdminLayoutShell hasChatLLM={hasChatLLM} chatUserName={session.user.name || undefined}>
        {children}
      </AdminLayoutShell>
    </ChatProvider>
  )
}
