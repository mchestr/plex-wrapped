import { getAllOverseerrRequests } from "@/lib/connections/overseerr"
import { prisma } from "@/lib/prisma"
import { requireAdminAPI } from "@/lib/security/api-helpers"
import { ErrorCode, getStatusCode, logError } from "@/lib/security/error-handler"
import { adminRateLimiter } from "@/lib/security/rate-limit"
import { NextRequest, NextResponse } from "next/server"

export interface RequestItem {
  id: number
  type: "movie" | "tv"
  title: string
  status: "pending" | "approved" | "available" | "declined"
  requestedBy: string
  requestedAt: string
}

export interface RequestsStatsResponse {
  available: boolean
  configured: boolean
  recentRequests: RequestItem[]
  stats: {
    pending: number
    approved: number
    available: number
    declined: number
    total: number
  }
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

    // Check if Overseerr is configured
    const overseerr = await prisma.overseerr.findFirst({ where: { isActive: true } })

    if (!overseerr) {
      return NextResponse.json({
        available: false,
        configured: false,
        recentRequests: [],
        stats: { pending: 0, approved: 0, available: 0, declined: 0, total: 0 },
        error: "Overseerr not configured",
      } satisfies RequestsStatsResponse)
    }

    try {
      // Fetch recent requests (last 50 to get good stats)
      const requestsData = await getAllOverseerrRequests(
        {
          name: overseerr.name,
          url: overseerr.url,
          apiKey: overseerr.apiKey,
        },
        50
      )

      const requests = requestsData.results || []

      // Calculate stats
      const stats = {
        pending: 0,
        approved: 0,
        available: 0,
        declined: 0,
        total: requests.length,
      }

      const recentRequests: RequestItem[] = []

      for (const req of requests) {
        // Map status (Overseerr uses: 1=pending, 2=approved, 3=declined, 4=available)
        let status: RequestItem["status"] = "pending"
        if (req.status === 1) {
          status = "pending"
          stats.pending++
        } else if (req.status === 2) {
          status = "approved"
          stats.approved++
        } else if (req.status === 3) {
          status = "declined"
          stats.declined++
        } else if (req.status === 4 || req.status === 5) {
          status = "available"
          stats.available++
        }

        // Only add recent items (first 10) to display list
        if (recentRequests.length < 10) {
          recentRequests.push({
            id: req.id,
            type: req.type === "movie" ? "movie" : "tv",
            title: req.media?.title || req.media?.name || "Unknown",
            status,
            requestedBy: req.requestedBy?.displayName || req.requestedBy?.email || "Unknown",
            requestedAt: req.createdAt || new Date().toISOString(),
          })
        }
      }

      return NextResponse.json({
        available: true,
        configured: true,
        recentRequests,
        stats,
      } satisfies RequestsStatsResponse)
    } catch (error) {
      logError("OBSERVABILITY_OVERSEERR_REQUESTS", error)
      return NextResponse.json({
        available: false,
        configured: true,
        recentRequests: [],
        stats: { pending: 0, approved: 0, available: 0, declined: 0, total: 0 },
        error: "Failed to fetch Overseerr data",
      } satisfies RequestsStatsResponse)
    }
  } catch (error) {
    logError("OBSERVABILITY_REQUESTS", error)
    return NextResponse.json(
      {
        available: false,
        configured: false,
        recentRequests: [],
        stats: { pending: 0, approved: 0, available: 0, declined: 0, total: 0 },
        error: "Failed to fetch request metrics",
      } satisfies RequestsStatsResponse,
      { status: getStatusCode(ErrorCode.INTERNAL_ERROR) }
    )
  }
}
