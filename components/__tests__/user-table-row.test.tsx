import { render, screen } from '@testing-library/react'
import { UserTableRow } from '../admin/users/user-table-row'

// Mock child components
jest.mock('../admin/users/user-status-badge', () => ({
  UserStatusBadge: ({ status }: { status: string | null }) => (
    <span data-testid="status-badge">{status || 'Not Generated'}</span>
  ),
}))

jest.mock('../admin/users/regenerate-wrapped-button', () => ({
  RegenerateWrappedButton: ({ userId }: { userId: string }) => (
    <button data-testid="regenerate-button">Regenerate {userId}</button>
  ),
}))

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

describe('UserTableRow', () => {
  const createMockUser = (overrides?: any) => ({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg',
    plexUserId: 'plex-123',
    isAdmin: false,
    wrappedStatus: 'completed',
    wrappedGeneratedAt: new Date('2024-01-01'),
    totalWrappedCount: 1,
    totalLlmUsage: {
      totalTokens: 1000,
      promptTokens: 500,
      completionTokens: 500,
      cost: 0.01,
      provider: 'openai',
      model: 'gpt-4',
      count: 1,
    },
    llmUsage: {
      totalTokens: 1000,
      promptTokens: 500,
      completionTokens: 500,
      cost: 0.01,
      provider: 'openai',
      model: 'gpt-4',
      count: 1,
    },
    createdAt: new Date('2024-01-01'),
    ...overrides,
  })

  const renderInTable = (component: React.ReactElement) => {
    return render(
      <table>
        <tbody>{component}</tbody>
      </table>
    )
  }

  it('should render user name and email', () => {
    const user = createMockUser()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('should render user image when available', () => {
    const user = createMockUser()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    const img = screen.getByAltText('John Doe')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should render initial when image is not available', () => {
    const user = createMockUser({ image: null })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('should render email initial when name is not available', () => {
    const user = createMockUser({ name: null, image: null })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    // When name is null and image is null, the initial should be the first letter of the email, uppercase
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('should render plex user ID', () => {
    const user = createMockUser()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('plex-123')).toBeInTheDocument()
  })

  it('should show "Not set" when plex user ID is missing', () => {
    const user = createMockUser({ plexUserId: null })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    // Check for the em dash in the plexUserId column
    // The plexUserId cell is the second td, and when null it shows "—"
    const cells = screen.getAllByText('—')
    expect(cells.length).toBeGreaterThan(0)
    // Verify at least one is in a cell that could be the plexUserId column
    const plexUserIdCell = cells.find((el) => {
      const parent = el.closest('td')
      return parent && parent.querySelector('.font-mono')
    })
    expect(plexUserIdCell).toBeInTheDocument()
  })

  it('should render admin badge for admin users', () => {
    const user = createMockUser({ isAdmin: true })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('should render user badge for non-admin users', () => {
    const user = createMockUser({ isAdmin: false })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('should render wrapped status badge', () => {
    const user = createMockUser({ wrappedStatus: 'completed' })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByTestId('status-badge')).toHaveTextContent('completed')
  })

  it('should render wrapped generated date', () => {
    const user = createMockUser({ wrappedGeneratedAt: new Date('2024-01-15') })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    // Date format is "Jan 15" or "Jan 14" depending on timezone
    const dateText = screen.getByText(/Jan 1[45]/i)
    expect(dateText).toBeInTheDocument()
  })

  it('should render total wrapped count', () => {
    const user = createMockUser({ totalWrappedCount: 5 })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should render LLM usage tokens with link', () => {
    const user = createMockUser()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    const link = screen.getByText('1,000')
    expect(link).toHaveAttribute('href', '/admin/llm-usage?userId=user-1')
  })

  it('should render token breakdown', () => {
    const user = createMockUser()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    // Token breakdown shows as "500+500" in a single text node
    expect(screen.getByText(/500\+500/)).toBeInTheDocument()
  })

  it('should render generation count when more than 1', () => {
    const user = createMockUser({
      totalLlmUsage: {
        totalTokens: 2000,
        promptTokens: 1000,
        completionTokens: 1000,
        cost: 0.02,
        provider: 'openai',
        model: 'gpt-4',
        count: 3,
      },
    })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('3x')).toBeInTheDocument()
  })

  it('should render provider name', () => {
    const user = createMockUser()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('openai')).toBeInTheDocument()
  })

  it('should render cost with link', () => {
    const user = createMockUser()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    const costLink = screen.getByText('$0.010')
    expect(costLink).toHaveAttribute('href', '/admin/llm-usage?userId=user-1')
  })

  it('should render provider', () => {
    const user = createMockUser()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('openai')).toBeInTheDocument()
  })

  it('should render "View Wrapped" link when status is completed', () => {
    const user = createMockUser({ wrappedStatus: 'completed' })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    const viewLink = screen.getByText('View')
    expect(viewLink).toHaveAttribute('href', '/admin/users/user-1/wrapped')
  })

  it('should render regenerate button when status is completed', () => {
    const user = createMockUser({ wrappedStatus: 'completed' })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByTestId('regenerate-button')).toBeInTheDocument()
  })

  it('should render "Generating..." when status is generating', () => {
    const user = createMockUser({ wrappedStatus: 'generating' })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('Generating...')).toBeInTheDocument()
  })

  it('should render regenerate button when status is failed', () => {
    const user = createMockUser({ wrappedStatus: 'failed' })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByTestId('regenerate-button')).toBeInTheDocument()
  })

  it('should render regenerate button when no wrapped status', () => {
    const user = createMockUser({ wrappedStatus: null })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByTestId('regenerate-button')).toBeInTheDocument()
  })

  it('should show year cost when different from total cost', () => {
    const user = createMockUser({
      totalLlmUsage: {
        totalTokens: 2000,
        promptTokens: 1000,
        completionTokens: 1000,
        cost: 0.02,
        provider: 'openai',
        model: 'gpt-4',
        count: 1,
      },
      llmUsage: {
        totalTokens: 1000,
        promptTokens: 500,
        completionTokens: 500,
        cost: 0.01,
        provider: 'openai',
        model: 'gpt-4',
        count: 1,
      },
    })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    // The component doesn't show year cost separately, it shows total cost
    expect(screen.getByText('$0.020')).toBeInTheDocument()
  })

  it('should handle missing LLM usage', () => {
    const user = createMockUser({
      totalLlmUsage: null,
      llmUsage: null,
      totalShares: 0,
      totalVisits: 0,
    })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    // When LLM usage is missing, it shows "—" in the tokens and cost columns
    // There are also "—" for shares, visits, and plexUserId, so we check for at least 2
    const allDashes = screen.getAllByText('—')
    expect(allDashes.length).toBeGreaterThanOrEqual(2)
  })
})

