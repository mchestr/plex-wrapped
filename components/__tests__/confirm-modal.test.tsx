import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal } from '@/components/admin/shared/confirm-modal'

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Test Title',
    message: 'Test Message',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock document.body.style.overflow
    Object.defineProperty(document.body, 'style', {
      value: {
        overflow: '',
      },
      writable: true,
    })
  })

  it('should not render when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
  })

  it('should render modal content when isOpen is true', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Message')).toBeInTheDocument()
  })

  it('should render default button texts', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should render custom button texts', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    )
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Keep')).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = jest.fn()
    const onClose = jest.fn()

    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />)

    const confirmButton = screen.getByText('Confirm')
    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    render(<ConfirmModal {...defaultProps} onClose={onClose} />)

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    render(<ConfirmModal {...defaultProps} onClose={onClose} />)

    const backdrop = document.querySelector('.fixed.inset-0')
    await user.click(backdrop!)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    render(<ConfirmModal {...defaultProps} onClose={onClose} />)

    const modalContent = screen.getByText('Test Message')
    await user.click(modalContent)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('should call onClose when ESC key is pressed', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    render(<ConfirmModal {...defaultProps} onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should prevent body scroll when modal is open', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should restore body scroll when modal is closed', () => {
    const { rerender } = render(<ConfirmModal {...defaultProps} />)
    expect(document.body.style.overflow).toBe('hidden')

    rerender(<ConfirmModal {...defaultProps} isOpen={false} />)
    expect(document.body.style.overflow).toBe('')
  })

  it('should apply custom confirm button class', () => {
    render(<ConfirmModal {...defaultProps} confirmButtonClass="bg-red-600 hover:bg-red-700" />)
    const confirmButton = screen.getByText('Confirm')
    expect(confirmButton).toHaveClass('bg-red-600', 'hover:bg-red-700')
  })

  it('should handle long messages with scrolling', () => {
    const longMessage = 'A'.repeat(1000)
    render(<ConfirmModal {...defaultProps} message={longMessage} />)
    const messageContainer = screen.getByText(longMessage).closest('.max-h-\\[60vh\\]')
    expect(messageContainer).toHaveClass('overflow-y-auto')
  })
})

