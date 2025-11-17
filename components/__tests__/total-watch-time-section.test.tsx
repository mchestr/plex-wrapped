import { render, screen } from '@testing-library/react'
import { TotalWatchTimeSection } from '../wrapped-sections/total-watch-time-section'
import { WrappedData, WrappedSection } from '@/types/wrapped'

// Mock child components
jest.mock('../formatted-text', () => ({
  FormattedText: ({ text }: { text: string }) => <span>{text}</span>,
}))

jest.mock('../wrapped-charts', () => ({
  BarChart: ({ data }: { data: Array<{ label: string; value: number }> }) => (
    <div data-testid="bar-chart">{data.length} bars</div>
  ),
  Sparkline: ({ data }: { data: number[] }) => (
    <div data-testid="sparkline">{data.length} points</div>
  ),
}))

jest.mock('../wrapped-sections/section-header', () => ({
  SectionHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}))

describe('TotalWatchTimeSection', () => {
  const createMockSection = (overrides?: Partial<WrappedSection>): WrappedSection => ({
    id: 'total-watch-time-1',
    type: 'total-watch-time',
    title: 'Total Watch Time',
    content: 'You watched a lot!',
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
      watchTimeByMonth: [],
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

  it('should render section with title and content', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData()

    render(<TotalWatchTimeSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('Total Watch Time')).toBeInTheDocument()
    expect(screen.getByText('You watched a lot!')).toBeInTheDocument()
  })

  it('should render total watch time', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
      statistics: {
        totalWatchTime: {
          total: 1440, // 24 hours
          movies: 720,
          shows: 720,
        },
        moviesWatched: 10,
        showsWatched: 5,
        episodesWatched: 50,
        topMovies: [],
        topShows: [],
        watchTimeByMonth: [],
      },
    })

    render(<TotalWatchTimeSection section={section} wrappedData={wrappedData} />)

    // Should display formatted watch time (24 hours = 1 day)
    expect(screen.getByText(/1 day/i)).toBeInTheDocument()
  })

  it('should render monthly watch time chart when data exists', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
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
        watchTimeByMonth: [
          { month: 1, watchTime: 100 },
          { month: 2, watchTime: 150 },
        ],
      },
    })

    render(<TotalWatchTimeSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByTestId('sparkline')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByText('Watch Time by Month')).toBeInTheDocument()
  })

  it('should not render monthly charts when no watch time data', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
      statistics: {
        totalWatchTime: {
          total: 0,
          movies: 0,
          shows: 0,
        },
        moviesWatched: 0,
        showsWatched: 0,
        episodesWatched: 0,
        topMovies: [],
        topShows: [],
        watchTimeByMonth: [],
      },
    })

    render(<TotalWatchTimeSection section={section} wrappedData={wrappedData} />)

    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('should fill in missing months with zero values', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
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
        watchTimeByMonth: [
          { month: 1, watchTime: 100 },
          { month: 6, watchTime: 200 },
        ],
      },
    })

    render(<TotalWatchTimeSection section={section} wrappedData={wrappedData} />)

    // Should create a complete 12-month array
    const barChart = screen.getByTestId('bar-chart')
    expect(barChart).toHaveTextContent('12 bars')
  })

  it('should render subtitle when provided', () => {
    const section = createMockSection({
      subtitle: 'Your viewing summary',
    })
    const wrappedData = createMockWrappedData()

    render(<TotalWatchTimeSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('Your viewing summary')).toBeInTheDocument()
  })

  it('should handle watchTimeByMonth being undefined', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
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
        watchTimeByMonth: undefined as any,
      },
    })

    render(<TotalWatchTimeSection section={section} wrappedData={wrappedData} />)

    // Should not crash and should not render charts
    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument()
  })

  it('should display rounded watch time note', () => {
    const section = createMockSection()
    const wrappedData = createMockWrappedData({
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
        watchTimeByMonth: [
          { month: 1, watchTime: 100 },
        ],
      },
    })

    render(<TotalWatchTimeSection section={section} wrappedData={wrappedData} />)

    expect(screen.getByText('Watch time rounded to nearest hour')).toBeInTheDocument()
  })
})

