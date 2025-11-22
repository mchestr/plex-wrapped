"use client"

import React from "react"
import { AdminNav } from "@/components/admin/shared/admin-nav"

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <AdminNav />
      <main className="md:ml-64 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  )
}

