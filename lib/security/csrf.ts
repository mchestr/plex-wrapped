import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createSafeError, ErrorCode, getStatusCode } from "@/lib/security/error-handler"

/**
 * CSRF protection for API routes
 *
 * Note: Next.js Server Actions have built-in CSRF protection.
 * This utility is for custom API routes that perform state-changing operations.
 *
 * For GET requests, CSRF is not applicable.
 * For POST/PUT/DELETE requests, validate CSRF token.
 */

/**
 * Validate CSRF token for state-changing operations
 *
 * In Next.js with NextAuth, CSRF tokens are handled automatically for:
 * - Server Actions (via Next.js)
 * - NextAuth routes (via NextAuth)
 *
 * For custom API routes, you can validate the Origin header or use
 * NextAuth's CSRF token validation.
 */
export async function validateCSRF(request: NextRequest): Promise<{
  valid: boolean
  response?: NextResponse
}> {
  // GET requests don't need CSRF protection
  if (request.method === "GET" || request.method === "HEAD") {
    return { valid: true }
  }

  // For authenticated requests, check Origin header
  const session = await getServerSession(authOptions)
  if (session) {
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL

    if (expectedOrigin) {
      const expectedUrl = new URL(expectedOrigin)
      const originUrl = origin ? new URL(origin) : null
      const refererUrl = referer ? new URL(referer) : null

      // Check if origin matches expected origin
      if (originUrl && originUrl.origin !== expectedUrl.origin) {
        return {
          valid: false,
          response: NextResponse.json(
            createSafeError(ErrorCode.FORBIDDEN, "Invalid origin"),
            { status: getStatusCode(ErrorCode.FORBIDDEN) }
          ),
        }
      }

      // If no origin header, check referer
      if (!originUrl && refererUrl && refererUrl.origin !== expectedUrl.origin) {
        return {
          valid: false,
          response: NextResponse.json(
            createSafeError(ErrorCode.FORBIDDEN, "Invalid referer"),
            { status: getStatusCode(ErrorCode.FORBIDDEN) }
          ),
        }
      }
    }
  }

  return { valid: true }
}

/**
 * Next.js App Router route handler context
 */
interface RouteHandlerContext {
  params?: Record<string, string | string[]>
}

/**
 * CSRF protection middleware wrapper
 * Use this for API routes that perform state-changing operations
 */
export function withCSRFProtection(
  handler: (request: NextRequest, context?: RouteHandlerContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: RouteHandlerContext) => {
    const csrfCheck = await validateCSRF(request)
    if (!csrfCheck.valid && csrfCheck.response) {
      return csrfCheck.response
    }

    return handler(request, context)
  }
}

