import { render, screen } from '@testing-library/react'
import { UserTableRow } from '@/components/admin/users/user-table-row'
import { makeAdminUserWithStats } from '../../__tests__/utils/test-builders'

// Mock UserActionsMenu
jest.mock('../admin/users/user-actions-menu', () => ({
  UserActionsMenu: ({ user }: { user: any }) => (
    <div data-testid="user-actions-menu">
      {user.wrappedStatus === 'generating' ? 'Generating...' : 'Actions'}
    </div>
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

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}))

describe('UserTableRow', () => {
  const renderInTable = (component: React.ReactElement) => {
    return render(
      <table>
        <tbody>{component}</tbody>
      </table>
    )
  }

  it('should render user name and email', () => {
    const user = makeAdminUserWithStats()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('should render user image when available', () => {
    const user = makeAdminUserWithStats()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    const img = screen.getByAltText('Test User')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should render initial when image is not available', () => {
    const user = makeAdminUserWithStats({ image: null })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('should render email initial when name is not available', () => {
    const user = makeAdminUserWithStats({ name: null, image: null })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('should render admin badge for admin users', () => {
    const user = makeAdminUserWithStats({ isAdmin: true })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('should render user badge for non-admin users', () => {
    const user = makeAdminUserWithStats({ isAdmin: false })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('should render provider name', () => {
    const user = makeAdminUserWithStats()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('openai')).toBeInTheDocument()
  })

  it('should render cost with link', () => {
    const user = makeAdminUserWithStats()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    const costLink = screen.getByText('$0.010')
    expect(costLink).toHaveAttribute('href', '/admin/llm-usage?userId=user-1')
  })

  it('should render actions menu', () => {
    const user = makeAdminUserWithStats()
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByTestId('user-actions-menu')).toBeInTheDocument()
  })

  it('should pass generating status to actions menu', () => {
    const user = makeAdminUserWithStats({ wrappedStatus: 'generating' })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    expect(screen.getByText('Generating...')).toBeInTheDocument()
  })

  it('should handle missing LLM usage', () => {
    const user = makeAdminUserWithStats({
      totalLlmUsage: null,
      llmUsage: null,
      totalShares: 0,
      totalVisits: 0,
    })
    renderInTable(<UserTableRow user={user} currentYear={2024} />)

    const allDashes = screen.getAllByText('—')
    expect(allDashes.length).toBeGreaterThanOrEqual(1) // At least one for LLM usage
  })
})
