import { WrappedSection } from '@/types/wrapped'
import { render, screen } from '@testing-library/react'
import { TopMoviesSection } from '@/components/wrapped/wrapped-sections/top-movies-section'

// Mock child components
jest.mock('../shared/formatted-text', () => ({
  FormattedText: ({ text }: { text: string }) => <span>{text}</span>,
}))

describe('TopMoviesSection', () => {
  const createMockSection = (overrides?: Partial<WrappedSection>): WrappedSection => ({
    id: 'top-movies-1',
    type: 'top-movies',
    title: 'Top Movies',
    content: 'Your favorite movies',
    ...overrides,
  })

  it('should render title', () => {
    const section = createMockSection()
    render(<TopMoviesSection section={section} />)

    expect(screen.getByText('Top Movies')).toBeInTheDocument()
  })

  it('should render subtitle when provided', () => {
    const section = createMockSection({
      subtitle: 'Your most watched films',
    })
    render(<TopMoviesSection section={section} />)

    expect(screen.getByText('Your most watched films')).toBeInTheDocument()
  })

  it('should render movies list', () => {
    const section = createMockSection({
      data: {
        movies: [
          { title: 'Movie 1', watchTime: 120 },
          { title: 'Movie 2', watchTime: 90 },
        ],
      },
    })
    render(<TopMoviesSection section={section} />)

    expect(screen.getByText('Movie 1')).toBeInTheDocument()
    expect(screen.getByText('Movie 2')).toBeInTheDocument()
  })

  it('should render movie year when provided', () => {
    const section = createMockSection({
      data: {
        movies: [
          { title: 'Movie 1', year: 2020, watchTime: 120 },
        ],
      },
    })
    render(<TopMoviesSection section={section} />)

    expect(screen.getByText('(2020)')).toBeInTheDocument()
  })

  it('should render watch time for each movie', () => {
    const section = createMockSection({
      data: {
        movies: [
          { title: 'Movie 1', watchTime: 120 },
        ],
      },
    })
    render(<TopMoviesSection section={section} />)

    expect(screen.getByText(/2 hours watched/i)).toBeInTheDocument()
  })

  it('should render numbered rankings', () => {
    const section = createMockSection({
      data: {
        movies: [
          { title: 'Movie 1', watchTime: 120 },
          { title: 'Movie 2', watchTime: 90 },
        ],
      },
    })
    render(<TopMoviesSection section={section} />)

    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
  })

  it('should render content when provided', () => {
    const section = createMockSection({
      content: 'These are your top movies',
    })
    render(<TopMoviesSection section={section} />)

    expect(screen.getByText('These are your top movies')).toBeInTheDocument()
  })

  it('should handle empty movies array', () => {
    const section = createMockSection({
      data: {
        movies: [],
      },
    })
    render(<TopMoviesSection section={section} />)

    expect(screen.getByText('Top Movies')).toBeInTheDocument()
  })

  it('should handle missing data property', () => {
    const section = createMockSection({
      data: undefined,
    })
    render(<TopMoviesSection section={section} />)

    expect(screen.getByText('Top Movies')).toBeInTheDocument()
  })

  it('should handle missing movies array', () => {
    const section = createMockSection({
      data: {},
    })
    render(<TopMoviesSection section={section} />)

    expect(screen.getByText('Top Movies')).toBeInTheDocument()
  })
})

