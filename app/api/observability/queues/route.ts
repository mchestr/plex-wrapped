import { getRadarrQueue } from "@/lib/connections/radarr"
import { getSonarrQueue } from "@/lib/connections/sonarr"
import { prisma } from "@/lib/prisma"
import { requireAdminAPI } from "@/lib/security/api-helpers"
import { ErrorCode, getStatusCode, logError } from "@/lib/security/error-handler"
import { adminRateLimiter } from "@/lib/security/rate-limit"
import { NextRequest, NextResponse } from "next/server"

export interface QueueItem {
  id: number
  source: "sonarr" | "radarr"
  title: string
  status: "downloading" | "queued" | "paused" | "failed" | "completed"
  progress: number
  size: number
  sizeLeft: number
  estimatedCompletionTime: string | null
  quality: string
}

export interface QueuesResponse {
  available: boolean
  items: QueueItem[]
  sonarrConfigured: boolean
  radarrConfigured: boolean
  error?: string
}

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await adminRateLimiter(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Require admin authentication
    const authResult = await requireAdminAPI(request)
    if (authResult.response) {
      return authResult.response
    }

    // Check configurations
    const [sonarr, radarr] = await Promise.all([
      prisma.sonarr.findFirst({ where: { isActive: true } }),
      prisma.radarr.findFirst({ where: { isActive: true } }),
    ])

    const sonarrConfigured = !!sonarr
    const radarrConfigured = !!radarr

    if (!sonarrConfigured && !radarrConfigured) {
      return NextResponse.json({
        available: false,
        items: [],
        sonarrConfigured: false,
        radarrConfigured: false,
        error: "Neither Sonarr nor Radarr configured",
      } satisfies QueuesResponse)
    }

    const items: QueueItem[] = []

    // Fetch Sonarr queue
    if (sonarr) {
      try {
        const queue = await getSonarrQueue({
          name: sonarr.name,
          url: sonarr.url,
          apiKey: sonarr.apiKey,
        })

        const records = queue.records || queue || []
        for (const item of records) {
          items.push({
            id: item.id,
            source: "sonarr",
            title: item.series?.title
              ? `${item.series.title} - ${item.episode?.title || `S${item.episode?.seasonNumber}E${item.episode?.episodeNumber}`}`
              : item.title || "Unknown",
            status: mapStatus(item.status, item.trackedDownloadStatus),
            progress: calculateProgress(item.size, item.sizeleft),
            size: item.size || 0,
            sizeLeft: item.sizeleft || 0,
            estimatedCompletionTime: item.estimatedCompletionTime || null,
            quality: item.quality?.quality?.name || "Unknown",
          })
        }
      } catch (error) {
        logError("OBSERVABILITY_SONARR_QUEUE", error)
      }
    }

    // Fetch Radarr queue
    if (radarr) {
      try {
        const queue = await getRadarrQueue({
          name: radarr.name,
          url: radarr.url,
          apiKey: radarr.apiKey,
        })

        const records = queue.records || queue || []
        for (const item of records) {
          items.push({
            id: item.id,
            source: "radarr",
            title: item.movie?.title || item.title || "Unknown",
            status: mapStatus(item.status, item.trackedDownloadStatus),
            progress: calculateProgress(item.size, item.sizeleft),
            size: item.size || 0,
            sizeLeft: item.sizeleft || 0,
            estimatedCompletionTime: item.estimatedCompletionTime || null,
            quality: item.quality?.quality?.name || "Unknown",
          })
        }
      } catch (error) {
        logError("OBSERVABILITY_RADARR_QUEUE", error)
      }
    }

    // Sort by progress (downloading items first)
    items.sort((a, b) => {
      if (a.status === "downloading" && b.status !== "downloading") return -1
      if (b.status === "downloading" && a.status !== "downloading") return 1
      return b.progress - a.progress
    })

    return NextResponse.json({
      available: true,
      items,
      sonarrConfigured,
      radarrConfigured,
    } satisfies QueuesResponse)
  } catch (error) {
    logError("OBSERVABILITY_QUEUES", error)
    return NextResponse.json(
      {
        available: false,
        items: [],
        sonarrConfigured: false,
        radarrConfigured: false,
        error: "Failed to fetch queues",
      } satisfies QueuesResponse,
      { status: getStatusCode(ErrorCode.INTERNAL_ERROR) }
    )
  }
}

function mapStatus(
  status: string | undefined,
  trackedStatus: string | undefined
): QueueItem["status"] {
  if (trackedStatus === "warning" || trackedStatus === "error") return "failed"
  if (status === "completed") return "completed"
  if (status === "paused") return "paused"
  if (status === "downloading") return "downloading"
  return "queued"
}

function calculateProgress(size: number | undefined, sizeLeft: number | undefined): number {
  if (!size || size === 0) return 0
  const left = sizeLeft || 0
  return Math.round(((size - left) / size) * 100)
}
