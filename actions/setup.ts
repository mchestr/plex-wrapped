"use server"

import { testLLMProviderConnection } from "@/lib/connections/llm-provider"
import { testOverseerrConnection } from "@/lib/connections/overseerr"
import { testPlexConnection } from "@/lib/connections/plex"
import { testTautulliConnection } from "@/lib/connections/tautulli"
import { prisma } from "@/lib/prisma"
import { llmProviderSchema, type LLMProviderInput } from "@/lib/validations/llm-provider"
import { overseerrSchema, type OverseerrInput } from "@/lib/validations/overseerr"
import { plexServerSchema, type PlexServerInput } from "@/lib/validations/plex"
import { tautulliSchema, type TautulliInput } from "@/lib/validations/tautulli"
import { revalidatePath } from "next/cache"

export async function getSetupStatus() {
  const setup = await prisma.setup.findFirst({
    orderBy: { createdAt: "desc" },
  })

  return {
    isComplete: setup?.isComplete ?? false,
    currentStep: setup?.currentStep ?? 1,
  }
}

export async function savePlexServer(data: PlexServerInput) {
  try {
    const validated = plexServerSchema.parse(data)

    // Test connection before saving
    const connectionTest = await testPlexConnection(validated)
    if (!connectionTest.success) {
      return { success: false, error: connectionTest.error || "Failed to connect to Plex server" }
    }

    // Fetch the admin's Plex user ID from the token
    const { getPlexUserInfo } = await import("@/lib/connections/plex")
    const userInfoResult = await getPlexUserInfo(validated.token)
    if (!userInfoResult.success || !userInfoResult.data) {
      return { success: false, error: "Failed to fetch user info from Plex token" }
    }

    const adminPlexUserId = userInfoResult.data.id

    await prisma.$transaction(async (tx) => {
      // Create or update setup record
      const setup = await tx.setup.findFirst({
        orderBy: { createdAt: "desc" },
      })

      if (setup) {
        await tx.setup.update({
          where: { id: setup.id },
          data: {
            currentStep: 2,
          },
        })
      } else {
        await tx.setup.create({
          data: {
            currentStep: 2,
          },
        })
      }

      // Create Plex server configuration
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
    })

    revalidatePath("/setup")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to save Plex server configuration" }
  }
}

export async function saveTautulli(data: TautulliInput) {
  try {
    const validated = tautulliSchema.parse(data)

    // Test connection before saving
    const connectionTest = await testTautulliConnection(validated)
    if (!connectionTest.success) {
      return { success: false, error: connectionTest.error || "Failed to connect to Tautulli server" }
    }

    await prisma.$transaction(async (tx) => {
      // Update setup record
      const setup = await tx.setup.findFirst({
        orderBy: { createdAt: "desc" },
      })

      if (setup) {
        await tx.setup.update({
          where: { id: setup.id },
          data: {
            currentStep: 3,
          },
        })
      } else {
        await tx.setup.create({
          data: {
            currentStep: 3,
          },
        })
      }

      // Create Tautulli configuration
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
    })

    revalidatePath("/setup")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to save Tautulli configuration" }
  }
}

export async function saveOverseerr(data: OverseerrInput) {
  try {
    const validated = overseerrSchema.parse(data)

    // Test connection before saving
    const connectionTest = await testOverseerrConnection(validated)
    if (!connectionTest.success) {
      return { success: false, error: connectionTest.error || "Failed to connect to Overseerr server" }
    }

    await prisma.$transaction(async (tx) => {
      // Update setup record
      const setup = await tx.setup.findFirst({
        orderBy: { createdAt: "desc" },
      })

      if (setup) {
        await tx.setup.update({
          where: { id: setup.id },
          data: {
            currentStep: 4,
          },
        })
      } else {
        await tx.setup.create({
          data: {
            currentStep: 4,
          },
        })
      }

      // Create Overseerr configuration
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
    })

    revalidatePath("/setup")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to save Overseerr configuration" }
  }
}

export async function saveLLMProvider(data: LLMProviderInput) {
  try {
    const validated = llmProviderSchema.parse(data)

    // Test connection before saving
    const connectionTest = await testLLMProviderConnection(validated)
    if (!connectionTest.success) {
      return { success: false, error: connectionTest.error || "Failed to connect to LLM provider" }
    }

    await prisma.$transaction(async (tx) => {
      // Update setup record
      const setup = await tx.setup.findFirst({
        orderBy: { createdAt: "desc" },
      })

      if (setup) {
        await tx.setup.update({
          where: { id: setup.id },
          data: {
            currentStep: 5,
          },
        })
      } else {
        await tx.setup.create({
          data: {
            currentStep: 5,
          },
        })
      }

      // Create or update LLM provider configuration (only one active provider at a time)
      // First, deactivate any existing providers
      await tx.lLMProvider.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      // Create new LLM provider configuration
      await tx.lLMProvider.create({
        data: {
          provider: validated.provider,
          apiKey: validated.apiKey,
          model: validated.model || null,
          isActive: true,
        },
      })
    })

    revalidatePath("/setup")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to save LLM provider configuration" }
  }
}

export async function completeSetup() {
  const setup = await prisma.setup.findFirst({
    orderBy: { createdAt: "desc" },
  })

  if (setup) {
    await prisma.setup.update({
      where: { id: setup.id },
      data: {
        isComplete: true,
        completedAt: new Date(),
      },
    })
  }

  revalidatePath("/")
  return { success: true }
}

