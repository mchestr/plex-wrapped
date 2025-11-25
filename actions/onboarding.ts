"use server"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/utils/logger"
import { getServerSession } from "next-auth"

const logger = createLogger("ONBOARDING")

/**
 * Check if the current user has completed onboarding
 */
export async function getOnboardingStatus() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { isComplete: true } // If not logged in, assume complete to avoid blocking
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true },
    })

    return {
      isComplete: user?.onboardingCompleted ?? false,
    }
  } catch (error) {
    logger.error("Error checking onboarding status", error)
    return { isComplete: true } // On error, assume complete to avoid blocking
  }
}

/**
 * Mark onboarding as complete for the current user
 */
export async function completeOnboarding() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    })

    return { success: true }
  } catch (error) {
    logger.error("Error completing onboarding", error)
    return { success: false, error: "Failed to complete onboarding" }
  }
}

/**
 * Get onboarding configuration info
 */
export async function getOnboardingInfo() {
  try {
    const [overseerr, discordIntegration] = await Promise.all([
      prisma.overseerr.findFirst({
        where: { isActive: true },
        select: {
          publicUrl: true,
          url: true,
        },
      }),
      prisma.discordIntegration.findUnique({
        where: { id: "discord" },
        select: {
          isEnabled: true,
          clientId: true,
          clientSecret: true,
          instructions: true,
        },
      }),
    ])

    let overseerrUrl = null
    if (overseerr) {
      if (overseerr.publicUrl) {
        overseerrUrl = overseerr.publicUrl
      } else {
        // Use internal URL if public URL is not set
        // Note: This might not be reachable from client browser if it's an internal IP/docker hostname
        // but it's better than nothing for now
        overseerrUrl = overseerr.url
      }
    }

    return {
      overseerrUrl,
      discordEnabled: Boolean(discordIntegration?.isEnabled && discordIntegration?.clientId && discordIntegration?.clientSecret),
      discordInstructions: discordIntegration?.instructions ?? null,
    }
  } catch (error) {
    logger.error("Error fetching onboarding info", error)
    return {
      overseerrUrl: null,
      discordEnabled: false,
      discordInstructions: null,
    }
  }
}

