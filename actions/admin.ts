"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

// Server stats are now calculated on the fly - no database caching needed

/**
 * Get the current application configuration (admin only)
 */
export async function getConfig() {
  await requireAdmin()

  try {
    const config = await prisma.config.findUnique({
      where: { id: "config" },
    })

    // If config doesn't exist, create it with defaults
    if (!config) {
      return await prisma.config.create({
        data: {
          id: "config",
          llmDisabled: false,
        },
      })
    }

    return config
  } catch (error) {
    console.error("[CONFIG] Error getting config:", error)
    // Return default config if there's an error
    return {
      id: "config",
      llmDisabled: false,
      updatedAt: new Date(),
      updatedBy: null,
    }
  }
}

/**
 * Update LLM disabled setting (admin only)
 */
export async function setLLMDisabled(disabled: boolean) {
  const session = await requireAdmin()

  try {
    const config = await prisma.config.upsert({
      where: { id: "config" },
      update: {
        llmDisabled: disabled,
        updatedBy: session.user.id,
      },
      create: {
        id: "config",
        llmDisabled: disabled,
        updatedBy: session.user.id,
      },
    })

    return { success: true, config }
  } catch (error) {
    console.error("[CONFIG] Error updating LLM disabled setting:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update configuration",
    }
  }
}

/**
 * Get LLM usage records with pagination (admin only)
 */
export async function getLLMUsageRecords(page: number = 1, pageSize: number = 50, userId?: string) {
  await requireAdmin()

  const skip = (page - 1) * pageSize

  const where: { userId?: string } = {}
  if (userId) {
    where.userId = userId
  }

  const [records, total] = await Promise.all([
    prisma.lLMUsage.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        wrapped: {
          select: {
            id: true,
            year: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    }),
    prisma.lLMUsage.count({ where }),
  ])

  return {
    records,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

/**
 * Get a single LLM usage record by ID (admin only)
 */
export async function getLLMUsageById(id: string) {
  await requireAdmin()

  const record = await prisma.lLMUsage.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      wrapped: {
        select: {
          id: true,
          year: true,
          status: true,
          generatedAt: true,
        },
      },
    },
  })

  return record
}

/**
 * Get LLM usage statistics (admin only)
 */
export async function getLLMUsageStats(startDate?: Date, endDate?: Date, userId?: string) {
  await requireAdmin()

  const { getLLMUsageStats: getStats } = await import("@/lib/wrapped/usage")
  return getStats(startDate, endDate, userId)
}

/**
 * Get user by ID (admin only)
 */
export async function getUserById(userId: string) {
  await requireAdmin()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  })

  return user
}

/**
 * Get historical wrapped versions from LLM usage records (admin only)
 */
export async function getHistoricalWrappedVersions(wrappedId: string) {
  await requireAdmin()

  // Get the wrapped to compare with current data
  const wrapped = await prisma.plexWrapped.findUnique({
    where: { id: wrappedId },
    select: { data: true, generatedAt: true },
  })

  let currentSectionsHash: string | null = null
  if (wrapped?.data) {
    try {
      const currentData = JSON.parse(wrapped.data) as { sections?: Array<{ id: string; type: string }> }
      // Create a normalized hash of sections to identify the current version
      const sections = (currentData.sections || []).map((s) => ({
        id: s.id,
        type: s.type,
      }))
      currentSectionsHash = JSON.stringify(sections.sort((a, b) => a.id.localeCompare(b.id)))
    } catch (error) {
      console.error("[ADMIN] Failed to parse wrapped data for comparison:", error)
    }
  }

  const llmUsageRecords = await prisma.lLMUsage.findMany({
    where: {
      wrappedId,
      // Only include records that have a response (exclude mock/empty responses)
      response: {
        not: "",
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Get current summary for comparison
  let currentSummary: string | null = null
  if (wrapped?.data) {
    try {
      const currentData = JSON.parse(wrapped.data)
      currentSummary = currentData.summary || null
    } catch (error) {
      // Ignore
    }
  }

  return llmUsageRecords.map((record, index) => {
    // Check if this version matches the current wrapped data
    let isCurrent = false

    // Try multiple comparison methods
    if (index === 0) {
      // The most recent version is typically the current one
      // Try comparing summary first (most reliable)
      if (currentSummary) {
        try {
          let cleaned = record.response.trim()
          if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "")
          } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "")
          }
          const parsed = JSON.parse(cleaned)
          if (parsed.summary === currentSummary) {
            isCurrent = true
          } else if (currentSectionsHash) {
            // Fallback to section comparison
            const versionSections = (parsed.sections || []).map((s: { id: string; type: string }) => ({
              id: s.id,
              type: s.type,
            }))
            const versionSectionsHash = JSON.stringify(versionSections.sort((a: { id: string; type: string }, b: { id: string; type: string }) => a.id.localeCompare(b.id)))
            isCurrent = versionSectionsHash === currentSectionsHash
          } else {
            // If no comparison possible, assume most recent is current
            isCurrent = true
          }
        } catch (error) {
          // If parsing fails, but it's the most recent, assume it's current
          isCurrent = true
        }
      } else if (currentSectionsHash) {
        // Try section comparison if no summary
        try {
          let cleaned = record.response.trim()
          if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "")
          } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "")
          }
          const parsed = JSON.parse(cleaned) as { sections?: Array<{ id: string; type: string }> }
          const versionSections = (parsed.sections || []).map((s) => ({
            id: s.id,
            type: s.type,
          }))
          const versionSectionsHash = JSON.stringify(versionSections.sort((a, b) => a.id.localeCompare(b.id)))
          isCurrent = versionSectionsHash === currentSectionsHash
        } catch (error) {
          isCurrent = true
        }
      } else {
        // If we can't compare, mark the most recent one as current
        isCurrent = true
      }
    }

    return {
      id: record.id,
      createdAt: record.createdAt,
      provider: record.provider,
      model: record.model,
      cost: record.cost,
      totalTokens: record.totalTokens,
      response: record.response,
      userId: record.userId,
      userName: record.user.name || record.user.email || "Unknown",
      isCurrent,
    }
  })
}

/**
 * Get a historical wrapped data from an LLM usage record (admin only)
 */
export async function getHistoricalWrappedData(llmUsageId: string, wrappedId: string) {
  await requireAdmin()

  // Get the LLM usage record
  const llmUsage = await prisma.lLMUsage.findUnique({
    where: { id: llmUsageId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      wrapped: {
        select: {
          id: true,
          year: true,
          data: true,
        },
      },
    },
  })

  if (!llmUsage || !llmUsage.wrapped) {
    return null
  }

  // Get the current wrapped data to extract statistics (they don't change between regenerations)
  let statistics = null
  try {
    const currentWrappedData = JSON.parse(llmUsage.wrapped.data)
    statistics = currentWrappedData.statistics
  } catch (error) {
    console.error("[ADMIN] Failed to parse current wrapped data for statistics:", error)
  }

  // Parse the LLM response
  try {
    const { parseWrappedResponse } = await import("@/lib/wrapped/prompt")

    // Clean the response - remove markdown code blocks if present
    let cleaned = llmUsage.response.trim()
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "")
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "")
    }

    const parsed = JSON.parse(cleaned)

    // Build wrapped data using statistics from current wrapped (if available)
    // or create minimal statistics if not available
    const wrappedData = {
      year: llmUsage.wrapped.year,
      userId: llmUsage.userId,
      userName: llmUsage.user.name || llmUsage.user.email || "User",
      generatedAt: llmUsage.createdAt.toISOString(),
      statistics: statistics || {
        totalWatchTime: { total: 0, movies: 0, shows: 0 },
        moviesWatched: 0,
        showsWatched: 0,
        episodesWatched: 0,
        topMovies: [],
        topShows: [],
      },
      sections: parsed.sections || [],
      insights: parsed.insights || {
        personality: "Viewer",
        topGenre: "Various",
        bingeWatcher: false,
        discoveryScore: 50,
        funFacts: [],
      },
      summary: parsed.summary || undefined,
      metadata: {
        totalSections: parsed.sections?.length || 0,
        generationTime: 0,
      },
    }

    return {
      wrappedData,
      llmUsage: {
        id: llmUsage.id,
        createdAt: llmUsage.createdAt,
        provider: llmUsage.provider,
        model: llmUsage.model,
        cost: llmUsage.cost,
        totalTokens: llmUsage.totalTokens,
      },
    }
  } catch (error) {
    console.error("[ADMIN] Failed to parse historical wrapped data:", error)
    return null
  }
}

/**
 * Get all admin settings (admin only)
 */
export async function getAdminSettings() {
  await requireAdmin()

  const [config, llmProvider, plexServer, tautulli, overseerr] = await Promise.all([
    getConfig(),
    prisma.lLMProvider.findFirst({ where: { isActive: true } }),
    prisma.plexServer.findFirst({ where: { isActive: true } }),
    prisma.tautulli.findFirst({ where: { isActive: true } }),
    prisma.overseerr.findFirst({ where: { isActive: true } }),
  ])

  return {
    config,
    llmProvider,
    plexServer,
    tautulli,
    overseerr,
  }
}

/**
 * Update LLM provider configuration (admin only)
 */
export async function updateLLMProvider(data: { provider: string; apiKey: string; model?: string; temperature?: number; maxTokens?: number }) {
  const session = await requireAdmin()

  try {
    const { llmProviderSchema } = await import("@/lib/validations/llm-provider")
    const { testLLMProviderConnection } = await import("@/lib/connections/llm-provider")
    const { revalidatePath } = await import("next/cache")

    const validated = llmProviderSchema.parse(data)

    // Test connection before saving
    const connectionTest = await testLLMProviderConnection(validated)
    if (!connectionTest.success) {
      return { success: false, error: connectionTest.error || "Failed to connect to LLM provider" }
    }

    await prisma.$transaction(async (tx) => {
      // Deactivate any existing providers
      await tx.lLMProvider.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      // Check if there's an existing provider with same config
      const existing = await tx.lLMProvider.findFirst({
        where: {
          provider: validated.provider,
          apiKey: validated.apiKey,
          model: validated.model || null,
        },
      })

      if (existing) {
        // Reactivate existing provider and update temperature and maxTokens
        await tx.lLMProvider.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            temperature: validated.temperature ?? null,
            maxTokens: validated.maxTokens ?? null,
          },
        })
      } else {
        // Create new provider configuration
        await tx.lLMProvider.create({
          data: {
            provider: validated.provider,
            apiKey: validated.apiKey,
            model: validated.model || null,
            temperature: validated.temperature ?? null,
            maxTokens: validated.maxTokens ?? null,
            isActive: true,
          },
        })
      }
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to update LLM provider configuration" }
  }
}

/**
 * Update Plex server configuration (admin only)
 */
export async function updatePlexServer(data: { name: string; url: string; token: string }) {
  const session = await requireAdmin()

  try {
    const { plexServerSchema } = await import("@/lib/validations/plex")
    const { testPlexConnection } = await import("@/lib/connections/plex")
    const { getPlexUserInfo } = await import("@/lib/connections/plex")
    const { revalidatePath } = await import("next/cache")

    const validated = plexServerSchema.parse(data)

    // Test connection before saving
    const connectionTest = await testPlexConnection(validated)
    if (!connectionTest.success) {
      return { success: false, error: connectionTest.error || "Failed to connect to Plex server" }
    }

    // Fetch the admin's Plex user ID from the token
    const userInfoResult = await getPlexUserInfo(validated.token)
    if (!userInfoResult.success || !userInfoResult.data) {
      return { success: false, error: "Failed to fetch user info from Plex token" }
    }

    const adminPlexUserId = userInfoResult.data.id

    await prisma.$transaction(async (tx) => {
      // Deactivate existing active server
      await tx.plexServer.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      // Update or create server
      const existing = await tx.plexServer.findFirst({
        where: {
          hostname: validated.hostname,
          port: validated.port,
          protocol: validated.protocol,
        },
      })

      if (existing) {
        await tx.plexServer.update({
          where: { id: existing.id },
          data: {
            name: validated.name,
            token: validated.token,
            adminPlexUserId,
            isActive: true,
          },
        })
      } else {
        await tx.plexServer.create({
          data: {
            name: validated.name,
            hostname: validated.hostname,
            port: validated.port,
            protocol: validated.protocol,
            token: validated.token,
            adminPlexUserId,
            isActive: true,
          },
        })
      }
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to update Plex server configuration" }
  }
}

/**
 * Update Tautulli configuration (admin only)
 */
export async function updateTautulli(data: { name: string; url: string; apiKey: string }) {
  const session = await requireAdmin()

  try {
    const { tautulliSchema } = await import("@/lib/validations/tautulli")
    const { testTautulliConnection } = await import("@/lib/connections/tautulli")
    const { revalidatePath } = await import("next/cache")

    const validated = tautulliSchema.parse(data)

    // Test connection before saving
    const connectionTest = await testTautulliConnection(validated)
    if (!connectionTest.success) {
      return { success: false, error: connectionTest.error || "Failed to connect to Tautulli server" }
    }

    await prisma.$transaction(async (tx) => {
      // Deactivate existing active server
      await tx.tautulli.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      // Update or create server
      const existing = await tx.tautulli.findFirst({
        where: {
          hostname: validated.hostname,
          port: validated.port,
          protocol: validated.protocol,
        },
      })

      if (existing) {
        await tx.tautulli.update({
          where: { id: existing.id },
          data: {
            name: validated.name,
            apiKey: validated.apiKey,
            isActive: true,
          },
        })
      } else {
        await tx.tautulli.create({
          data: {
            name: validated.name,
            hostname: validated.hostname,
            port: validated.port,
            protocol: validated.protocol,
            apiKey: validated.apiKey,
            isActive: true,
          },
        })
      }
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to update Tautulli configuration" }
  }
}

/**
 * Update Overseerr configuration (admin only)
 */
export async function updateOverseerr(data: { name: string; url: string; apiKey: string }) {
  const session = await requireAdmin()

  try {
    const { overseerrSchema } = await import("@/lib/validations/overseerr")
    const { testOverseerrConnection } = await import("@/lib/connections/overseerr")
    const { revalidatePath } = await import("next/cache")

    const validated = overseerrSchema.parse(data)

    // Test connection before saving
    const connectionTest = await testOverseerrConnection(validated)
    if (!connectionTest.success) {
      return { success: false, error: connectionTest.error || "Failed to connect to Overseerr server" }
    }

    await prisma.$transaction(async (tx) => {
      // Deactivate existing active server
      await tx.overseerr.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      // Update or create server
      const existing = await tx.overseerr.findFirst({
        where: {
          hostname: validated.hostname,
          port: validated.port,
          protocol: validated.protocol,
        },
      })

      if (existing) {
        await tx.overseerr.update({
          where: { id: existing.id },
          data: {
            name: validated.name,
            apiKey: validated.apiKey,
            isActive: true,
          },
        })
      } else {
        await tx.overseerr.create({
          data: {
            name: validated.name,
            hostname: validated.hostname,
            port: validated.port,
            protocol: validated.protocol,
            apiKey: validated.apiKey,
            isActive: true,
          },
        })
      }
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to update Overseerr configuration" }
  }
}

/**
 * Export database dump (admin only)
 */
export async function exportDatabaseDump() {
  await requireAdmin()

  try {
    const [
      users,
      setups,
      plexServers,
      tautullis,
      overseerrs,
      llmProviders,
      plexWrappeds,
      wrappedShareVisits,
      llmUsages,
      configs,
      promptTemplates,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.setup.findMany(),
      prisma.plexServer.findMany(),
      prisma.tautulli.findMany(),
      prisma.overseerr.findMany(),
      prisma.lLMProvider.findMany(),
      prisma.plexWrapped.findMany(),
      prisma.wrappedShareVisit.findMany(),
      prisma.lLMUsage.findMany(),
      prisma.config.findMany(),
      prisma.promptTemplate.findMany(),
    ])

    const dump = {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        users,
        setups,
        plexServers,
        tautullis,
        overseerrs,
        llmProviders,
        plexWrappeds,
        wrappedShareVisits,
        llmUsages,
        configs,
        promptTemplates,
      },
    }

    return { success: true, data: dump }
  } catch (error) {
    console.error("[ADMIN] Failed to export database dump:", error)
    return { success: false, error: "Failed to export database dump" }
  }
}

/**
 * Import database dump (admin only)
 */
export async function importDatabaseDump(dump: any) {
  await requireAdmin()

  try {
    if (!dump || !dump.data || dump.version !== 1) {
      return { success: false, error: "Invalid dump format" }
    }

    const {
      users,
      setups,
      plexServers,
      tautullis,
      overseerrs,
      llmProviders,
      plexWrappeds,
      wrappedShareVisits,
      llmUsages,
      configs,
      promptTemplates,
    } = dump.data

    await prisma.$transaction(async (tx) => {
      // Delete existing data in reverse dependency order
      await tx.wrappedShareVisit.deleteMany()
      await tx.lLMUsage.deleteMany()
      await tx.plexWrapped.deleteMany()
      await tx.promptTemplate.deleteMany()
      await tx.config.deleteMany()
      await tx.lLMProvider.deleteMany()
      await tx.overseerr.deleteMany()
      await tx.tautulli.deleteMany()
      await tx.plexServer.deleteMany()
      await tx.setup.deleteMany()
      await tx.user.deleteMany()

      // Insert new data in dependency order
      if (users?.length) await tx.user.createMany({ data: users })
      if (setups?.length) await tx.setup.createMany({ data: setups })
      if (plexServers?.length) await tx.plexServer.createMany({ data: plexServers })
      if (tautullis?.length) await tx.tautulli.createMany({ data: tautullis })
      if (overseerrs?.length) await tx.overseerr.createMany({ data: overseerrs })
      if (llmProviders?.length) await tx.lLMProvider.createMany({ data: llmProviders })
      if (configs?.length) await tx.config.createMany({ data: configs })
      if (promptTemplates?.length) await tx.promptTemplate.createMany({ data: promptTemplates })
      if (plexWrappeds?.length) await tx.plexWrapped.createMany({ data: plexWrappeds })
      if (llmUsages?.length) await tx.lLMUsage.createMany({ data: llmUsages })
      if (wrappedShareVisits?.length) await tx.wrappedShareVisit.createMany({ data: wrappedShareVisits })
    })

    return { success: true }
  } catch (error) {
    console.error("[ADMIN] Failed to import database dump:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to import database dump" }
  }
}

