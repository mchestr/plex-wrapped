import { render, screen } from '@testing-library/react'
import { UnauthorizedError } from '../admin/shared/unauthorized-error'

describe('UnauthorizedError', () => {
  it('should render access denied message', () => {
    render(<UnauthorizedError />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText(/You don't have permission to access this admin page/)).toBeInTheDocument()
  })

  it('should render navigation links', () => {
    render(<UnauthorizedError />)

    const homeLink = screen.getByText('Go to Home')
    const wrappedLink = screen.getByText('View Your Wrapped')

    expect(homeLink).toBeInTheDocument()
    expect(wrappedLink).toBeInTheDocument()

    expect(homeLink.closest('a')).toHaveAttribute('href', '/')
    expect(wrappedLink.closest('a')).toHaveAttribute('href', '/wrapped')
  })

  it('should have proper styling classes', () => {
    const { container } = render(<UnauthorizedError />)

    const mainDiv = container.firstChild
    expect(mainDiv).toHaveClass('min-h-screen')
    expect(mainDiv).toHaveClass('bg-gradient-to-b')
  })

  it('should display warning icon', () => {
    const { container } = render(<UnauthorizedError />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })

  it('should have accessible structure', () => {
    render(<UnauthorizedError />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Access Denied')
  })
})

