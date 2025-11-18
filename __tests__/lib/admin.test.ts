import { requireAdmin, getAdminStatus, UnauthorizedAdminError, UnauthenticatedError } from '@/lib/admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('UnauthorizedAdminError', () => {
  it('should create error with default message', () => {
    const error = new UnauthorizedAdminError()
    expect(error.message).toBe('Admin access required')
    expect(error.name).toBe('UnauthorizedAdminError')
    expect(error).toBeInstanceOf(Error)
  })

  it('should create error with custom message', () => {
    const error = new UnauthorizedAdminError('Custom message')
    expect(error.message).toBe('Custom message')
    expect(error.name).toBe('UnauthorizedAdminError')
  })
})

describe('UnauthenticatedError', () => {
  it('should create error with default message', () => {
    const error = new UnauthenticatedError()
    expect(error.message).toBe('Authentication required')
    expect(error.name).toBe('UnauthenticatedError')
    expect(error).toBeInstanceOf(Error)
  })

  it('should create error with custom message', () => {
    const error = new UnauthenticatedError('Custom message')
    expect(error.message).toBe('Custom message')
    expect(error.name).toBe('UnauthenticatedError')
  })
})

describe('requireAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return session when user is admin', async () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        isAdmin: true,
      },
    }

    mockGetServerSession.mockResolvedValue(mockSession as any)

    const result = await requireAdmin()

    expect(result).toEqual(mockSession)
    expect(mockGetServerSession).toHaveBeenCalledWith(authOptions)
  })

  it('should throw UnauthenticatedError when no session', async () => {
    mockGetServerSession.mockResolvedValue(null)

    await expect(requireAdmin()).rejects.toThrow(UnauthenticatedError)
    await expect(requireAdmin()).rejects.toThrow('UNAUTHENTICATED')
  })

  it('should throw UnauthorizedAdminError when user is not admin', async () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Regular User',
        isAdmin: false,
      },
    }

    mockGetServerSession.mockResolvedValue(mockSession as any)

    await expect(requireAdmin()).rejects.toThrow(UnauthorizedAdminError)
    await expect(requireAdmin()).rejects.toThrow('UNAUTHORIZED')
  })
})

describe('getAdminStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return true when user is admin', async () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        isAdmin: true,
      },
    }

    mockGetServerSession.mockResolvedValue(mockSession as any)

    const result = await getAdminStatus()

    expect(result).toBe(true)
    expect(mockGetServerSession).toHaveBeenCalledWith(authOptions)
  })

  it('should return false when user is not admin', async () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Regular User',
        isAdmin: false,
      },
    }

    mockGetServerSession.mockResolvedValue(mockSession as any)

    const result = await getAdminStatus()

    expect(result).toBe(false)
  })

  it('should return null when no session', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await getAdminStatus()

    expect(result).toBeNull()
  })
})

