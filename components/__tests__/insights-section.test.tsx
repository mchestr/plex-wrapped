import { render, screen } from '@testing-library/react'
import { InsightsSection } from '../wrapped-sections/insights-section'
import { WrappedData, WrappedSection } from '@/types/wrapped'

// Mock child components
jest.mock('../formatted-text', () => ({
  FormattedText: ({ text }: { text: string }) => <span>{text}</span>,
}))

jest.mock('../wrapped-sections/section-header', () => ({
  SectionHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}))

describe('InsightsSection', () => {
  const createMockSection = (overrides?: Partial<WrappedSection>): WrappedSection => ({
    id: 'insights-1',
    type: 'insights',
    title: 'Your Insights',
    content: 'You are a cinephile',
    ...overrides,
  })

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
    sections: [],
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

  it('should render title and content', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData()
    render(<InsightsSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('Your Insights')).toBeInTheDocument()
    expect(screen.getByText('You are a cinephile')).toBeInTheDocument()
  })

  it('should render personality', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
      insights: {
        personality: 'Binge Watcher',
        topGenre: 'Comedy',
        bingeWatcher: false,
        discoveryScore: 50,
        funFacts: [],
      },
    })
    render(<InsightsSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('Binge Watcher')).toBeInTheDocument()
  })

  it('should render top genre', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData()
    render(<InsightsSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('Top Genre')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('should render discovery score', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
      insights: {
        personality: 'Cinephile',
        topGenre: 'Action',
        bingeWatcher: false,
        discoveryScore: 85,
        funFacts: [],
      },
    })
    render(<InsightsSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('Discovery Score')).toBeInTheDocument()
    expect(screen.getByText('85/100')).toBeInTheDocument()
  })

  it('should render binge watcher badge when true', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
      insights: {
        personality: 'Cinephile',
        topGenre: 'Action',
        bingeWatcher: true,
        discoveryScore: 75,
        funFacts: [],
      },
    })
    render(<InsightsSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('Binge Watcher')).toBeInTheDocument()
  })

  it('should not render binge watcher badge when false', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
      insights: {
        personality: 'Cinephile',
        topGenre: 'Action',
        bingeWatcher: false,
        discoveryScore: 75,
        funFacts: [],
      },
    })
    render(<InsightsSection section={section} wrappedData={wrappedData} />)

    // Should still show "Binge Watcher" label but not the checkmark badge
    const bingeWatcherElements = screen.queryAllByText('Binge Watcher')
    expect(bingeWatcherElements.length).toBe(0)
  })

  it('should render subtitle when provided', () => {
    const section = createMockSection({
      subtitle: 'Your viewing personality',
    })
    const wrappedData = createMockWrappedData()
    render(<InsightsSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('Your viewing personality')).toBeInTheDocument()
  })

  it('should handle zero discovery score', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
      insights: {
        personality: 'Cinephile',
        topGenre: 'Action',
        bingeWatcher: false,
        discoveryScore: 0,
        funFacts: [],
      },
    })
    render(<InsightsSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('0/100')).toBeInTheDocument()
  })

  it('should handle 100 discovery score', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
      insights: {
        personality: 'Cinephile',
        topGenre: 'Action',
        bingeWatcher: false,
        discoveryScore: 100,
        funFacts: [],
      },
    })
    render(<InsightsSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('100/100')).toBeInTheDocument()
  })
})

