import { getHistoricalWrappedVersions } from "@/actions/admin"
import { NextRequest, NextResponse } from "next/server"
import { requireAdminAPI } from "@/lib/security/api-helpers"
import { adminRateLimiter } from "@/lib/security/rate-limit"
import { createSafeError, ErrorCode, getStatusCode, logError } from "@/lib/security/error-handler"

export async function GET(
  request: NextRequest,
  { params }: { params: { wrappedId: string } }
) {
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

    const versions = await getHistoricalWrappedVersions(params.wrappedId)

    return NextResponse.json({ versions })
  } catch (error) {
    logError("ADMIN_VERSIONS_API", error)
    return NextResponse.json(
      createSafeError(ErrorCode.INTERNAL_ERROR, "Failed to fetch historical versions"),
      { status: getStatusCode(ErrorCode.INTERNAL_ERROR) }
    )
  }
}

