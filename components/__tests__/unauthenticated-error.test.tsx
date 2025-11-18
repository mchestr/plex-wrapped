import { render, screen } from '@testing-library/react'
import { UnauthenticatedError } from '../admin/shared/unauthenticated-error'

describe('UnauthenticatedError', () => {
  it('should render only 401 text', () => {
    render(<UnauthenticatedError />)

    expect(screen.getByText('401')).toBeInTheDocument()
  })

  it('should have proper styling classes', () => {
    const { container } = render(<UnauthenticatedError />)

    const mainDiv = container.firstChild
    expect(mainDiv).toHaveClass('min-h-screen')
    expect(mainDiv).toHaveClass('bg-slate-900')
    expect(mainDiv).toHaveClass('flex')
    expect(mainDiv).toHaveClass('items-center')
    expect(mainDiv).toHaveClass('justify-center')
  })

  it('should center the 401 text', () => {
    const { container } = render(<UnauthenticatedError />)

    const textDiv = container.querySelector('.text-9xl')
    expect(textDiv).toBeInTheDocument()
    expect(textDiv).toHaveTextContent('401')
  })
})

