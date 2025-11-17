import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  if (!session.user.isAdmin) {
    redirect("/")
  }

  // Redirect to users page - the main admin interface
  redirect("/admin/users")
}

