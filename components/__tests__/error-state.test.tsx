import { ErrorState } from '@/components/ui/error-state'
import { fireEvent, render, screen } from '@testing-library/react'

describe('ErrorState', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render with default title and message', () => {
      render(<ErrorState />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('An unexpected error occurred. Please try again later.')).toBeInTheDocument()
    })

    it('should render with custom title', () => {
      render(<ErrorState title="Custom Error Title" />)

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument()
    })

    it('should render with custom message', () => {
      render(<ErrorState message="Custom error message" />)

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })

    it('should render error icon', () => {
      const { container } = render(<ErrorState />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('text-red-500')
    })

    it('should apply custom className', () => {
      const { container } = render(<ErrorState className="custom-class" />)

      const errorContainer = container.querySelector('.custom-class')
      expect(errorContainer).toBeInTheDocument()
    })
  })

  describe('Error Prop Handling', () => {
    it('should display error message from error prop', () => {
      const error = new Error('Test error message')
      render(<ErrorState error={error} />)

      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should log error to console when error prop is provided', () => {
      const error = new Error('Test error')
      const consoleSpy = jest.spyOn(console, 'error')

      render(<ErrorState error={error} />)

      expect(consoleSpy).toHaveBeenCalledWith('Route Error:', error)
    })

    it('should display error digest when available', () => {
      const error = new Error('Test error') as Error & { digest?: string }
      error.digest = 'abc123'

      render(<ErrorState error={error} />)

      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    it('should prioritize custom message over error message', () => {
      const error = new Error('Error message')
      render(<ErrorState error={error} message="Custom message" />)

      expect(screen.getByText('Custom message')).toBeInTheDocument()
      expect(screen.queryByText('Error message')).not.toBeInTheDocument()
    })

    it('should not log to console when error prop is undefined', () => {
      const consoleSpy = jest.spyOn(console, 'error')

      render(<ErrorState />)

      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('Reset Button', () => {
    it('should render reset button when reset function is provided', () => {
      const reset = jest.fn()
      render(<ErrorState reset={reset} />)

      expect(screen.getByText('Try again')).toBeInTheDocument()
    })

    it('should not render reset button when reset function is not provided', () => {
      render(<ErrorState />)

      expect(screen.queryByText('Try again')).not.toBeInTheDocument()
    })

    it('should call reset function when button is clicked', () => {
      const reset = jest.fn()
      render(<ErrorState reset={reset} />)

      const button = screen.getByText('Try again')
      fireEvent.click(button)

      expect(reset).toHaveBeenCalledTimes(1)
    })

    it('should have proper button styling', () => {
      const reset = jest.fn()
      render(<ErrorState reset={reset} />)

      const button = screen.getByText('Try again')
      expect(button).toHaveClass('bg-amber-500')
      expect(button).toHaveClass('hover:bg-amber-600')
      expect(button).toHaveClass('rounded-full')
    })
  })

  describe('Layout and Styling', () => {
    it('should have centered layout', () => {
      const { container } = render(<ErrorState />)

      const errorContainer = container.querySelector('.flex.flex-col.items-center.justify-center')
      expect(errorContainer).toBeInTheDocument()
    })

    it('should have minimum height', () => {
      const { container } = render(<ErrorState />)

      const errorContainer = container.querySelector('.min-h-\\[50vh\\]')
      expect(errorContainer).toBeInTheDocument()
    })

    it('should have proper text styling', () => {
      render(<ErrorState />)

      const title = screen.getByText('Something went wrong')
      expect(title).toHaveClass('text-white')
      expect(title).toHaveClass('font-bold')
    })

    it('should have icon background with proper styling', () => {
      const { container } = render(<ErrorState />)

      const iconBackground = container.querySelector('.bg-red-500\\/10')
      expect(iconBackground).toBeInTheDocument()
      expect(iconBackground).toHaveClass('rounded-full')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty error message', () => {
      const error = new Error('')
      render(<ErrorState error={error} />)

      // Should fall back to default message
      expect(screen.getByText('An unexpected error occurred. Please try again later.')).toBeInTheDocument()
    })

    it('should handle error without message property', () => {
      const error = {} as Error
      render(<ErrorState error={error} />)

      // Should fall back to default message
      expect(screen.getByText('An unexpected error occurred. Please try again later.')).toBeInTheDocument()
    })

    it('should handle empty custom message', () => {
      render(<ErrorState message="" />)

      // Should fall back to default message
      expect(screen.getByText('An unexpected error occurred. Please try again later.')).toBeInTheDocument()
    })

    it('should handle empty custom title', () => {
      render(<ErrorState title="" />)

      // Should render empty title
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('should handle multiple renders with different errors', () => {
      const { rerender } = render(<ErrorState error={new Error('First error')} />)
      expect(screen.getByText('First error')).toBeInTheDocument()

      rerender(<ErrorState error={new Error('Second error')} />)
      expect(screen.getByText('Second error')).toBeInTheDocument()
      expect(screen.queryByText('First error')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper text contrast', () => {
      render(<ErrorState />)

      const title = screen.getByText('Something went wrong')
      expect(title).toHaveClass('text-white')

      const message = screen.getByText('An unexpected error occurred. Please try again later.')
      expect(message).toHaveClass('text-slate-400')
    })

    it('should have clickable button with proper styling', () => {
      const reset = jest.fn()
      render(<ErrorState reset={reset} />)

      const button = screen.getByText('Try again')
      expect(button.tagName).toBe('BUTTON')
      expect(button).toHaveClass('font-bold')
    })

    it('should render SVG with proper attributes', () => {
      const { container } = render(<ErrorState />)

      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
      expect(svg).toHaveAttribute('fill', 'none')
      expect(svg).toHaveAttribute('stroke', 'currentColor')
    })
  })

  describe('Integration', () => {
    it('should work with all props combined', () => {
      const error = new Error('Integration error')
      const reset = jest.fn()

      render(
        <ErrorState
          error={error}
          reset={reset}
          title="Integration Test"
          message="Integration message"
          className="integration-class"
        />
      )

      expect(screen.getByText('Integration Test')).toBeInTheDocument()
      expect(screen.getByText('Integration message')).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()

      const button = screen.getByText('Try again')
      fireEvent.click(button)
      expect(reset).toHaveBeenCalled()
    })

    it('should handle rapid reset button clicks', () => {
      const reset = jest.fn()
      render(<ErrorState reset={reset} />)

      const button = screen.getByText('Try again')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(reset).toHaveBeenCalledTimes(3)
    })
  })
})

