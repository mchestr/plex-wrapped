/**
 * Tests for CSRF protection
 * Tests CSRF validation for API routes
 */

import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { validateCSRF, withCSRFProtection } from "@/lib/security/csrf"
import { ErrorCode } from "@/lib/security/error-handler"

// Mock Next.js server
jest.mock("next/server", () => ({
  NextRequest: jest.requireActual("next/server").NextRequest,
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      ...init,
    })),
  },
}))

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}))

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}))

describe("CSRF Protection", () => {
  const mockSession = {
    user: {
      id: "user-id",
      email: "user@example.com",
      name: "Test User",
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.NEXTAUTH_URL
  })

  describe("validateCSRF", () => {
    it("should allow GET requests without CSRF check", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(true)
      expect(result.response).toBeUndefined()
    })

    it("should allow HEAD requests without CSRF check", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "HEAD",
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(true)
      expect(result.response).toBeUndefined()
    })

    it("should allow POST requests from same origin", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
        },
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(true)
      expect(result.response).toBeUndefined()
    })

    it("should reject POST requests from different origin", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          origin: "http://evil.com",
        },
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(false)
      expect(result.response).toBeDefined()

      const data = await result.response!.json()
      expect(data.code).toBe(ErrorCode.FORBIDDEN)
      expect(data.error).toBe("Invalid origin")
    })

    it("should check referer if origin header not present", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          referer: "http://localhost:3000/page",
        },
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(true)
      expect(result.response).toBeUndefined()
    })

    it("should reject POST requests with invalid referer", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          referer: "http://evil.com/page",
        },
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(false)
      expect(result.response).toBeDefined()

      const data = await result.response!.json()
      expect(data.code).toBe(ErrorCode.FORBIDDEN)
      expect(data.error).toBe("Invalid referer")
    })

    it("should allow PUT requests from same origin", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "PUT",
        headers: {
          origin: "http://localhost:3000",
        },
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(true)
    })

    it("should allow DELETE requests from same origin", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "DELETE",
        headers: {
          origin: "http://localhost:3000",
        },
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(true)
    })

    it("should allow unauthenticated POST requests", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          origin: "http://evil.com",
        },
      })

      const result = await validateCSRF(request)
      // No session means CSRF check is skipped (handled by auth check)
      expect(result.valid).toBe(true)
    })

    it("should use NEXTAUTH_URL if NEXT_PUBLIC_APP_URL not set", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      process.env.NEXTAUTH_URL = "http://localhost:3000"
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
        },
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(true)
    })

    it("should allow requests when no expected origin configured", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      delete process.env.NEXTAUTH_URL
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          origin: "http://evil.com",
        },
      })

      const result = await validateCSRF(request)
      // No expected origin configured, so check is skipped
      expect(result.valid).toBe(true)
    })

    it("should handle origin with different port", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          origin: "http://localhost:4000",
        },
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(false)
    })

    it("should handle origin with different protocol", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          origin: "https://localhost:3000",
        },
      })

      const result = await validateCSRF(request)
      expect(result.valid).toBe(false)
    })
  })

  describe("withCSRFProtection", () => {
    it("should call handler if CSRF check passes", async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true }),
      })

      const wrappedHandler = withCSRFProtection(mockHandler)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      })

      await wrappedHandler(request)
      expect(mockHandler).toHaveBeenCalledWith(request, undefined)
    })

    it("should return CSRF error response if check fails", async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const mockHandler = jest.fn()
      const wrappedHandler = withCSRFProtection(mockHandler)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          origin: "http://evil.com",
        },
      })

      const response = await wrappedHandler(request)
      expect(mockHandler).not.toHaveBeenCalled()

      const data = await response.json()
      expect(data.code).toBe(ErrorCode.FORBIDDEN)
    })

    it("should pass additional arguments to handler", async () => {
      const mockHandler = jest.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true }),
      })

      const wrappedHandler = withCSRFProtection(mockHandler)

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      })
      const context = { params: { id: "123" } }

      await wrappedHandler(request, context)
      expect(mockHandler).toHaveBeenCalledWith(request, context)
    })
  })
})

