/**
 * Security tests for admin pages
 * Tests that admin pages properly enforce authorization and show error pages
 */

import { getServerSession } from 'next-auth'
import { requireAdmin, UnauthorizedAdminError, UnauthenticatedError } from '@/lib/admin'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  authOptions: {},
}))

describe('Admin Pages Security', () => {
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('requireAdmin', () => {
    it('should return session for admin user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)

      const session = await requireAdmin()

      expect(session).toEqual(mockAdminSession)
    })

    it('should throw UnauthenticatedError for unauthenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await expect(requireAdmin()).rejects.toThrow(UnauthenticatedError)
      await expect(requireAdmin()).rejects.toThrow('UNAUTHENTICATED')
    })

    it('should throw UnauthorizedAdminError for non-admin user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockRegularUserSession)

      await expect(requireAdmin()).rejects.toThrow(UnauthorizedAdminError)
      await expect(requireAdmin()).rejects.toThrow('UNAUTHORIZED')
    })

    it('should throw error with correct name', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockRegularUserSession)

      try {
        await requireAdmin()
        fail('Expected requireAdmin to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedAdminError)
        expect((error as Error).name).toBe('UnauthorizedAdminError')
        expect((error as Error).message).toBe('UNAUTHORIZED')
      }
    })

    it('should handle session with undefined isAdmin', async () => {
      const sessionWithUndefinedAdmin = {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          name: 'User',
          isAdmin: undefined,
        },
      }
      ;(getServerSession as jest.Mock).mockResolvedValue(sessionWithUndefinedAdmin)

      await expect(requireAdmin()).rejects.toThrow(UnauthorizedAdminError)
    })
  })

  describe('UnauthorizedAdminError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedAdminError()
      expect(error.message).toBe('Admin access required')
      expect(error.name).toBe('UnauthorizedAdminError')
    })

    it('should create error with custom message', () => {
      const error = new UnauthorizedAdminError('Custom message')
      expect(error.message).toBe('Custom message')
      expect(error.name).toBe('UnauthorizedAdminError')
    })

    it('should be instance of Error', () => {
      const error = new UnauthorizedAdminError()
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('UnauthenticatedError', () => {
    it('should create error with default message', () => {
      const error = new UnauthenticatedError()
      expect(error.message).toBe('Authentication required')
      expect(error.name).toBe('UnauthenticatedError')
    })

    it('should create error with custom message', () => {
      const error = new UnauthenticatedError('Custom message')
      expect(error.message).toBe('Custom message')
      expect(error.name).toBe('UnauthenticatedError')
    })

    it('should be instance of Error', () => {
      const error = new UnauthenticatedError()
      expect(error).toBeInstanceOf(Error)
    })
  })
})

