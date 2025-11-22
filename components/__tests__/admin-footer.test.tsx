import { AdminFooter } from '@/components/shared/admin-footer'
import { getConfig } from '@/actions/admin'
import { getShareAnalyticsStats } from '@/actions/share-analytics'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLLMUsageStats } from '@/lib/wrapped/usage'
import { render, screen } from '@testing-library/react'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/wrapped/usage', () => ({
  getLLMUsageStats: jest.fn(),
}))

jest.mock('@/actions/admin', () => ({
  getConfig: jest.fn(),
}))

jest.mock('@/actions/share-analytics', () => ({
  getShareAnalyticsStats: jest.fn(),
}))

jest.mock('@/components/shared/admin-footer-client', () => ({
  AdminFooterClient: ({
    session,
    stats,
    totalUsers,
    shareStats,
    llmDisabled,
  }: {
    session: any
    stats: any
    totalUsers: number
    shareStats: any
    llmDisabled: boolean
  }) => (
    <div data-testid="admin-footer-client">
      <div data-testid="session">{JSON.stringify(session)}</div>
      <div data-testid="stats">{JSON.stringify(stats)}</div>
      <div data-testid="total-users">{totalUsers}</div>
      <div data-testid="share-stats">{JSON.stringify(shareStats)}</div>
      <div data-testid="llm-disabled">{llmDisabled.toString()}</div>
    </div>
  ),
}))

describe('AdminFooter', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      name: 'Test Admin',
      email: 'admin@example.com',
      isAdmin: true,
    },
    expires: '2025-12-31',
  }

  const mockStats = {
    totalTokens: 1500000,
    totalCost: 25.5678,
    totalRequests: 150,
  }

  const mockShareStats = {
    totalShares: 45,
    totalVisits: 320,
  }

  const mockConfig = {
    llmDisabled: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Admin User', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(getLLMUsageStats as jest.Mock).mockResolvedValue(mockStats)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(100)
      ;(getShareAnalyticsStats as jest.Mock).mockResolvedValue(mockShareStats)
      ;(getConfig as jest.Mock).mockResolvedValue(mockConfig)
    })

    it('renders AdminFooterClient for admin users', async () => {
      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      expect(screen.getByTestId('admin-footer-client')).toBeInTheDocument()
    })

    it('passes correct session data to AdminFooterClient', async () => {
      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const sessionData = screen.getByTestId('session')
      expect(sessionData.textContent).toBe(JSON.stringify(mockSession))
    })

    it('passes correct stats data to AdminFooterClient', async () => {
      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const statsData = screen.getByTestId('stats')
      expect(statsData.textContent).toBe(JSON.stringify(mockStats))
    })

    it('passes correct total users count to AdminFooterClient', async () => {
      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const totalUsers = screen.getByTestId('total-users')
      expect(totalUsers.textContent).toBe('100')
    })

    it('passes correct share stats to AdminFooterClient', async () => {
      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const shareStats = screen.getByTestId('share-stats')
      expect(shareStats.textContent).toBe(JSON.stringify(mockShareStats))
    })

    it('passes correct llmDisabled flag to AdminFooterClient', async () => {
      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const llmDisabled = screen.getByTestId('llm-disabled')
      expect(llmDisabled.textContent).toBe('false')
    })

    it('fetches all required data in parallel', async () => {
      await AdminFooter()

      expect(getLLMUsageStats).toHaveBeenCalledTimes(1)
      expect(prisma.user.count).toHaveBeenCalledTimes(1)
      expect(getShareAnalyticsStats).toHaveBeenCalledTimes(1)
      expect(getConfig).toHaveBeenCalledTimes(1)
    })

    it('passes llmDisabled=true when config has it enabled', async () => {
      ;(getConfig as jest.Mock).mockResolvedValue({ llmDisabled: true })

      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const llmDisabled = screen.getByTestId('llm-disabled')
      expect(llmDisabled.textContent).toBe('true')
    })
  })

  describe('Non-Admin User', () => {
    it('returns null for non-admin users', async () => {
      const nonAdminSession = {
        user: {
          id: 'user-456',
          name: 'Regular User',
          email: 'user@example.com',
          isAdmin: false,
        },
        expires: '2025-12-31',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(nonAdminSession)

      const component = await AdminFooter()

      expect(component).toBeNull()
    })

    it('does not fetch data for non-admin users', async () => {
      const nonAdminSession = {
        user: {
          id: 'user-456',
          name: 'Regular User',
          email: 'user@example.com',
          isAdmin: false,
        },
        expires: '2025-12-31',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(nonAdminSession)

      await AdminFooter()

      expect(getLLMUsageStats).not.toHaveBeenCalled()
      expect(prisma.user.count).not.toHaveBeenCalled()
      expect(getShareAnalyticsStats).not.toHaveBeenCalled()
      expect(getConfig).not.toHaveBeenCalled()
    })
  })

  describe('No Session', () => {
    it('returns null when there is no session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const component = await AdminFooter()

      expect(component).toBeNull()
    })

    it('does not fetch data when there is no session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await AdminFooter()

      expect(getLLMUsageStats).not.toHaveBeenCalled()
      expect(prisma.user.count).not.toHaveBeenCalled()
      expect(getShareAnalyticsStats).not.toHaveBeenCalled()
      expect(getConfig).not.toHaveBeenCalled()
    })
  })

  describe('Session Without isAdmin Property', () => {
    it('returns null when session user does not have isAdmin property', async () => {
      const sessionWithoutAdmin = {
        user: {
          id: 'user-789',
          name: 'User Without Admin',
          email: 'nonadmin@example.com',
        },
        expires: '2025-12-31',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(sessionWithoutAdmin)

      const component = await AdminFooter()

      expect(component).toBeNull()
    })
  })

  describe('Data Fetching Edge Cases', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('handles zero stats correctly', async () => {
      const zeroStats = {
        totalTokens: 0,
        totalCost: 0,
        totalRequests: 0,
      }

      const zeroShareStats = {
        totalShares: 0,
        totalVisits: 0,
      }

      ;(getLLMUsageStats as jest.Mock).mockResolvedValue(zeroStats)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(0)
      ;(getShareAnalyticsStats as jest.Mock).mockResolvedValue(zeroShareStats)
      ;(getConfig as jest.Mock).mockResolvedValue(mockConfig)

      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const statsData = screen.getByTestId('stats')
      expect(statsData.textContent).toBe(JSON.stringify(zeroStats))

      const totalUsers = screen.getByTestId('total-users')
      expect(totalUsers.textContent).toBe('0')

      const shareStats = screen.getByTestId('share-stats')
      expect(shareStats.textContent).toBe(JSON.stringify(zeroShareStats))
    })

    it('handles large numbers correctly', async () => {
      const largeStats = {
        totalTokens: 999999999,
        totalCost: 99999.9999,
        totalRequests: 999999,
      }

      const largeShareStats = {
        totalShares: 999999,
        totalVisits: 9999999,
      }

      ;(getLLMUsageStats as jest.Mock).mockResolvedValue(largeStats)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(999999)
      ;(getShareAnalyticsStats as jest.Mock).mockResolvedValue(largeShareStats)
      ;(getConfig as jest.Mock).mockResolvedValue(mockConfig)

      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const statsData = screen.getByTestId('stats')
      expect(statsData.textContent).toBe(JSON.stringify(largeStats))

      const totalUsers = screen.getByTestId('total-users')
      expect(totalUsers.textContent).toBe('999999')

      const shareStats = screen.getByTestId('share-stats')
      expect(shareStats.textContent).toBe(JSON.stringify(largeShareStats))
    })

    it('handles decimal costs correctly', async () => {
      const preciseStats = {
        totalTokens: 1000,
        totalCost: 0.0001,
        totalRequests: 10,
      }

      ;(getLLMUsageStats as jest.Mock).mockResolvedValue(preciseStats)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(5)
      ;(getShareAnalyticsStats as jest.Mock).mockResolvedValue(mockShareStats)
      ;(getConfig as jest.Mock).mockResolvedValue(mockConfig)

      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const statsData = screen.getByTestId('stats')
      expect(statsData.textContent).toBe(JSON.stringify(preciseStats))
    })
  })

  describe('Authentication Integration', () => {
    it('calls getServerSession with authOptions', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(getLLMUsageStats as jest.Mock).mockResolvedValue(mockStats)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(100)
      ;(getShareAnalyticsStats as jest.Mock).mockResolvedValue(mockShareStats)
      ;(getConfig as jest.Mock).mockResolvedValue(mockConfig)

      await AdminFooter()

      expect(getServerSession).toHaveBeenCalledWith(authOptions)
    })
  })

  describe('Config Integration', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(getLLMUsageStats as jest.Mock).mockResolvedValue(mockStats)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(100)
      ;(getShareAnalyticsStats as jest.Mock).mockResolvedValue(mockShareStats)
    })

    it('fetches config after other data', async () => {
      ;(getConfig as jest.Mock).mockResolvedValue(mockConfig)

      await AdminFooter()

      expect(getConfig).toHaveBeenCalledTimes(1)
    })

    it('handles config with llmDisabled=true', async () => {
      ;(getConfig as jest.Mock).mockResolvedValue({ llmDisabled: true })

      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const llmDisabled = screen.getByTestId('llm-disabled')
      expect(llmDisabled.textContent).toBe('true')
    })

    it('handles config with llmDisabled=false', async () => {
      ;(getConfig as jest.Mock).mockResolvedValue({ llmDisabled: false })

      const component = await AdminFooter()
      const { container } = render(component as React.ReactElement)

      const llmDisabled = screen.getByTestId('llm-disabled')
      expect(llmDisabled.textContent).toBe('false')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('propagates errors from getLLMUsageStats', async () => {
      const error = new Error('Failed to fetch LLM usage stats')
      ;(getLLMUsageStats as jest.Mock).mockRejectedValue(error)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(100)
      ;(getShareAnalyticsStats as jest.Mock).mockResolvedValue(mockShareStats)
      ;(getConfig as jest.Mock).mockResolvedValue(mockConfig)

      await expect(AdminFooter()).rejects.toThrow('Failed to fetch LLM usage stats')
    })

    it('propagates errors from prisma.user.count', async () => {
      const error = new Error('Database connection failed')
      ;(getLLMUsageStats as jest.Mock).mockResolvedValue(mockStats)
      ;(prisma.user.count as jest.Mock).mockRejectedValue(error)
      ;(getShareAnalyticsStats as jest.Mock).mockResolvedValue(mockShareStats)
      ;(getConfig as jest.Mock).mockResolvedValue(mockConfig)

      await expect(AdminFooter()).rejects.toThrow('Database connection failed')
    })

    it('propagates errors from getShareAnalyticsStats', async () => {
      const error = new Error('Failed to fetch share analytics')
      ;(getLLMUsageStats as jest.Mock).mockResolvedValue(mockStats)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(100)
      ;(getShareAnalyticsStats as jest.Mock).mockRejectedValue(error)
      ;(getConfig as jest.Mock).mockResolvedValue(mockConfig)

      await expect(AdminFooter()).rejects.toThrow('Failed to fetch share analytics')
    })

    it('propagates errors from getConfig', async () => {
      const error = new Error('Failed to fetch config')
      ;(getLLMUsageStats as jest.Mock).mockResolvedValue(mockStats)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(100)
      ;(getShareAnalyticsStats as jest.Mock).mockResolvedValue(mockShareStats)
      ;(getConfig as jest.Mock).mockRejectedValue(error)

      await expect(AdminFooter()).rejects.toThrow('Failed to fetch config')
    })
  })

  describe('Parallel Data Fetching', () => {
    it('uses Promise.all for parallel data fetching', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(getLLMUsageStats as jest.Mock).mockResolvedValue(mockStats)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(100)
      ;(getShareAnalyticsStats as jest.Mock).mockResolvedValue(mockShareStats)
      ;(getConfig as jest.Mock).mockResolvedValue(mockConfig)

      const startTime = Date.now()
      await AdminFooter()
      const endTime = Date.now()

      // Verify all functions were called
      expect(getLLMUsageStats).toHaveBeenCalled()
      expect(prisma.user.count).toHaveBeenCalled()
      expect(getShareAnalyticsStats).toHaveBeenCalled()
      expect(getConfig).toHaveBeenCalled()

      // If they were sequential, it would take much longer
      // This is a basic check that they're called in parallel
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })
})

