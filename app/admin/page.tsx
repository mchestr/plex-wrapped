import { requireAdmin } from "@/lib/admin"
import { redirect } from "next/navigation"

export default async function AdminDashboard() {
  await requireAdmin()

  // Redirect to users page - the main admin interface
  redirect("/admin/users")
}

