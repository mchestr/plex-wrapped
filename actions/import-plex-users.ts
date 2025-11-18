"use server"

import { prisma } from "@/lib/prisma"
import { getAllPlexServerUsers } from "@/lib/connections/plex"
import { requireAdmin } from "@/lib/admin"
import { revalidatePath } from "next/cache"

/**
 * Import users from Plex server into the database
 * Creates User records for Plex users that don't already exist
 */
export async function importPlexUsers(): Promise<{
  success: boolean
  imported: number
  skipped: number
  errors: string[]
}> {
  try {
    await requireAdmin()

    // Get active Plex server configuration
    const plexServer = await prisma.plexServer.findFirst({
      where: { isActive: true },
    })

    if (!plexServer) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: ["No active Plex server configured"],
      }
    }

    // Fetch users from Plex server
    const usersResult = await getAllPlexServerUsers({
      hostname: plexServer.hostname,
      port: plexServer.port,
      protocol: plexServer.protocol,
      token: plexServer.token,
    })

    if (!usersResult.success || !usersResult.data) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [usersResult.error || "Failed to fetch Plex users"],
      }
    }

    const plexUsers = usersResult.data
    let imported = 0
    let skipped = 0
    const errors: string[] = []

    // Process each Plex user
    for (const plexUser of plexUsers) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { plexUserId: plexUser.id },
        })

        if (existingUser) {
          skipped++
          continue
        }

        // Check if this user is the admin
        const isAdmin = plexServer.adminPlexUserId === plexUser.id

        // Create new user
        await prisma.user.create({
          data: {
            plexUserId: plexUser.id,
            name: plexUser.name,
            email: plexUser.email || null,
            image: plexUser.thumb || null,
            isAdmin,
          },
        })

        imported++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        errors.push(`${plexUser.name} (${plexUser.id}): ${errorMessage}`)
      }
    }

    // Revalidate the users page
    revalidatePath("/admin/users")

    return {
      success: true,
      imported,
      skipped,
      errors,
    }
  } catch (error) {
    console.error("[IMPORT PLEX USERS] - Error:", error)
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [error instanceof Error ? error.message : "Failed to import Plex users"],
    }
  }
}

