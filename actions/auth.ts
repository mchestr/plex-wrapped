"use server"

import { prisma } from "@/lib/prisma"
import { checkUserServerAccess } from "@/lib/connections/plex"

/**
 * Check if a user has access to the configured Plex server
 */
export async function checkServerAccess(userToken: string): Promise<{
  success: boolean
  hasAccess: boolean
  error?: string
}> {
  try {
    const plexServer = await prisma.plexServer.findFirst({
      where: { isActive: true },
    })

    if (!plexServer) {
      return {
        success: false,
        hasAccess: false,
        error: "No Plex server configured",
      }
    }

    const accessCheck = await checkUserServerAccess(userToken, {
      hostname: plexServer.hostname,
      port: plexServer.port,
      protocol: plexServer.protocol,
    })

    return accessCheck
  } catch (error) {
    console.error("[AUTH ACTION] - Error checking server access:", error)
    return {
      success: false,
      hasAccess: false,
      error: error instanceof Error ? error.message : "Failed to check server access",
    }
  }
}

