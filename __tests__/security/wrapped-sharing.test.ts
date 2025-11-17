/**
 * Security tests for wrapped sharing
 * Tests that anonymous users can access shared wraps, but only completed ones
 */

import { GET as getSharedWrapped } from '@/app/api/wrapped/share/[token]/route'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(url, init = {}) {
      this.nextUrl = new URL(url)
      this.method = init.method || 'GET'
      this.headers = {
        get: jest.fn((name) => {
          const headers = init.headers || {}
          return headers[name.toLowerCase()] || null
        }),
      }
    }
  },
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      ...init,
    })),
  },
}))

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

describe('Wrapped Sharing Security', () => {
  const mockCompletedWrapped = {
    id: 'wrapped-1',
    userId: 'user-1',
    year: 2024,
    status: 'completed',
    shareToken: 'valid-share-token',
    summary: 'Test summary',
    generatedAt: new Date('2024-01-01'),
    data: JSON.stringify({
      sections: [{ id: 'hero-1', type: 'hero', title: 'Welcome' }],
      summary: 'Test summary',
    }),
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'user@example.com',
      image: 'https://example.com/image.jpg',
    },
  }

  const mockGeneratingWrapped = {
    ...mockCompletedWrapped,
    status: 'generating',
  }

  const mockFailedWrapped = {
    ...mockCompletedWrapped,
    status: 'failed',
    error: 'Generation failed',
  }

  const mockPendingWrapped = {
    ...mockCompletedWrapped,
    status: 'pending',
  }

  const createMockRequest = (headers: Record<string, string> = {}): any => {
    return {
      nextUrl: new URL('http://localhost:3000/api/wrapped/share/valid-share-token'),
      method: 'GET',
      headers: {
        get: (name: string) => {
          const allHeaders = {
            'user-agent': 'Mozilla/5.0',
            'x-forwarded-for': '192.168.1.1',
            ...headers,
          }
          return allHeaders[name.toLowerCase()] || null
        },
      },
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/wrapped/share/[token]', () => {
    it('should allow anonymous user to access completed wrapped', async () => {
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockCompletedWrapped)
      ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({
        id: 'visit-1',
        wrappedId: 'wrapped-1',
        createdAt: new Date(),
      })

      const request = createMockRequest()
      const response = await getSharedWrapped(request, { params: { token: 'valid-share-token' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.wrapped).toBeTruthy()
      expect(data.wrapped.id).toBe('wrapped-1')
      expect(data.wrapped.shareToken).toBe('valid-share-token')
      expect(data.wrapped.userName).toBe('Test User')
      expect(prisma.plexWrapped.findUnique).toHaveBeenCalledWith({
        where: { shareToken: 'valid-share-token' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })
    })

    it('should reject access to generating wrapped', async () => {
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockGeneratingWrapped)

      const request = createMockRequest()
      const response = await getSharedWrapped(request, { params: { token: 'valid-share-token' } })
      const data = await response.json()

      // Security: Use 404 to prevent token enumeration
      expect(response.status).toBe(404)
      expect(data.error).toBe('Wrapped not found')
    })

    it('should reject access to failed wrapped', async () => {
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockFailedWrapped)

      const request = createMockRequest()
      const response = await getSharedWrapped(request, { params: { token: 'valid-share-token' } })
      const data = await response.json()

      // Security: Use 404 to prevent token enumeration
      expect(response.status).toBe(404)
      expect(data.error).toBe('Wrapped not found')
    })

    it('should reject access to pending wrapped', async () => {
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockPendingWrapped)

      const request = createMockRequest()
      const response = await getSharedWrapped(request, { params: { token: 'valid-share-token' } })
      const data = await response.json()

      // Security: Use 404 to prevent token enumeration
      expect(response.status).toBe(404)
      expect(data.error).toBe('Wrapped not found')
    })

    it('should return 404 for invalid token', async () => {
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest()
      const response = await getSharedWrapped(request, { params: { token: 'invalid-token' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Wrapped not found')
    })

    it('should return 400 for missing token', async () => {
      const request = createMockRequest()
      const response = await getSharedWrapped(request, { params: { token: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Share token is required')
    })

    it('should track share visit for completed wrapped', async () => {
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockCompletedWrapped)
      ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({
        id: 'visit-1',
        wrappedId: 'wrapped-1',
        createdAt: new Date(),
      })

      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0',
        referer: 'https://example.com',
      })

      const response = await getSharedWrapped(request, { params: { token: 'valid-share-token' } })

      expect(response.status).toBe(200)
      // IP address should be hashed
      expect(prisma.wrappedShareVisit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            wrappedId: 'wrapped-1',
            ipAddress: expect.stringMatching(/^[a-f0-9]{64}$/), // SHA-256 hash (64 hex chars)
            userAgent: 'Mozilla/5.0',
            referer: 'https://example.com',
          }),
        })
      )
    })

    it('should handle visit tracking failure gracefully', async () => {
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockCompletedWrapped)
      ;(prisma.wrappedShareVisit.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createMockRequest()
      const response = await getSharedWrapped(request, { params: { token: 'valid-share-token' } })
      const data = await response.json()

      // Should still return wrapped data even if tracking fails
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.wrapped).toBeTruthy()
    })

    it('should not expose sensitive user data', async () => {
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockCompletedWrapped)
      ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({
        id: 'visit-1',
        wrappedId: 'wrapped-1',
        createdAt: new Date(),
      })

      const request = createMockRequest()
      const response = await getSharedWrapped(request, { params: { token: 'valid-share-token' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should not include user ID in response
      expect(data.wrapped.user).toBeUndefined()
      expect(data.wrapped.userId).toBeUndefined()
      // Should only include safe user info
      expect(data.wrapped.userName).toBe('Test User')
      expect(data.wrapped.userImage).toBe('https://example.com/image.jpg')
    })

    it('should handle missing IP address gracefully', async () => {
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockCompletedWrapped)
      ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({
        id: 'visit-1',
        wrappedId: 'wrapped-1',
        createdAt: new Date(),
      })

      const request = createMockRequest({
        'x-forwarded-for': '',
        'x-real-ip': '',
      })

      const response = await getSharedWrapped(request, { params: { token: 'valid-share-token' } })

      expect(response.status).toBe(200)
      expect(prisma.wrappedShareVisit.create).toHaveBeenCalledWith({
        data: {
          wrappedId: 'wrapped-1',
          ipAddress: null,
          userAgent: 'Mozilla/5.0',
          referer: null,
        },
      })
    })

    it('should parse wrapped data correctly', async () => {
      const wrappedWithData = {
        ...mockCompletedWrapped,
        data: JSON.stringify({
          sections: [
            { id: 'hero-1', type: 'hero', title: 'Welcome', content: 'Hello' },
            { id: 'stats-1', type: 'total-watch-time', title: 'Watch Time', content: '100 hours' },
          ],
          summary: 'Test summary',
          statistics: {
            totalWatchTime: { total: 100 },
          },
        }),
      }

      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(wrappedWithData)
      ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({
        id: 'visit-1',
        wrappedId: 'wrapped-1',
        createdAt: new Date(),
      })

      const request = createMockRequest()
      const response = await getSharedWrapped(request, { params: { token: 'valid-share-token' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.wrapped.data).toBeTruthy()
      expect(data.wrapped.data.sections).toHaveLength(2)
      expect(data.wrapped.data.summary).toBe('Test summary')
    })

    it('should handle x-forwarded-for with multiple IPs', async () => {
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(mockCompletedWrapped)
      ;(prisma.wrappedShareVisit.create as jest.Mock).mockResolvedValue({
        id: 'visit-1',
        wrappedId: 'wrapped-1',
        createdAt: new Date(),
      })

      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
        'user-agent': 'Mozilla/5.0',
      })

      const response = await getSharedWrapped(request, { params: { token: 'valid-share-token' } })

      expect(response.status).toBe(200)
      // Should use the first IP from x-forwarded-for and hash it
      expect(prisma.wrappedShareVisit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            wrappedId: 'wrapped-1',
            ipAddress: expect.stringMatching(/^[a-f0-9]{64}$/), // SHA-256 hash (64 hex chars)
            userAgent: 'Mozilla/5.0',
            referer: null,
          }),
        })
      )
    })
  })
})

