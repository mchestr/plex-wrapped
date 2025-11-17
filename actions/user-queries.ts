"use server"

import { prisma } from "@/lib/prisma"

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
  totalShares: number // Total number of wraps with share tokens
  totalVisits: number // Total visits across all shared wraps
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

    // Get share and visit counts for all users
    const allWrapped = await prisma.plexWrapped.findMany({
      where: {
        userId: {
          in: users.map(u => u.id),
        },
      },
      include: {
        _count: {
          select: {
            shareVisits: true,
          },
        },
      },
    })

    // Create a map of userId -> share and visit counts
    const shareVisitMap = new Map<string, { shares: number; visits: number }>()
    for (const wrapped of allWrapped) {
      const existing = shareVisitMap.get(wrapped.userId) || { shares: 0, visits: 0 }
      if (wrapped.shareToken) {
        existing.shares += 1
      }
      existing.visits += wrapped._count.shareVisits
      shareVisitMap.set(wrapped.userId, existing)
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

      const shareVisitStats = shareVisitMap.get(user.id) || { shares: 0, visits: 0 }

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
        totalShares: shareVisitStats.shares,
        totalVisits: shareVisitStats.visits,
        llmUsage: currentYearUsage, // Current year's usage (for backward compatibility)
        totalLlmUsage: totalUsage, // Total usage across all years and regenerations
      }
    })
  } catch (error) {
    console.error("[USERS ACTION] - Error getting all users:", error)
    return []
  }
}

