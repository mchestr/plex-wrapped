import { render, screen } from '@testing-library/react'
import { UserStatusBadge } from '../admin/users/user-status-badge'

describe('UserStatusBadge', () => {
  it('should render "Not Generated" when status is null', () => {
    render(<UserStatusBadge status={null} />)
    expect(screen.getByText('Not Generated')).toBeInTheDocument()
  })

  it('should render "Not Generated" when status is undefined', () => {
    render(<UserStatusBadge status={undefined as any} />)
    expect(screen.getByText('Not Generated')).toBeInTheDocument()
  })

  it('should render "Completed" badge with green styling', () => {
    render(<UserStatusBadge status="completed" />)
    const badge = screen.getByText('Completed')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-500/20', 'text-green-400')
  })

  it('should render "Generating" badge with yellow styling', () => {
    render(<UserStatusBadge status="generating" />)
    const badge = screen.getByText('Generating')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-yellow-500/20', 'text-yellow-400')
  })

  it('should render "Failed" badge with red styling', () => {
    render(<UserStatusBadge status="failed" />)
    const badge = screen.getByText('Failed')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-500/20', 'text-red-400')
  })

  it('should render "Pending" badge with blue styling', () => {
    render(<UserStatusBadge status="pending" />)
    const badge = screen.getByText('Pending')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-500/20', 'text-blue-400')
  })

  it('should render "Unknown" badge for unrecognized status', () => {
    render(<UserStatusBadge status="unknown-status" />)
    const badge = screen.getByText('Unknown')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-slate-700/50', 'text-slate-300')
  })

  it('should render "Not Generated" badge for empty string status', () => {
    render(<UserStatusBadge status="" />)
    // Empty string is falsy, so it should show "Not Generated"
    const badge = screen.getByText('Not Generated')
    expect(badge).toBeInTheDocument()
  })
})

