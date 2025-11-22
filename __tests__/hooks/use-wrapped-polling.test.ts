import { renderHook, waitFor } from '@testing-library/react'
import { useWrappedPolling } from '@/hooks/use-wrapped-polling'
import { getUserPlexWrapped } from '@/actions/users'
import { useRouter } from 'next/navigation'

jest.mock('@/actions/users', () => ({
  getUserPlexWrapped: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockGetUserPlexWrapped = getUserPlexWrapped as jest.MockedFunction<typeof getUserPlexWrapped>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('useWrappedPolling', () => {
  let mockPush: jest.Mock
  let mockOnStatusChange: jest.Mock
  let mockOnError: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockPush = jest.fn()
    mockOnStatusChange = jest.fn()
    mockOnError = jest.fn()

    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('initial state', () => {
    it('should not start polling when isGenerating is false and wrappedStatus is not generating', () => {
      renderHook(() =>
        useWrappedPolling({
          userId: 'user-1',
          year: 2024,
          isGenerating: false,
          wrappedStatus: 'completed',
          onStatusChange: mockOnStatusChange,
          onError: mockOnError,
        })
      )

      jest.advanceTimersByTime(5000)

      expect(mockGetUserPlexWrapped).not.toHaveBeenCalled()
      expect(mockOnStatusChange).not.toHaveBeenCalled()
    })

    it('should not start polling when userId is empty', () => {
      renderHook(() =>
        useWrappedPolling({
          userId: '',
          year: 2024,
          isGenerating: true,
          wrappedStatus: 'generating',
          onStatusChange: mockOnStatusChange,
          onError: mockOnError,
        })
      )

      jest.advanceTimersByTime(5000)

      expect(mockGetUserPlexWrapped).not.toHaveBeenCalled()
    })
  })

  describe('polling behavior', () => {
    it('should start polling when isGenerating is true', async () => {
      mockGetUserPlexWrapped.mockResolvedValue({
        id: 'wrapped-1',
        status: 'generating',
        year: 2024,
      } as any)

      renderHook(() =>
        useWrappedPolling({
          userId: 'user-1',
          year: 2024,
          isGenerating: true,
          wrappedStatus: null,
          onStatusChange: mockOnStatusChange,
          onError: mockOnError,
        })
      )

      // Advance time to trigger first poll
      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledWith('user-1', 2024)
        expect(mockOnStatusChange).toHaveBeenCalledWith({
          id: 'wrapped-1',
          status: 'generating',
          year: 2024,
        })
      })
    })

    it('should start polling when wrappedStatus is generating', async () => {
      mockGetUserPlexWrapped.mockResolvedValue({
        id: 'wrapped-1',
        status: 'generating',
        year: 2024,
      } as any)

      renderHook(() =>
        useWrappedPolling({
          userId: 'user-1',
          year: 2024,
          isGenerating: false,
          wrappedStatus: 'generating',
          onStatusChange: mockOnStatusChange,
          onError: mockOnError,
        })
      )

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledWith('user-1', 2024)
      })
    })

    it('should poll every 2 seconds while generating', async () => {
      mockGetUserPlexWrapped.mockResolvedValue({
        id: 'wrapped-1',
        status: 'generating',
        year: 2024,
      } as any)

      renderHook(() =>
        useWrappedPolling({
          userId: 'user-1',
          year: 2024,
          isGenerating: true,
          wrappedStatus: 'generating',
          onStatusChange: mockOnStatusChange,
          onError: mockOnError,
        })
      )

      // First poll
      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledTimes(1)
      })

      // Second poll
      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledTimes(2)
      })

      // Third poll
      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('completion handling', () => {
    it('should stop polling and navigate when status is completed', async () => {
      mockGetUserPlexWrapped.mockResolvedValue({
        id: 'wrapped-1',
        status: 'completed',
        year: 2024,
      } as any)

      renderHook(() =>
        useWrappedPolling({
          userId: 'user-1',
          year: 2024,
          isGenerating: true,
          wrappedStatus: 'generating',
          onStatusChange: mockOnStatusChange,
          onError: mockOnError,
        })
      )

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith({
          id: 'wrapped-1',
          status: 'completed',
          year: 2024,
        })
        expect(mockPush).toHaveBeenCalledWith('/wrapped')
      })

      // Should not poll again
      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledTimes(1)
      })
    })

    it('should stop polling and call onError when status is failed', async () => {
      mockGetUserPlexWrapped.mockResolvedValue({
        id: 'wrapped-1',
        status: 'failed',
        error: 'Generation failed due to API error',
        year: 2024,
      } as any)

      renderHook(() =>
        useWrappedPolling({
          userId: 'user-1',
          year: 2024,
          isGenerating: true,
          wrappedStatus: 'generating',
          onStatusChange: mockOnStatusChange,
          onError: mockOnError,
        })
      )

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith({
          id: 'wrapped-1',
          status: 'failed',
          error: 'Generation failed due to API error',
          year: 2024,
        })
        expect(mockOnError).toHaveBeenCalledWith('Generation failed due to API error')
      })

      // Should not poll again
      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledTimes(1)
      })
    })

    it('should call onError with default message when failed status has no error', async () => {
      mockGetUserPlexWrapped.mockResolvedValue({
        id: 'wrapped-1',
        status: 'failed',
        year: 2024,
      } as any)

      renderHook(() =>
        useWrappedPolling({
          userId: 'user-1',
          year: 2024,
          isGenerating: true,
          wrappedStatus: 'generating',
          onStatusChange: mockOnStatusChange,
          onError: mockOnError,
        })
      )

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to generate wrapped')
      })
    })
  })

  describe('error handling', () => {
    it('should handle polling errors gracefully without stopping', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('Network error')
      mockGetUserPlexWrapped.mockRejectedValue(error)

      renderHook(() =>
        useWrappedPolling({
          userId: 'user-1',
          year: 2024,
          isGenerating: true,
          wrappedStatus: 'generating',
          onStatusChange: mockOnStatusChange,
          onError: mockOnError,
        })
      )

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error polling wrapped status:', error)
      })

      // Should continue polling after error
      mockGetUserPlexWrapped.mockResolvedValue({
        id: 'wrapped-1',
        status: 'generating',
        year: 2024,
      } as any)

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledTimes(2)
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('cleanup', () => {
    it('should clear interval on unmount', async () => {
      mockGetUserPlexWrapped.mockResolvedValue({
        id: 'wrapped-1',
        status: 'generating',
        year: 2024,
      } as any)

      const { unmount } = renderHook(() =>
        useWrappedPolling({
          userId: 'user-1',
          year: 2024,
          isGenerating: true,
          wrappedStatus: 'generating',
          onStatusChange: mockOnStatusChange,
          onError: mockOnError,
        })
      )

      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledTimes(1)
      })

      // Unmount the hook
      unmount()

      // Should not poll after unmount
      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledTimes(1)
      })
    })

    it('should clear interval when dependencies change', async () => {
      mockGetUserPlexWrapped.mockResolvedValue({
        id: 'wrapped-1',
        status: 'generating',
        year: 2024,
      } as any)

      const { rerender } = renderHook(
        ({ userId, year }) =>
          useWrappedPolling({
            userId,
            year,
            isGenerating: true,
            wrappedStatus: 'generating',
            onStatusChange: mockOnStatusChange,
            onError: mockOnError,
          }),
        {
          initialProps: { userId: 'user-1', year: 2024 },
        }
      )

      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledWith('user-1', 2024)
      })

      // Change year - should restart polling
      rerender({ userId: 'user-1', year: 2025 })

      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledWith('user-1', 2025)
      })
    })

    it('should stop polling when isGenerating becomes false', async () => {
      mockGetUserPlexWrapped.mockResolvedValue({
        id: 'wrapped-1',
        status: 'generating',
        year: 2024,
      } as any)

      const { rerender } = renderHook(
        ({ isGenerating }) =>
          useWrappedPolling({
            userId: 'user-1',
            year: 2024,
            isGenerating,
            wrappedStatus: null,
            onStatusChange: mockOnStatusChange,
            onError: mockOnError,
          }),
        {
          initialProps: { isGenerating: true },
        }
      )

      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(mockGetUserPlexWrapped).toHaveBeenCalledTimes(1)
      })

      // Stop generating
      rerender({ isGenerating: false })

      jest.advanceTimersByTime(2000)
      // Should not poll again
      expect(mockGetUserPlexWrapped).toHaveBeenCalledTimes(1)
    })
  })
})

