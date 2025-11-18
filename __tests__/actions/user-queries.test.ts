import { getUserPlexWrapped, getAllUsersWithWrapped } from '@/actions/user-queries'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    plexWrapped: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('getUserPlexWrapped', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return wrapped for user and year', async () => {
    const mockWrapped = {
      id: 'wrapped-1',
      userId: 'user-1',
      year: 2024,
      status: 'completed',
      content: { hero: 'Test content' },
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      },
    }

    mockPrisma.plexWrapped.findUnique.mockResolvedValue(mockWrapped as any)

    const result = await getUserPlexWrapped('user-1', 2024)

    expect(result).toEqual(mockWrapped)
    expect(mockPrisma.plexWrapped.findUnique).toHaveBeenCalledWith({
      where: {
        userId_year: {
          userId: 'user-1',
          year: 2024,
        },
      },
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

  it('should use current year as default', async () => {
    const currentYear = new Date().getFullYear()
    mockPrisma.plexWrapped.findUnique.mockResolvedValue(null)

    await getUserPlexWrapped('user-1')

    expect(mockPrisma.plexWrapped.findUnique).toHaveBeenCalledWith({
      where: {
        userId_year: {
          userId: 'user-1',
          year: currentYear,
        },
      },
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

  it('should return null when wrapped not found', async () => {
    mockPrisma.plexWrapped.findUnique.mockResolvedValue(null)

    const result = await getUserPlexWrapped('user-1', 2024)

    expect(result).toBeNull()
  })

  it('should return null on error', async () => {
    mockPrisma.plexWrapped.findUnique.mockRejectedValue(new Error('Database error'))

    const result = await getUserPlexWrapped('user-1', 2024)

    expect(result).toBeNull()
  })
})

describe('getAllUsersWithWrapped', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return all users with wrapped status', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        name: 'User 1',
        email: 'user1@example.com',
        image: null,
        plexUserId: 'plex-1',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plexWrapped: [
          {
            id: 'wrapped-1',
            year: 2024,
            status: 'completed',
            generatedAt: new Date(),
            llmUsage: [
              {
                totalTokens: 1000,
                promptTokens: 500,
                completionTokens: 500,
                cost: 0.01,
                provider: 'openai',
                model: 'gpt-4',
              },
            ],
          },
        ],
        llmUsage: [
          {
            totalTokens: 1000,
            promptTokens: 500,
            completionTokens: 500,
            cost: 0.01,
            provider: 'openai',
            model: 'gpt-4',
          },
        ],
        _count: {
          plexWrapped: 1,
        },
      },
    ]

    mockPrisma.user.findMany.mockResolvedValue(mockUsers as any)
    mockPrisma.plexWrapped.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        shareToken: 'token-1',
        _count: {
          shareVisits: 5,
        },
      },
    ] as any)

    const result = await getAllUsersWithWrapped(2024)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'user-1',
      name: 'User 1',
      wrappedStatus: 'completed',
      totalWrappedCount: 1,
      totalShares: 1,
      totalVisits: 5,
    })
    expect(result[0].llmUsage).toMatchObject({
      totalTokens: 1000,
      promptTokens: 500,
      completionTokens: 500,
      cost: 0.01,
      provider: 'openai',
      model: 'gpt-4',
      count: 1,
    })
  })

  it('should use current year as default', async () => {
    const currentYear = new Date().getFullYear()
    mockPrisma.user.findMany.mockResolvedValue([])
    mockPrisma.plexWrapped.findMany.mockResolvedValue([])

    await getAllUsersWithWrapped()

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      orderBy: [
        { isAdmin: 'desc' },
        { name: 'asc' },
      ],
      include: {
        plexWrapped: {
          where: {
            year: currentYear,
          },
          take: 1,
          include: {
            llmUsage: true,
          },
        },
        llmUsage: true,
        _count: {
          select: {
            plexWrapped: true,
          },
        },
      },
    })
  })

  it('should handle users without wrapped', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        name: 'User 1',
        email: 'user1@example.com',
        image: null,
        plexUserId: 'plex-1',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plexWrapped: [],
        llmUsage: [],
        _count: {
          plexWrapped: 0,
        },
      },
    ]

    mockPrisma.user.findMany.mockResolvedValue(mockUsers as any)
    mockPrisma.plexWrapped.findMany.mockResolvedValue([])

    const result = await getAllUsersWithWrapped(2024)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'user-1',
      wrappedStatus: null,
      totalWrappedCount: 0,
      totalShares: 0,
      totalVisits: 0,
      llmUsage: null,
      totalLlmUsage: null,
    })
  })

  it('should aggregate multiple LLM usage records', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        name: 'User 1',
        email: 'user1@example.com',
        image: null,
        plexUserId: 'plex-1',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plexWrapped: [
          {
            id: 'wrapped-1',
            year: 2024,
            status: 'completed',
            generatedAt: new Date(),
            llmUsage: [
              {
                totalTokens: 1000,
                promptTokens: 500,
                completionTokens: 500,
                cost: 0.01,
                provider: 'openai',
                model: 'gpt-4',
              },
              {
                totalTokens: 2000,
                promptTokens: 1000,
                completionTokens: 1000,
                cost: 0.02,
                provider: 'openai',
                model: 'gpt-4',
              },
            ],
          },
        ],
        llmUsage: [
          {
            totalTokens: 1000,
            promptTokens: 500,
            completionTokens: 500,
            cost: 0.01,
            provider: 'openai',
            model: 'gpt-4',
          },
          {
            totalTokens: 2000,
            promptTokens: 1000,
            completionTokens: 1000,
            cost: 0.02,
            provider: 'openai',
            model: 'gpt-4',
          },
        ],
        _count: {
          plexWrapped: 1,
        },
      },
    ]

    mockPrisma.user.findMany.mockResolvedValue(mockUsers as any)
    mockPrisma.plexWrapped.findMany.mockResolvedValue([])

    const result = await getAllUsersWithWrapped(2024)

    expect(result[0].llmUsage).toMatchObject({
      totalTokens: 3000,
      promptTokens: 1500,
      completionTokens: 1500,
      cost: 0.03,
      count: 2,
    })
  })

  it('should return empty array on error', async () => {
    mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'))

    const result = await getAllUsersWithWrapped(2024)

    expect(result).toEqual([])
  })

  it('should calculate share and visit counts correctly', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        name: 'User 1',
        email: 'user1@example.com',
        image: null,
        plexUserId: 'plex-1',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        plexWrapped: [],
        llmUsage: [],
        _count: {
          plexWrapped: 2,
        },
      },
    ]

    mockPrisma.user.findMany.mockResolvedValue(mockUsers as any)
    mockPrisma.plexWrapped.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        shareToken: 'token-1',
        _count: {
          shareVisits: 5,
        },
      },
      {
        userId: 'user-1',
        shareToken: 'token-2',
        _count: {
          shareVisits: 10,
        },
      },
      {
        userId: 'user-1',
        shareToken: null, // No share token
        _count: {
          shareVisits: 2,
        },
      },
    ] as any)

    const result = await getAllUsersWithWrapped(2024)

    expect(result[0].totalShares).toBe(2) // Only wraps with shareToken
    expect(result[0].totalVisits).toBe(17) // Sum of all visits
  })
})

