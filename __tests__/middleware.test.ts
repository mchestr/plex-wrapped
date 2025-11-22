/**
 * Tests for Next.js middleware
 * Tests request logging, request ID generation, and context setup
 */

import { NextRequest, NextResponse } from "next/server"

// Mock logger utilities
jest.mock("@/lib/utils/logger", () => {
  const mockLoggerInstance = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
  return {
    createLogger: jest.fn(() => mockLoggerInstance),
    generateRequestId: jest.fn(() => "test-request-id-123"),
    runWithRequestContext: jest.fn((requestId, userId, fn) => fn()),
    sanitizeUrlForLogging: jest.fn((url) => url),
  }
})

import { middleware, config } from "@/middleware"
import * as logger from "@/lib/utils/logger"

describe("Middleware", () => {
  let mockLogger: any

  beforeEach(() => {
    jest.clearAllMocks()
    // Get the mock logger instance from createLogger
    const createLoggerMock = logger.createLogger as jest.Mock
    mockLogger = createLoggerMock()
  })

  describe("middleware function", () => {
    it("should generate and attach request ID to response", () => {
      const request = new NextRequest("http://localhost:3000/test", {
        method: "GET",
      })

      const response = middleware(request)

      expect(logger.generateRequestId).toHaveBeenCalled()
      expect(response.headers.get("X-Request-ID")).toBe("test-request-id-123")
    })

    it("should log incoming request with method and URL", () => {
      const request = new NextRequest("http://localhost:3000/test?foo=bar", {
        method: "POST",
      })

      middleware(request)

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Incoming request",
        expect.objectContaining({
          method: "POST",
          pathname: "/test",
          searchParams: { foo: "bar" },
        })
      )
    })

    it("should sanitize URL for logging", () => {
      const request = new NextRequest("http://localhost:3000/test", {
        method: "GET",
      })

      middleware(request)

      expect(logger.sanitizeUrlForLogging).toHaveBeenCalledWith(
        "http://localhost:3000/test"
      )
    })

    it("should extract IP from x-forwarded-for header", () => {
      const request = new NextRequest("http://localhost:3000/test", {
        method: "GET",
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      })

      middleware(request)

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Incoming request",
        expect.objectContaining({
          ip: "192.168.1.1, 10.0.0.1",
        })
      )
    })

    it("should extract IP from x-real-ip header if x-forwarded-for not present", () => {
      const request = new NextRequest("http://localhost:3000/test", {
        method: "GET",
        headers: {
          "x-real-ip": "192.168.1.1",
        },
      })

      middleware(request)

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Incoming request",
        expect.objectContaining({
          ip: "192.168.1.1",
        })
      )
    })

    it("should use 'unknown' for IP if no headers present", () => {
      const request = new NextRequest("http://localhost:3000/test", {
        method: "GET",
      })

      middleware(request)

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Incoming request",
        expect.objectContaining({
          ip: "unknown",
        })
      )
    })

    it("should extract user agent from headers", () => {
      const request = new NextRequest("http://localhost:3000/test", {
        method: "GET",
        headers: {
          "user-agent": "Mozilla/5.0 Test Browser",
        },
      })

      middleware(request)

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Incoming request",
        expect.objectContaining({
          userAgent: "Mozilla/5.0 Test Browser",
        })
      )
    })

    it("should use 'unknown' for user agent if not present", () => {
      const request = new NextRequest("http://localhost:3000/test", {
        method: "GET",
      })

      middleware(request)

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Incoming request",
        expect.objectContaining({
          userAgent: "unknown",
        })
      )
    })

    it("should run request within context", () => {
      const request = new NextRequest("http://localhost:3000/test", {
        method: "GET",
      })

      middleware(request)

      expect(logger.runWithRequestContext).toHaveBeenCalledWith(
        "test-request-id-123",
        undefined,
        expect.any(Function)
      )
    })

    it("should return NextResponse.next()", () => {
      const request = new NextRequest("http://localhost:3000/test", {
        method: "GET",
      })

      const response = middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
    })

    it("should handle requests with empty search params", () => {
      const request = new NextRequest("http://localhost:3000/test", {
        method: "GET",
      })

      middleware(request)

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Incoming request",
        expect.objectContaining({
          searchParams: {},
        })
      )
    })

    it("should handle requests with multiple search params", () => {
      const request = new NextRequest(
        "http://localhost:3000/test?foo=bar&baz=qux&num=123",
        {
          method: "GET",
        }
      )

      middleware(request)

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Incoming request",
        expect.objectContaining({
          searchParams: { foo: "bar", baz: "qux", num: "123" },
        })
      )
    })
  })

  describe("middleware config", () => {
    it("should have matcher configuration", () => {
      expect(config).toBeDefined()
      expect(config.matcher).toBeDefined()
      expect(Array.isArray(config.matcher)).toBe(true)
    })

    it("should exclude static files and Next.js internals", () => {
      const matcher = config.matcher[0]

      // The matcher should be a regex pattern that excludes certain paths
      expect(matcher).toContain("_next/static")
      expect(matcher).toContain("_next/image")
      expect(matcher).toContain("favicon.ico")
    })
  })
})

