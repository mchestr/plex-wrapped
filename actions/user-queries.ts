"use server"

import { requireAdmin } from "@/lib/admin"
import { getPlexServerIdentity, getPlexUsers, unshareUserFromPlexServer } from "@/lib/connections/plex"
import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/utils/logger"

const logger = createLogger("USER_ACTIONS")

/**
 * Get user's Plex Wrapped
 */
export async function getUserPlexWrapped(
  userId: string,
  year: number = new Date().getFullYear()
) {
  try {
    const wrapped = await prisma.plexWrapped.findUnique({
      where: {
        userId_year: {
          userId,
          year,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return wrapped
  } catch (error) {
    console.error("[USERS ACTION] - Error getting user wrapped:", error)
    return null
  }
}

/**
 * Get detailed user information including all wrapped, shares, visits, and LLM usage
 */
export async function getUserDetails(userId: string): Promise<{
  id: string
  name: string | null
  email: string | null
  image: string | null
  plexUserId: string | null
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
  hasPlexAccess: boolean | null
  wrapped: Array<{
    id: string
    year: number
    status: string
    generatedAt: Date | null
    createdAt: Date
    shareToken: string | null
    shareVisits: number
  }>
  totalShares: number
  totalVisits: number
  llmUsage: {
    totalTokens: number
    promptTokens: number
    completionTokens: number
    cost: number
    provider: string | null
    model: string | null
    count: number
  } | null
} | null> {
  try {
    // Get active Plex server for access checking
    const plexServer = await prisma.plexServer.findFirst({
      where: { isActive: true },
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        plexWrapped: {
          orderBy: { year: "desc" },
          include: {
            _count: {
              select: {
                shareVisits: true,
              },
            },
          },
        },
        llmUsage: true,
      },
    })

    if (!user) {
      return null
    }

    // Check Plex access
    let hasPlexAccess: boolean | null = null
    if (user.plexUserId && plexServer) {
      const { checkUserServerAccess } = await import("@/lib/connections/plex")
      const accessResult = await checkUserServerAccess(
        {
          hostname: plexServer.hostname,
          port: plexServer.port,
          protocol: plexServer.protocol,
          token: plexServer.token,
          adminPlexUserId: plexServer.adminPlexUserId,
        },
        user.plexUserId
      )
      hasPlexAccess = accessResult.success ? accessResult.hasAccess : null
    }

    // Calculate share and visit stats
    let totalShares = 0
    let totalVisits = 0
    const wrapped = user.plexWrapped.map((w) => {
      if (w.shareToken) {
        totalShares += 1
      }
      totalVisits += w._count.shareVisits
      return {
        id: w.id,
        year: w.year,
        status: w.status,
        generatedAt: w.generatedAt,
        createdAt: w.createdAt,
        shareToken: w.shareToken,
        shareVisits: w._count.shareVisits,
      }
    })

    // Aggregate LLM usage
    const allLlmUsageRecords = user.llmUsage || []
    const llmUsage = allLlmUsageRecords.length > 0
      ? {
          totalTokens: allLlmUsageRecords.reduce((sum, usage) => sum + usage.totalTokens, 0),
          promptTokens: allLlmUsageRecords.reduce((sum, usage) => sum + usage.promptTokens, 0),
          completionTokens: allLlmUsageRecords.reduce((sum, usage) => sum + usage.completionTokens, 0),
          cost: allLlmUsageRecords.reduce((sum, usage) => sum + usage.cost, 0),
          provider: allLlmUsageRecords[allLlmUsageRecords.length - 1]?.provider || null,
          model: allLlmUsageRecords[allLlmUsageRecords.length - 1]?.model || null,
          count: allLlmUsageRecords.length,
        }
      : null

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      plexUserId: user.plexUserId,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasPlexAccess,
      wrapped,
      totalShares,
      totalVisits,
      llmUsage,
    }
  } catch (error) {
    console.error("[USERS ACTION] - Error getting user details:", error)
    return null
  }
}

/**
 * Get all users with their wrapped status
 */
export async function getAllUsersWithWrapped(year?: number): Promise<Array<{
  id: string
  name: string | null
  email: string | null
  image: string | null
  plexUserId: string | null
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
  wrappedStatus: string | null
  wrappedGeneratedAt: Date | null
  totalWrappedCount: number
  hasPlexAccess: boolean | null // null if no plexUserId or server not configured
  llmUsage: {
    totalTokens: number
    promptTokens: number
    completionTokens: number
    cost: number
    provider: string | null
    model: string | null
    count: number
  } | null
  totalLlmUsage: {
    totalTokens: number
    promptTokens: number
    completionTokens: number
    cost: number
    provider: string | null
    model: string | null
    count: number
  } | null
}>> {
  try {
    const currentYear = year || new Date().getFullYear()

    // Get active Plex server for access checking
    const plexServer = await prisma.plexServer.findFirst({
      where: { isActive: true },
    })

    const users = await prisma.user.findMany({
      orderBy: [
        { isAdmin: "desc" },
        { name: "asc" },
      ],
      include: {
        plexWrapped: {
          where: {
            year: currentYear,
          },
          take: 1,
          include: {
            llmUsage: true,
          },
        },
        llmUsage: true, // Include ALL LLM usage records for this user (across all years and regenerations)
        _count: {
          select: {
            plexWrapped: true,
          },
        },
      },
    })

    // Check Plex access for all users efficiently
    // Fetch all users from Plex.tv API once, then check access for each user
    const accessMap = new Map<string, boolean | null>()

    if (plexServer) {
      try {
        // Get the server's machine identifier once
        const identityResult = await getPlexServerIdentity({
          hostname: plexServer.hostname,
          port: plexServer.port,
          protocol: plexServer.protocol,
          token: plexServer.token,
        })

        if (identityResult.success && identityResult.machineIdentifier) {
          // Fetch all users from Plex.tv API once
          const usersResult = await getPlexUsers(plexServer.token)

          if (usersResult.success && usersResult.data) {
            // Create a map of users by ID for efficient lookup
            const plexUserMap = new Map<string, { id: string; username: string; servers: Array<{ machineIdentifier: string }> }>()
            for (const plexUser of usersResult.data) {
              plexUserMap.set(plexUser.id, plexUser)
            }

            const machineIdentifier = identityResult.machineIdentifier
            const adminPlexUserId = plexServer.adminPlexUserId

            // Ensure admin user has their server in their servers list
            // The admin might not have a Server element in the XML response because they own the server
            if (adminPlexUserId && machineIdentifier) {
              const normalizedAdminId = String(adminPlexUserId).trim()
              const adminUser = plexUserMap.get(normalizedAdminId)
              if (adminUser) {
                // Check if admin already has this server in their list
                const hasServer = adminUser.servers.some((server) => server.machineIdentifier === machineIdentifier)
                if (!hasServer) {
                  // Add the server to admin's servers list
                  adminUser.servers.push({ machineIdentifier })
                }
              }
            }

            // Check access for each user using the fetched data
            for (const user of users) {
              if (!user.plexUserId) {
                accessMap.set(user.id, null)
                continue
              }

              const normalizedPlexUserId = String(user.plexUserId).trim()

              // Check if user is admin
              if (adminPlexUserId && normalizedPlexUserId === String(adminPlexUserId).trim()) {
                accessMap.set(user.id, true)
                continue
              }

              // Check if user exists in the map
              const plexUser = plexUserMap.get(normalizedPlexUserId)
              if (!plexUser) {
                accessMap.set(user.id, false)
                continue
              }

              // Check if user has access to the server by machine identifier
              const hasAccess = plexUser.servers.some((server) => server.machineIdentifier === machineIdentifier)
              accessMap.set(user.id, hasAccess)
            }
          } else {
            // If fetching users failed, set all to null
            for (const user of users) {
              accessMap.set(user.id, null)
            }
          }
        } else {
          // If getting machine identifier failed, set all to null
          for (const user of users) {
            accessMap.set(user.id, null)
          }
        }
      } catch (error) {
        logger.error("Error checking Plex access for users", error)
        // On error, set all to null
        for (const user of users) {
          accessMap.set(user.id, null)
        }
      }
    } else {
      // No server configured, set all to null
      for (const user of users) {
        accessMap.set(user.id, null)
      }
    }

    return users.map((user) => {
      const wrapped = user.plexWrapped[0]
      const currentYearLlmUsageRecords = wrapped?.llmUsage || []

      // Aggregate all LLM usage records for current year's wrapped (includes regenerations)
      const currentYearUsage = currentYearLlmUsageRecords.length > 0
        ? {
            totalTokens: currentYearLlmUsageRecords.reduce((sum, usage) => sum + usage.totalTokens, 0),
            promptTokens: currentYearLlmUsageRecords.reduce((sum, usage) => sum + usage.promptTokens, 0),
            completionTokens: currentYearLlmUsageRecords.reduce((sum, usage) => sum + usage.completionTokens, 0),
            cost: currentYearLlmUsageRecords.reduce((sum, usage) => sum + usage.cost, 0),
            provider: currentYearLlmUsageRecords[currentYearLlmUsageRecords.length - 1]?.provider || null,
            model: currentYearLlmUsageRecords[currentYearLlmUsageRecords.length - 1]?.model || null,
            count: currentYearLlmUsageRecords.length,
          }
        : null

      // Aggregate ALL LLM usage records for this user (across all years and regenerations)
      const allLlmUsageRecords = user.llmUsage || []
      const totalUsage = allLlmUsageRecords.length > 0
        ? {
            totalTokens: allLlmUsageRecords.reduce((sum, usage) => sum + usage.totalTokens, 0),
            promptTokens: allLlmUsageRecords.reduce((sum, usage) => sum + usage.promptTokens, 0),
            completionTokens: allLlmUsageRecords.reduce((sum, usage) => sum + usage.completionTokens, 0),
            cost: allLlmUsageRecords.reduce((sum, usage) => sum + usage.cost, 0),
            provider: allLlmUsageRecords[allLlmUsageRecords.length - 1]?.provider || null, // Latest provider
            model: allLlmUsageRecords[allLlmUsageRecords.length - 1]?.model || null, // Latest model
            count: allLlmUsageRecords.length, // Total number of LLM calls across all years
          }
        : null

      const hasPlexAccess = accessMap.get(user.id) ?? null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        plexUserId: user.plexUserId,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        wrappedStatus: wrapped?.status || null,
        wrappedGeneratedAt: wrapped?.generatedAt || null,
        totalWrappedCount: user._count.plexWrapped,
        hasPlexAccess,
        llmUsage: currentYearUsage, // Current year's usage (for backward compatibility)
        totalLlmUsage: totalUsage, // Total usage across all years and regenerations
      }
    })
  } catch (error) {
    console.error("[USERS ACTION] - Error getting all users:", error)
    return []
  }
}

/**
 * Unshare library access for a user from the Plex server (admin only)
 */
export async function unshareUserLibrary(userId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  try {
    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        plexUserId: true,
        isAdmin: true,
      },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Don't allow unsharing admin users
    if (user.isAdmin) {
      return { success: false, error: "Cannot unshare library access for admin users" }
    }

    if (!user.plexUserId) {
      return { success: false, error: "User Plex ID is required to unshare library access" }
    }

    // Get active Plex server
    const plexServer = await prisma.plexServer.findFirst({
      where: { isActive: true },
    })

    if (!plexServer) {
      return { success: false, error: "No active Plex server configured" }
    }

    // Unshare the user
    const result = await unshareUserFromPlexServer(
      {
        hostname: plexServer.hostname,
        port: plexServer.port,
        protocol: plexServer.protocol,
        token: plexServer.token,
      },
      user.plexUserId
    )

    if (!result.success) {
      logger.error("Failed to unshare user library", undefined, {
        userId: user.id,
        email: user.email,
        error: result.error,
      })
      return result
    }

    logger.info("Successfully unshared user library", {
      userId: user.id,
      email: user.email,
    })

    return { success: true }
  } catch (error) {
    logger.error("Error unsharing user library", error, { userId })
    if (error instanceof Error) {
      return { success: false, error: `Error unsharing library: ${error.message}` }
    }
    return { success: false, error: "Failed to unshare user library" }
  }
}

