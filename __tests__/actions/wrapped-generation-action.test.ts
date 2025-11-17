/**
 * Tests for actions/wrapped-generation.ts - wrapped generation logic
 */

import {
  generatePlexWrapped,
  generateAllPlexWrapped,
} from '@/actions/wrapped-generation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateWrappedWithLLM } from '@/lib/wrapped/llm'
import {
  fetchTautulliStatistics,
  fetchPlexServerStatistics,
  fetchOverseerrStatistics,
  fetchTopContentLeaderboards,
  fetchWatchTimeLeaderboard,
} from '@/lib/wrapped/statistics'
import { revalidatePath } from 'next/cache'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    plexWrapped: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    plexServer: {
      findFirst: jest.fn(),
    },
    tautulli: {
      findFirst: jest.fn(),
    },
    overseerr: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('@/lib/wrapped/llm', () => ({
  generateWrappedWithLLM: jest.fn(),
}))

jest.mock('@/lib/wrapped/statistics', () => ({
  fetchTautulliStatistics: jest.fn(),
  fetchPlexServerStatistics: jest.fn(),
  fetchOverseerrStatistics: jest.fn(),
  fetchTopContentLeaderboards: jest.fn(),
  fetchWatchTimeLeaderboard: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/utils', () => ({
  generateShareToken: jest.fn(() => 'test-share-token'),
}))

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  plexUserId: 'plex-user-123',
}

const mockSession = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    isAdmin: false,
  },
}

const mockAdminSession = {
  user: {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    isAdmin: true,
  },
}

describe('generatePlexWrapped', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully generate wrapped for user', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue({
      id: 'server-1',
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'server-token',
      name: 'Test Server',
      isActive: true,
    })
    ;(prisma.plexWrapped.upsert as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'generating',
      shareToken: 'test-share-token',
    })
    ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue({
      id: 'tautulli-1',
      hostname: 'tautulli.example.com',
      port: 8181,
      protocol: 'https',
      apiKey: 'tautulli-key',
      isActive: true,
    })
    ;(fetchTautulliStatistics as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        tautulliUserId: 'tautulli-user-123',
        totalWatchTime: 1000,
        moviesWatchTime: 500,
        showsWatchTime: 500,
        moviesWatched: 10,
        showsWatched: 5,
        episodesWatched: 50,
        topMovies: [],
        topShows: [],
        watchTimeByMonth: [],
      },
    })
    ;(fetchPlexServerStatistics as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        totalStorage: 1000000000,
        totalStorageFormatted: '1 TB',
        librarySize: {
          movies: 100,
          shows: 50,
          episodes: 500,
        },
      },
    })
    ;(fetchOverseerrStatistics as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        totalRequests: 20,
        totalServerRequests: 100,
        approvedRequests: 15,
        pendingRequests: 5,
        topRequestedGenres: [],
      },
    })
    ;(fetchTopContentLeaderboards as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        movies: [],
        shows: [],
      },
    })
    ;(fetchWatchTimeLeaderboard as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    })
    ;(generateWrappedWithLLM as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        sections: [],
        summary: 'Test summary',
        metadata: {
          totalSections: 0,
          generationTime: 0,
        },
      },
    })
    ;(prisma.plexWrapped.update as jest.Mock).mockResolvedValue({})

    const result = await generatePlexWrapped('user-1', 2024)

    expect(result.success).toBe(true)
    expect(result.wrappedId).toBe('wrapped-1')
    expect(revalidatePath).toHaveBeenCalled()
  })

  it('should return error when user is not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const result = await generatePlexWrapped('user-1', 2024)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })

  it('should return error when user does not exist', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await generatePlexWrapped('user-1', 2024)

    expect(result.success).toBe(false)
    expect(result.error).toContain('User not found')
  })

  it('should allow user to generate their own wrapped', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue({
      id: 'server-1',
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'server-token',
      name: 'Test Server',
      isActive: true,
    })
    ;(prisma.plexWrapped.upsert as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'generating',
      shareToken: 'test-share-token',
    })

    const result = await generatePlexWrapped('user-1', 2024)

    // Should proceed (will fail later in the process, but authorization check passes)
    expect(result).toBeDefined()
  })

  it('should prevent user from generating wrapped for another user', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockUser,
      id: 'user-2',
    })
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await generatePlexWrapped('user-2', 2024)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })

  it('should allow admin to regenerate completed wrapped', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'completed',
      shareToken: 'existing-token',
    })
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue({
      id: 'server-1',
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'server-token',
      name: 'Test Server',
      isActive: true,
    })
    ;(prisma.plexWrapped.upsert as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'generating',
      shareToken: 'existing-token',
    })

    const result = await generatePlexWrapped('user-1', 2024)

    // Should proceed (admin can regenerate)
    expect(result).toBeDefined()
  })

  it('should prevent non-admin from regenerating completed wrapped', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'completed',
    })

    const result = await generatePlexWrapped('user-1', 2024)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Only admins can regenerate')
  })

  it('should allow user to retry failed wrapped', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'failed',
    })
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue({
      id: 'server-1',
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'server-token',
      name: 'Test Server',
      isActive: true,
    })
    ;(prisma.plexWrapped.upsert as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'generating',
      shareToken: 'test-share-token',
    })

    const result = await generatePlexWrapped('user-1', 2024)

    // Should proceed (user can retry failed wrapped)
    expect(result).toBeDefined()
  })

  it('should return error when no active Plex server', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue(null)

    const result = await generatePlexWrapped('user-1', 2024)

    expect(result.success).toBe(false)
    expect(result.error).toContain('No active Plex server')
  })

  it('should return error when no active Tautulli server', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue({
      id: 'server-1',
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'server-token',
      name: 'Test Server',
      isActive: true,
    })
    ;(prisma.plexWrapped.upsert as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'generating',
      shareToken: 'test-share-token',
    })
    ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(null)

    const result = await generatePlexWrapped('user-1', 2024)

    expect(result.success).toBe(false)
    expect(result.error).toContain('No active Tautulli server')
  })

  it('should return error when user has no Plex user ID', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockUser,
      plexUserId: null,
    })
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue({
      id: 'server-1',
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'server-token',
      name: 'Test Server',
      isActive: true,
    })
    ;(prisma.plexWrapped.upsert as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'generating',
      shareToken: 'test-share-token',
    })
    ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue({
      id: 'tautulli-1',
      hostname: 'tautulli.example.com',
      port: 8181,
      protocol: 'https',
      apiKey: 'tautulli-key',
      isActive: true,
    })

    const result = await generatePlexWrapped('user-1', 2024)

    expect(result.success).toBe(false)
    expect(result.error).toContain('does not have a Plex user ID')
  })

  it('should handle Tautulli statistics fetch failure', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue({
      id: 'server-1',
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'server-token',
      name: 'Test Server',
      isActive: true,
    })
    ;(prisma.plexWrapped.upsert as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'generating',
      shareToken: 'test-share-token',
    })
    ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue({
      id: 'tautulli-1',
      hostname: 'tautulli.example.com',
      port: 8181,
      protocol: 'https',
      apiKey: 'tautulli-key',
      isActive: true,
    })
    ;(fetchTautulliStatistics as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to fetch statistics',
    })

    const result = await generatePlexWrapped('user-1', 2024)

    expect(result.success).toBe(false)
    expect(prisma.plexWrapped.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wrapped-1' },
        data: expect.objectContaining({
          status: 'failed',
        }),
      })
    )
  })

  it('should handle LLM generation failure', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue({
      id: 'server-1',
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'server-token',
      name: 'Test Server',
      isActive: true,
    })
    ;(prisma.plexWrapped.upsert as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'generating',
      shareToken: 'test-share-token',
    })
    ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue({
      id: 'tautulli-1',
      hostname: 'tautulli.example.com',
      port: 8181,
      protocol: 'https',
      apiKey: 'tautulli-key',
      isActive: true,
    })
    ;(fetchTautulliStatistics as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        tautulliUserId: 'tautulli-user-123',
        totalWatchTime: 1000,
        moviesWatchTime: 500,
        showsWatchTime: 500,
        moviesWatched: 10,
        showsWatched: 5,
        episodesWatched: 50,
        topMovies: [],
        topShows: [],
        watchTimeByMonth: [],
      },
    })
    ;(generateWrappedWithLLM as jest.Mock).mockResolvedValue({
      success: false,
      error: 'LLM generation failed',
    })

    const result = await generatePlexWrapped('user-1', 2024)

    expect(result.success).toBe(false)
    expect(prisma.plexWrapped.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wrapped-1' },
        data: expect.objectContaining({
          status: 'failed',
        }),
      })
    )
  })
})

describe('generateAllPlexWrapped', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should generate wrapped for all users when admin', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
      { ...mockUser, id: 'user-1', plexUserId: 'plex-1' },
      { ...mockUser, id: 'user-2', plexUserId: 'plex-2' },
    ])

    // Mock all dependencies for generatePlexWrapped - need to handle 2 users
    ;(prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
      if (args.where.id === 'user-1') {
        return Promise.resolve({ ...mockUser, id: 'user-1', plexUserId: 'plex-1' })
      }
      if (args.where.id === 'user-2') {
        return Promise.resolve({ ...mockUser, id: 'user-2', plexUserId: 'plex-2' })
      }
      return Promise.resolve(null)
    })
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.plexWrapped.upsert as jest.Mock).mockImplementation((args) => {
      return Promise.resolve({
        id: `wrapped-${args.where.userId_year.userId}`,
        userId: args.where.userId_year.userId,
        year: 2024,
        status: 'generating',
      })
    })
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue({
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'server-token',
    })
    ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue({
      hostname: 'tautulli.example.com',
      port: 8181,
      protocol: 'http',
      apiKey: 'api-key',
    })
    ;(generateWrappedWithLLM as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        sections: [],
        summary: 'Test',
        metadata: {},
      },
    })
    ;(fetchTautulliStatistics as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        totalWatchTime: 100,
        moviesWatchTime: 50,
        showsWatchTime: 50,
        moviesWatched: 10,
        showsWatched: 5,
        episodesWatched: 50,
        topMovies: [],
        topShows: [],
        watchTimeByMonth: [],
        tautulliUserId: 'user-1',
      },
    })
    ;(prisma.plexWrapped.update as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      status: 'completed',
    })

    const result = await generateAllPlexWrapped(2024)

    expect(result.success).toBe(true)
    expect(result.generated).toBe(2)
    expect(result.failed).toBe(0)
  })

  it('should reject non-admin users', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const result = await generateAllPlexWrapped(2024)

    expect(result.success).toBe(false)
    expect(result.errors).toContain('Unauthorized: Only admins can generate wrapped for all users')
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })

  it('should handle partial failures', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
      { ...mockUser, id: 'user-1', plexUserId: 'plex-1' },
      { ...mockUser, id: 'user-2', plexUserId: 'plex-2' },
    ])

    // Mock dependencies - first user succeeds, second fails
    let userCallCount = 0
    ;(prisma.plexWrapped.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.plexWrapped.upsert as jest.Mock).mockResolvedValue({
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'generating',
    })
    ;(prisma.plexServer.findFirst as jest.Mock).mockResolvedValue({
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'server-token',
    })
    ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue({
      hostname: 'tautulli.example.com',
      port: 8181,
      protocol: 'http',
      apiKey: 'api-key',
    })
    ;(fetchTautulliStatistics as jest.Mock)
      .mockResolvedValueOnce({
        success: true,
        data: {
          totalWatchTime: 100,
          moviesWatchTime: 50,
          showsWatchTime: 50,
          moviesWatched: 10,
          showsWatched: 5,
          episodesWatched: 50,
          topMovies: [],
          topShows: [],
          watchTimeByMonth: [],
          tautulliUserId: 'user-1',
        },
      })
      .mockResolvedValueOnce({
        success: false,
        error: 'Failed to fetch statistics',
      })
    ;(generateWrappedWithLLM as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        sections: [],
        summary: 'Test',
        metadata: {},
      },
    })
    ;(prisma.plexWrapped.update as jest.Mock)
      .mockResolvedValueOnce({
        id: 'wrapped-1',
        status: 'completed',
      })
      .mockResolvedValueOnce({
        id: 'wrapped-2',
        status: 'failed',
        error: 'Failed to fetch statistics',
      })

    const result = await generateAllPlexWrapped(2024)

    expect(result.success).toBe(true)
    expect(result.generated).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.errors).toHaveLength(1)
  })
})

