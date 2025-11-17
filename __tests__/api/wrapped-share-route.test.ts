/**
 * Tests for app/api/wrapped/share/[token]/route.ts - share API route
 */

import { GET } from '@/app/api/wrapped/share/[token]/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    plexWrapped: {
      findUnique: jest.fn(),
    },
    wrappedShareVisit: {
      create: jest.fn(),
    },
  },
}))

// Mock NextRequest and NextResponse to avoid URL property issues
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return {
    ...actual,
    NextRequest: class MockNextRequest {
      nextUrl: URL
      method: string
      headers: Headers

      constructor(input: string | URL, init?: { headers?: Record<string, string>; method?: string }) {
        const url = typeof input === 'string' ? new URL(input) : input
        this.nextUrl = url
        this.method = init?.method || 'GET'
        this.headers = new Headers(init?.headers || {})
      }
    },
    NextResponse: {
      ...actual.NextResponse,
      json: jest.fn((data, init) => ({
        json: () => Promise.resolve(data),
        status: init?.status || 200,
        ...init,
      })),
    },
  }
})

describe('GET /api/wrapped/share/[token]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return wrapped data for valid token', async () => {
    const mockWrapped = {
      id: 'wrapped-1',
      year: 2024,
      shareToken: 'test-token',
      status: 'completed',
      summary: 'Test summary',
      generatedAt: new Date('2024-01-15'),
      data: JSON.stringify({
        sections: [],
        summary: 'Test summary',
      }),
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/image.jpg',
      },
    }

    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockWrapped)
    ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({})

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/share/test-token', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0',
        referer: 'https://example.com',
      },
    })

    const response = await GET(request, { params: { token: 'test-token' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.wrapped).toBeDefined()
    expect(data.wrapped.id).toBe('wrapped-1')
    expect(data.wrapped.year).toBe(2024)
    expect(data.wrapped.userName).toBe('Test User')
    expect(prisma.wrappedShareVisit.create).toHaveBeenCalled()
  })

  it('should return 400 when token is missing', async () => {
    const request = new NextRequest('http://localhost/api/wrapped/share/', {})

    const response = await GET(request, { params: { token: '' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Share token is required')
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('should return 404 when wrapped not found', async () => {
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/wrapped/share/invalid-token', {})

    const response = await GET(request, { params: { token: 'invalid-token' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Wrapped not found')
    expect(data.code).toBe('NOT_FOUND')
  })

  it('should return 403 when wrapped is not completed', async () => {
    const mockWrapped = {
      id: 'wrapped-1',
      year: 2024,
      shareToken: 'test-token',
      status: 'generating',
      data: JSON.stringify({}),
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      },
    }

    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockWrapped)

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/share/test-token', {})

    const response = await GET(request, { params: { token: 'test-token' } })
    const data = await response.json()

    // Security: Use 404 to prevent token enumeration
    expect(response.status).toBe(404)
    expect(data.error).toBe('Wrapped not found')
  })

  it('should track visit with IP address', async () => {
    const mockWrapped = {
      id: 'wrapped-1',
      year: 2024,
      shareToken: 'test-token',
      status: 'completed',
      summary: 'Test summary',
      generatedAt: new Date('2024-01-15'),
      data: JSON.stringify({
        sections: [],
        summary: 'Test summary',
      }),
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      },
    }

    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockWrapped)
    ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({})

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/share/test-token', {
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        'user-agent': 'Mozilla/5.0',
        referer: 'https://example.com',
      },
    })

    await GET(request, { params: { token: 'test-token' } })

    expect(prisma.wrappedShareVisit.create).toHaveBeenCalledWith({
      data: {
        wrappedId: 'wrapped-1',
        ipAddress: expect.stringMatching(/^[a-f0-9]{64}$/), // Should be hashed
        userAgent: 'Mozilla/5.0',
        referer: 'https://example.com',
      },
    })
  })

  it('should track visit with x-real-ip when x-forwarded-for is missing', async () => {
    const mockWrapped = {
      id: 'wrapped-1',
      year: 2024,
      shareToken: 'test-token',
      status: 'completed',
      summary: 'Test summary',
      generatedAt: new Date('2024-01-15'),
      data: JSON.stringify({
        sections: [],
        summary: 'Test summary',
      }),
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      },
    }

    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockWrapped)
    ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({})

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/share/test-token', {
      headers: {
        'x-real-ip': '192.168.1.2',
        'user-agent': 'Mozilla/5.0',
      },
    })

    await GET(request, { params: { token: 'test-token' } })

    expect(prisma.wrappedShareVisit.create).toHaveBeenCalledWith({
      data: {
        wrappedId: 'wrapped-1',
        ipAddress: expect.stringMatching(/^[a-f0-9]{64}$/), // Should be hashed
        userAgent: 'Mozilla/5.0',
        referer: null,
      },
    })
  })

  it('should handle visit tracking failure gracefully', async () => {
    const mockWrapped = {
      id: 'wrapped-1',
      year: 2024,
      shareToken: 'test-token',
      status: 'completed',
      summary: 'Test summary',
      generatedAt: new Date('2024-01-15'),
      data: JSON.stringify({
        sections: [],
        summary: 'Test summary',
      }),
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      },
    }

    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockWrapped)
    ;(prisma.wrappedShareVisit.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/share/test-token', {})

    const response = await GET(request, { params: { token: 'test-token' } })
    const data = await response.json()

    // Should still return success even if tracking fails
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should handle missing headers gracefully', async () => {
    const mockWrapped = {
      id: 'wrapped-1',
      year: 2024,
      shareToken: 'test-token',
      status: 'completed',
      summary: 'Test summary',
      generatedAt: new Date('2024-01-15'),
      data: JSON.stringify({
        sections: [],
        summary: 'Test summary',
      }),
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      },
    }

    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockWrapped)
    ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({})

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/share/test-token', {})

    await GET(request, { params: { token: 'test-token' } })

    expect(prisma.wrappedShareVisit.create).toHaveBeenCalledWith({
      data: {
        wrappedId: 'wrapped-1',
        ipAddress: null,
        userAgent: null,
        referer: null,
      },
    })
  })

  it('should handle database errors', async () => {
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/share/test-token', {})

    const response = await GET(request, { params: { token: 'test-token' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Failed to fetch')
    expect(consoleErrorSpy).toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('should use user email as fallback for userName', async () => {
    const mockWrapped = {
      id: 'wrapped-1',
      year: 2024,
      shareToken: 'test-token',
      status: 'completed',
      summary: 'Test summary',
      generatedAt: new Date('2024-01-15'),
      data: JSON.stringify({
        sections: [],
        summary: 'Test summary',
      }),
      user: {
        id: 'user-1',
        name: null,
        email: 'test@example.com',
        image: null,
      },
    }

    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockWrapped)
    ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({})

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/share/test-token', {})

    const response = await GET(request, { params: { token: 'test-token' } })
    const data = await response.json()

    expect(data.wrapped.userName).toBe('test@example.com')
  })

  it('should use "User" as fallback when name and email are null', async () => {
    const mockWrapped = {
      id: 'wrapped-1',
      year: 2024,
      shareToken: 'test-token',
      status: 'completed',
      summary: 'Test summary',
      generatedAt: new Date('2024-01-15'),
      data: JSON.stringify({
        sections: [],
        summary: 'Test summary',
      }),
      user: {
        id: 'user-1',
        name: null,
        email: null,
        image: null,
      },
    }

    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockWrapped)
    ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({})

    const { NextRequest } = await import('next/server')
    const request = new NextRequest('http://localhost/api/wrapped/share/test-token', {})

    const response = await GET(request, { params: { token: 'test-token' } })
    const data = await response.json()

    expect(data.wrapped.userName).toBe('User')
  })
})

