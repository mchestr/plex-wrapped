import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WrappedHomeButton } from '../wrapped-home-button'
import * as userActions from '@/actions/users'

// Mock the user actions
jest.mock('@/actions/users', () => ({
  getUserPlexWrapped: jest.fn(),
  generatePlexWrapped: jest.fn(),
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock WrappedGeneratingAnimation
jest.mock('../wrapped-generating-animation', () => ({
  WrappedGeneratingAnimation: ({ year }: { year: number }) => (
    <div data-testid="generating-animation">Generating {year} Wrapped</div>
  ),
}))

describe('WrappedHomeButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should render generate button when no wrapped exists', async () => {
    jest.spyOn(userActions, 'getUserPlexWrapped').mockResolvedValue(null)

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    await waitFor(() => {
      expect(screen.getByText(/My Server \d{4} Wrapped/i)).toBeInTheDocument()
      expect(screen.getByText('Generate My Wrapped')).toBeInTheDocument()
    })
  })

  it('should show loading state initially', () => {
    jest.spyOn(userActions, 'getUserPlexWrapped').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should show view wrapped button when wrapped is completed', async () => {
    jest.spyOn(userActions, 'getUserPlexWrapped').mockResolvedValue({
      id: 'wrapped-1',
      status: 'completed',
      year: 2024,
    } as any)

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    await waitFor(() => {
      expect(screen.getByText("Let's Get Started!")).toBeInTheDocument()
    })
  })

  it('should show try again button when wrapped failed', async () => {
    jest.spyOn(userActions, 'getUserPlexWrapped').mockResolvedValue({
      id: 'wrapped-1',
      status: 'failed',
      error: 'Generation failed',
      year: 2024,
    } as any)

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Generation failed')).toBeInTheDocument()
    })
  })

  it('should show generating animation when generating', async () => {
    jest.spyOn(userActions, 'getUserPlexWrapped').mockResolvedValue({
      id: 'wrapped-1',
      status: 'generating',
      year: 2024,
    } as any)

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    await waitFor(() => {
      expect(screen.getByTestId('generating-animation')).toBeInTheDocument()
    })
  })

  it('should call generatePlexWrapped when generate button is clicked', async () => {
    const user = userEvent.setup({ delay: null })
    jest.spyOn(userActions, 'getUserPlexWrapped').mockResolvedValue(null)
    const mockGenerate = jest.spyOn(userActions, 'generatePlexWrapped').mockResolvedValue({
      success: true,
    } as any)

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    await waitFor(() => {
      expect(screen.getByText('Generate My Wrapped')).toBeInTheDocument()
    })

    const generateButton = screen.getByText('Generate My Wrapped')
    await user.click(generateButton)

    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalledWith('user-1', expect.any(Number))
    })
  })

  it('should show error when generation fails', async () => {
    const user = userEvent.setup({ delay: null })
    jest.spyOn(userActions, 'getUserPlexWrapped').mockResolvedValue(null)
    jest.spyOn(userActions, 'generatePlexWrapped').mockResolvedValue({
      success: false,
      error: 'Failed to generate',
    } as any)

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    await waitFor(() => {
      expect(screen.getByText('Generate My Wrapped')).toBeInTheDocument()
    })

    const generateButton = screen.getByText('Generate My Wrapped')
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to generate')).toBeInTheDocument()
    })
  })

  it('should poll for wrapped completion when generating', async () => {
    jest.spyOn(userActions, 'getUserPlexWrapped')
      .mockResolvedValueOnce({
        id: 'wrapped-1',
        status: 'generating',
        year: 2024,
      } as any)
      .mockResolvedValueOnce({
        id: 'wrapped-1',
        status: 'completed',
        year: 2024,
      } as any)

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    await waitFor(() => {
      expect(screen.getByTestId('generating-animation')).toBeInTheDocument()
    })

    // Advance timer to trigger polling
    jest.advanceTimersByTime(2000)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/wrapped')
    })
  })

  it('should stop polling when wrapped fails', async () => {
    jest.spyOn(userActions, 'getUserPlexWrapped')
      .mockResolvedValueOnce({
        id: 'wrapped-1',
        status: 'generating',
        year: 2024,
      } as any)
      .mockResolvedValueOnce({
        id: 'wrapped-1',
        status: 'failed',
        error: 'Generation failed',
        year: 2024,
      } as any)

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    await waitFor(() => {
      expect(screen.getByTestId('generating-animation')).toBeInTheDocument()
    })

    jest.advanceTimersByTime(2000)

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('should handle error when loading wrapped', async () => {
    jest.spyOn(userActions, 'getUserPlexWrapped').mockRejectedValue(new Error('Load failed'))

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    await waitFor(() => {
      expect(screen.getByText('Load failed')).toBeInTheDocument()
    })
  })

  it('should handle error when generating wrapped', async () => {
    const user = userEvent.setup({ delay: null })
    jest.spyOn(userActions, 'getUserPlexWrapped').mockResolvedValue(null)
    jest.spyOn(userActions, 'generatePlexWrapped').mockRejectedValue(new Error('Generate failed'))

    render(<WrappedHomeButton userId="user-1" serverName="My Server" />)

    await waitFor(() => {
      expect(screen.getByText('Generate My Wrapped')).toBeInTheDocument()
    })

    const generateButton = screen.getByText('Generate My Wrapped')
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Generate failed')).toBeInTheDocument()
    })
  })

  it('should not load wrapped when userId is not provided', () => {
    const mockGetWrapped = jest.spyOn(userActions, 'getUserPlexWrapped')

    render(<WrappedHomeButton userId="" serverName="My Server" />)

    // Should not call getUserPlexWrapped with empty userId
    expect(mockGetWrapped).not.toHaveBeenCalled()
  })
})

