/**
 * Security tests for admin API routes
 * Tests that admin-only endpoints properly enforce authorization
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { GET as getWrappedByUser } from '@/app/api/admin/wrapped/by-user/[userId]/route'
import { GET as getWrappedUser } from '@/app/api/admin/wrapped/[wrappedId]/user/route'
import { GET as getWrappedVersions } from '@/app/api/admin/wrapped/[wrappedId]/versions/route'
import { getUserPlexWrapped } from '@/actions/users'
import { getHistoricalWrappedVersions } from '@/actions/admin'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  authOptions: {},
}))

jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(url, init = {}) {
      this.nextUrl = new URL(url)
      this.method = init.method || 'GET'
      this.headers = {
        get: jest.fn().mockReturnValue(null),
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

jest.mock('@/actions/users', () => ({
  getUserPlexWrapped: jest.fn(),
}))

jest.mock('@/actions/admin', () => ({
  getHistoricalWrappedVersions: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    plexWrapped: {
      findUnique: jest.fn(),
    },
  },
}))

describe('Admin API Routes Security', () => {
  const mockAdminSession = {
    user: {
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: 'Admin User',
      isAdmin: true,
    },
  }

  const mockRegularUserSession = {
    user: {
      id: 'regular-user-id',
      email: 'user@example.com',
      name: 'Regular User',
      isAdmin: false,
    },
  }

  const mockRequest = (url: string): any => {
    const urlObj = new URL(url)
    return {
      nextUrl: urlObj,
      method: 'GET',
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/wrapped/by-user/[userId]', () => {
    it('should allow admin to access wrapped by user ID', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(getUserPlexWrapped as jest.Mock).mockResolvedValue({
        id: 'wrapped-id',
        userId: 'user-id',
        year: 2024,
        status: 'completed',
      })

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/by-user/user-id')
      const response = await getWrappedByUser(request, { params: { userId: 'user-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.wrappedId).toBe('wrapped-id')
      expect(getUserPlexWrapped).toHaveBeenCalledWith('user-id', expect.any(Number))
    })

    it('should reject non-admin user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockRegularUserSession)

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/by-user/user-id')
      const response = await getWrappedByUser(request, { params: { userId: 'user-id' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Admin access required')
      expect(getUserPlexWrapped).not.toHaveBeenCalled()
    })

    it('should reject unauthenticated request', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/by-user/user-id')
      const response = await getWrappedByUser(request, { params: { userId: 'user-id' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
      expect(getUserPlexWrapped).not.toHaveBeenCalled()
    })

    it('should handle year query parameter', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(getUserPlexWrapped as jest.Mock).mockResolvedValue({
        id: 'wrapped-id',
        userId: 'user-id',
        year: 2023,
        status: 'completed',
      })

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/by-user/user-id?year=2023')
      const response = await getWrappedByUser(request, { params: { userId: 'user-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(getUserPlexWrapped).toHaveBeenCalledWith('user-id', 2023)
    })
  })

  describe('GET /api/admin/wrapped/[wrappedId]/user', () => {
    it('should allow admin to get user ID from wrapped ID', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-id',
      })

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/wrapped-id/user')
      const response = await getWrappedUser(request, { params: { wrappedId: 'wrapped-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.userId).toBe('user-id')
      expect(prisma.plexWrapped.findUnique).toHaveBeenCalledWith({
        where: { id: 'wrapped-id' },
        select: { userId: true },
      })
    })

    it('should reject non-admin user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockRegularUserSession)

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/wrapped-id/user')
      const response = await getWrappedUser(request, { params: { wrappedId: 'wrapped-id' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Admin access required')
      expect(prisma.plexWrapped.findUnique).not.toHaveBeenCalled()
    })

    it('should reject unauthenticated request', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/wrapped-id/user')
      const response = await getWrappedUser(request, { params: { wrappedId: 'wrapped-id' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
      expect(prisma.plexWrapped.findUnique).not.toHaveBeenCalled()
    })

    it('should return 404 when wrapped not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/non-existent/user')
      const response = await getWrappedUser(request, { params: { wrappedId: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Wrapped not found')
    })
  })

  describe('GET /api/admin/wrapped/[wrappedId]/versions', () => {
    it('should allow admin to get historical wrapped versions', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(getHistoricalWrappedVersions as jest.Mock).mockResolvedValue([
        {
          id: 'llm-usage-1',
          createdAt: new Date(),
          provider: 'openai',
          model: 'gpt-4',
          cost: 0.01,
          totalTokens: 1000,
          isCurrent: true,
        },
      ])

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/wrapped-id/versions')
      const response = await getWrappedVersions(request, { params: { wrappedId: 'wrapped-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.versions).toHaveLength(1)
      expect(getHistoricalWrappedVersions).toHaveBeenCalledWith('wrapped-id')
    })

    it('should reject non-admin user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockRegularUserSession)

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/wrapped-id/versions')
      const response = await getWrappedVersions(request, { params: { wrappedId: 'wrapped-id' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Admin access required')
      expect(getHistoricalWrappedVersions).not.toHaveBeenCalled()
    })

    it('should reject unauthenticated request', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = mockRequest('http://localhost:3000/api/admin/wrapped/wrapped-id/versions')
      const response = await getWrappedVersions(request, { params: { wrappedId: 'wrapped-id' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
      expect(getHistoricalWrappedVersions).not.toHaveBeenCalled()
    })
  })
})

