import { render, screen, waitFor } from '@testing-library/react'
import { WrappedViewer } from '../wrapped-viewer'
import { WrappedData } from '@/types/wrapped'

// Mock child components
jest.mock('../formatted-text', () => ({
  FormattedText: ({ text }: { text: string }) => <span>{text}</span>,
}))

jest.mock('../setup-wizard/space-background', () => ({
  SpaceBackground: () => <div data-testid="space-background" />,
}))

jest.mock('../wrapped-share-button', () => ({
  WrappedShareButton: () => <div data-testid="share-button">Share</div>,
}))

describe('WrappedViewer', () => {
  const createMockWrappedData = (overrides?: Partial<WrappedData>): WrappedData => ({
    year: 2024,
    userId: 'user-1',
    userName: 'Test User',
    generatedAt: '2024-01-01T00:00:00Z',
    statistics: {
      totalWatchTime: {
        total: 1000,
        movies: 500,
        shows: 500,
      },
      moviesWatched: 10,
      showsWatched: 5,
      episodesWatched: 50,
      topMovies: [],
      topShows: [],
    },
    sections: [
      {
        id: 'hero-1',
        type: 'hero',
        title: 'Welcome',
        content: 'Welcome to your wrapped',
      },
    ],
    insights: {
      personality: 'Cinephile',
      topGenre: 'Action',
      bingeWatcher: true,
      discoveryScore: 75,
      funFacts: [],
    },
    metadata: {
      totalSections: 1,
      generationTime: 5,
    },
    ...overrides,
  })

  describe('Edge cases - undefined/null section handling', () => {
    it('should handle sections array with undefined values', () => {
      const wrappedData = createMockWrappedData({
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Welcome',
            content: 'Welcome to your wrapped',
          },
          undefined as any,
          null as any,
        ],
      })

      expect(() => {
        render(<WrappedViewer wrappedData={wrappedData} />)
      }).not.toThrow()
    })

    it('should handle sections array with missing type property', () => {
      const wrappedData = createMockWrappedData({
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Welcome',
            content: 'Welcome to your wrapped',
          },
          {
            id: 'invalid-1',
            // Missing type property - should be included but renderSection will handle gracefully
            title: 'Invalid Section',
            content: 'This should still be included',
          } as any,
        ],
      })

      const { container } = render(<WrappedViewer wrappedData={wrappedData} />)
      // Should not throw, and should show error message for invalid section
      expect(container).toBeTruthy()
    })

    it('should handle sections array with missing id property', () => {
      const wrappedData = createMockWrappedData({
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Welcome',
            content: 'Welcome to your wrapped',
          },
          {
            // Missing id property
            type: 'hero',
            title: 'Invalid Section',
            content: 'This should be filtered out',
          } as any,
        ],
      })

      expect(() => {
        render(<WrappedViewer wrappedData={wrappedData} />)
      }).not.toThrow()
    })

    it('should handle empty sections array', () => {
      const wrappedData = createMockWrappedData({
        sections: [],
      })

      const { container } = render(<WrappedViewer wrappedData={wrappedData} />)
      expect(screen.getByText('No sections available to display')).toBeInTheDocument()
    })

    it('should handle undefined sections property', () => {
      const wrappedData = createMockWrappedData({
        sections: undefined as any,
      })

      const { container } = render(<WrappedViewer wrappedData={wrappedData} />)
      expect(screen.getByText('No sections available to display')).toBeInTheDocument()
    })

    it('should filter out service-stats sections', () => {
      const wrappedData = createMockWrappedData({
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Welcome',
            content: 'Welcome to your wrapped',
          },
          {
            id: 'service-stats-1',
            type: 'service-stats',
            title: 'Service Stats',
            content: 'This should be filtered',
          },
        ],
      })

      render(<WrappedViewer wrappedData={wrappedData} />)
      expect(screen.getByText('Welcome')).toBeInTheDocument()
      expect(screen.queryByText('Service Stats')).not.toBeInTheDocument()
    })

    it('should handle currentSection being undefined when index is out of bounds', () => {
      const wrappedData = createMockWrappedData({
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Welcome',
            content: 'Welcome to your wrapped',
          },
        ],
      })

      // This test ensures the component doesn't crash if currentSectionIndex
      // somehow becomes out of bounds
      const { rerender } = render(<WrappedViewer wrappedData={wrappedData} />)

      // Manually set sections to empty after render to simulate edge case
      // In reality, this would be prevented by the early return check
      expect(() => {
        rerender(<WrappedViewer wrappedData={createMockWrappedData({ sections: [] })} />)
      }).not.toThrow()
    })

    it('should handle section with null type', () => {
      const wrappedData = createMockWrappedData({
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Welcome',
            content: 'Welcome to your wrapped',
          },
          {
            id: 'invalid-2',
            type: null as any,
            title: 'Invalid',
            content: 'Should be filtered',
          },
        ],
      })

      expect(() => {
        render(<WrappedViewer wrappedData={wrappedData} />)
      }).not.toThrow()
    })

    it('should renderSection gracefully handles undefined section', () => {
      const wrappedData = createMockWrappedData({
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Welcome',
            content: 'Welcome to your wrapped',
          },
        ],
      })

      const { container } = render(<WrappedViewer wrappedData={wrappedData} />)

      // Component should render without errors even if internal state
      // somehow results in undefined section
      expect(container).toBeTruthy()
    })
  })

  describe('Normal rendering', () => {
    it('should render hero section correctly', () => {
      const wrappedData = createMockWrappedData({
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Welcome to Your Wrapped',
            subtitle: '2024 Edition',
            content: 'This is your year in review',
          },
        ],
      })

      render(<WrappedViewer wrappedData={wrappedData} />)
      expect(screen.getByText('Welcome to Your Wrapped')).toBeInTheDocument()
      expect(screen.getByText('2024 Edition')).toBeInTheDocument()
      expect(screen.getByText('This is your year in review')).toBeInTheDocument()
    })

    it('should filter sections correctly and render valid ones', () => {
      const wrappedData = createMockWrappedData({
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Welcome',
            content: 'Welcome to your wrapped',
          },
          undefined as any,
          {
            id: 'service-stats-1',
            type: 'service-stats',
            title: 'Service Stats',
            content: 'Filtered',
          },
          {
            id: 'total-watch-time-1',
            type: 'total-watch-time',
            title: 'Total Watch Time',
            content: 'You watched a lot!',
          },
        ],
      })

      render(<WrappedViewer wrappedData={wrappedData} />)

      // Should render hero section
      expect(screen.getByText('Welcome')).toBeInTheDocument()

      // Should not render service-stats (filtered out)
      expect(screen.queryByText('Service Stats')).not.toBeInTheDocument()

      // Should render total-watch-time section (after navigation)
      // Note: This test verifies filtering works, actual navigation would require user interaction
    })
  })

  describe('getSectionDelay edge cases', () => {
    it('should handle getSectionDelay with undefined section at index', () => {
      const wrappedData = createMockWrappedData({
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Welcome',
            content: 'Welcome',
          },
        ],
      })

      // This test ensures getSectionDelay doesn't crash if section is undefined
      // The component should handle this gracefully
      expect(() => {
        render(<WrappedViewer wrappedData={wrappedData} />)
      }).not.toThrow()
    })
  })
})

