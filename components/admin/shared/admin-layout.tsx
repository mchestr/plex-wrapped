import React from "react"
import AdminLayoutClient from "@/components/admin/shared/admin-layout-client"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}

