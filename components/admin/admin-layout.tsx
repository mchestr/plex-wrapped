import React from "react"
import AdminLayoutClient from "./admin-layout-client"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}

