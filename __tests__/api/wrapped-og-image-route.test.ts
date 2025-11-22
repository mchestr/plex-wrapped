/**
 * Tests for app/api/wrapped/og-image/route.ts - wrapped OG image API route
 */

import { GET } from '@/app/api/wrapped/og-image/route'
import { prisma } from '@/lib/prisma'
import { shareRateLimiter } from '@/lib/security/rate-limit'
import { stripHighlightTags } from '@/lib/wrapped/text-processor'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    plexWrapped: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/security/rate-limit', () => ({
  shareRateLimiter: jest.fn(),
}))

jest.mock('@/lib/wrapped/text-processor', () => ({
  stripHighlightTags: jest.fn((text) => text),
}))

// Mock NextRequest and NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return {
    ...actual,
    NextRequest: class MockNextRequest {
      url: string
      nextUrl: URL
      method: string
      headers: Headers

      constructor(input: string | URL, init?: { headers?: Record<string, string>; method?: string }) {
        const url = typeof input === 'string' ? input : input.toString()
        this.url = url
        this.nextUrl = new URL(url)
        this.method = init?.method || 'GET'
        this.headers = new Headers(init?.headers || {})
      }
    },
    NextResponse: class MockNextResponse {
      body: any
      status: number
      headers: Map<string, string>

      constructor(body: any, init?: { status?: number; headers?: Record<string, string> }) {
        this.body = body
        this.status = init?.status || 200
        this.headers = new Map(Object.entries(init?.headers || {}))
      }

      static json(data: any, init?: { status?: number; headers?: Record<string, string> }) {
        return {
          json: () => Promise.resolve(data),
          status: init?.status || 200,
          headers: init?.headers || {},
        }
      }
    },
  }
})

describe('GET /api/wrapped/og-image', () => {
  const mockWrapped = {
    id: 'wrapped-1',
    year: 2024,
    shareToken: 'test-token',
    status: 'completed',
    summary: 'Test summary',
    data: JSON.stringify({
      statistics: {
        totalWatchTime: { total: 1440 },
        moviesWatched: 10,
        showsWatched: 5,
      },
    }),
    user: {
      name: 'Test User',
      email: 'test@example.com',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(shareRateLimiter as jest.Mock).mockResolvedValue(null)
    ;(stripHighlightTags as jest.Mock).mockImplementation((text) => text)
  })

  it('should return SVG image for valid token', async () => {
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockWrapped)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml')
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=3600')
    expect(response.body).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(response.body).toContain('Test User')
    expect(response.body).toContain('2024')
  })

  it('should return 400 when token is missing', async () => {
    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image')

    const response = await GET(request)
    const data = JSON.parse(response.body)

    expect(response.status).toBe(400)
    expect(data.error).toBe('Token is required')
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('should return 404 when wrapped is not found', async () => {
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=invalid-token')

    const response = await GET(request)

    expect(response.status).toBe(404)
    expect(response.body).toBe('Wrapped not found')
  })

  it('should return 404 when wrapped is not completed', async () => {
    const incompleteWrapped = { ...mockWrapped, status: 'generating' }
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(incompleteWrapped)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(404)
    expect(response.body).toBe('Wrapped not found')
  })

  it('should use email as fallback when name is null', async () => {
    const wrappedWithoutName = {
      ...mockWrapped,
      user: { name: null, email: 'test@example.com' },
    }
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(wrappedWithoutName)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.body).toContain('test@example.com')
  })

  it('should use "Someone" as fallback when name and email are null', async () => {
    const wrappedWithoutUser = {
      ...mockWrapped,
      user: { name: null, email: null },
    }
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(wrappedWithoutUser)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.body).toContain('Someone')
  })

  it('should strip highlight tags from summary', async () => {
    const wrappedWithHighlights = {
      ...mockWrapped,
      summary: 'Test <highlight>summary</highlight>',
    }
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(wrappedWithHighlights)
    ;(stripHighlightTags as jest.Mock).mockReturnValue('Test summary')

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(stripHighlightTags).toHaveBeenCalledWith('Test <highlight>summary</highlight>')
    expect(response.body).toContain('Test summary')
  })

  it('should format watch time as days when over 24 hours', async () => {
    const wrappedWithLongWatchTime = {
      ...mockWrapped,
      data: JSON.stringify({
        statistics: {
          totalWatchTime: { total: 2880 }, // 48 hours = 2 days
          moviesWatched: 10,
          showsWatched: 5,
        },
      }),
    }
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(wrappedWithLongWatchTime)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.body).toContain('2 days')
  })

  it('should format watch time as hours when under 24 hours', async () => {
    const wrappedWithShortWatchTime = {
      ...mockWrapped,
      data: JSON.stringify({
        statistics: {
          totalWatchTime: { total: 120 }, // 2 hours
          moviesWatched: 10,
          showsWatched: 5,
        },
      }),
    }
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(wrappedWithShortWatchTime)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.body).toContain('2 hours')
  })

  it('should handle missing statistics gracefully', async () => {
    const wrappedWithoutStats = {
      ...mockWrapped,
      data: JSON.stringify({}),
    }
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(wrappedWithoutStats)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.body).toContain('0 hours')
    expect(response.body).toContain('0') // For movies and shows
  })

  it('should truncate long summaries', async () => {
    const longSummary = 'A'.repeat(150)
    const wrappedWithLongSummary = {
      ...mockWrapped,
      summary: longSummary,
    }
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(wrappedWithLongSummary)
    ;(stripHighlightTags as jest.Mock).mockReturnValue(longSummary)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.body).toContain('...')
  })

  it('should escape XML special characters', async () => {
    const wrappedWithSpecialChars = {
      ...mockWrapped,
      user: { name: 'Test & User <script>', email: 'test@example.com' },
      summary: 'Summary with & < > " \' characters',
    }
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(wrappedWithSpecialChars)
    ;(stripHighlightTags as jest.Mock).mockImplementation((text) => text)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.body).toContain('&amp;')
    expect(response.body).toContain('&lt;')
    expect(response.body).toContain('&gt;')
  })

  it('should return 429 when rate limit is exceeded', async () => {
    const mockRateLimitResponse = {
      status: 429,
      body: JSON.stringify({ error: 'Too many requests' }),
    }
    ;(shareRateLimiter as jest.Mock).mockResolvedValue(mockRateLimitResponse)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response).toBe(mockRateLimitResponse)
    expect(prisma.plexWrapped.findUnique).not.toHaveBeenCalled()
  })

  it('should handle database errors gracefully', async () => {
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)
    const data = JSON.parse(response.body)

    expect(response.status).toBe(500)
    expect(data.error).toContain('Failed to generate image')
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should use default summary when summary is null', async () => {
    const wrappedWithoutSummary = {
      ...mockWrapped,
      summary: null,
    }
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(wrappedWithoutSummary)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/og-image?token=test-token')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.body).toContain('Test User')
    expect(response.body).toContain('2024')
    expect(response.body).toContain('Plex Wrapped')
  })
})

