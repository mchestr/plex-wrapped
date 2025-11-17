import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LLMToggle } from '../admin/llm-toggle'
import * as adminActions from '@/actions/admin'

// Mock the admin actions
jest.mock('@/actions/admin', () => ({
  setLLMDisabled: jest.fn(),
}))

// Mock window.alert
window.alert = jest.fn()

describe('LLMToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render toggle with initial disabled state', () => {
    render(<LLMToggle initialDisabled={true} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
    expect(screen.getByText('OFF')).toBeInTheDocument()
  })

  it('should render toggle with initial enabled state', () => {
    render(<LLMToggle initialDisabled={false} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
    expect(screen.getByText('ON')).toBeInTheDocument()
  })

  it('should call setLLMDisabled when toggled', async () => {
    const user = userEvent.setup()
    const mockSetLLMDisabled = jest.spyOn(adminActions, 'setLLMDisabled').mockResolvedValue({
      success: true,
      config: { id: 'config', llmDisabled: true, updatedAt: new Date(), updatedBy: null },
    })

    render(<LLMToggle initialDisabled={false} />)
    const checkbox = screen.getByRole('checkbox')

    await user.click(checkbox)

    await waitFor(() => {
      expect(mockSetLLMDisabled).toHaveBeenCalledWith(true)
    })
  })

  it('should update state when toggle succeeds', async () => {
    const user = userEvent.setup()
    jest.spyOn(adminActions, 'setLLMDisabled').mockResolvedValue({
      success: true,
      config: { id: 'config', llmDisabled: true, updatedAt: new Date(), updatedBy: null },
    })

    render(<LLMToggle initialDisabled={false} />)
    const checkbox = screen.getByRole('checkbox')

    await user.click(checkbox)

    await waitFor(() => {
      expect(checkbox).toBeChecked()
      expect(screen.getByText('OFF')).toBeInTheDocument()
    })
  })

  it('should show error alert when toggle fails', async () => {
    const user = userEvent.setup()
    jest.spyOn(adminActions, 'setLLMDisabled').mockResolvedValue({
      success: false,
      error: 'Failed to update',
    })

    render(<LLMToggle initialDisabled={false} />)
    const checkbox = screen.getByRole('checkbox')

    await user.click(checkbox)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to update')
    })
  })

  it('should show generic error alert when error is not provided', async () => {
    const user = userEvent.setup()
    jest.spyOn(adminActions, 'setLLMDisabled').mockResolvedValue({
      success: false,
    } as any)

    render(<LLMToggle initialDisabled={false} />)
    const checkbox = screen.getByRole('checkbox')

    await user.click(checkbox)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to update setting')
    })
  })

  it('should show error alert when exception occurs', async () => {
    const user = userEvent.setup()
    jest.spyOn(adminActions, 'setLLMDisabled').mockRejectedValue(new Error('Network error'))

    render(<LLMToggle initialDisabled={false} />)
    const checkbox = screen.getByRole('checkbox')

    await user.click(checkbox)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to update setting')
    })
  })

  it('should disable checkbox while saving', async () => {
    const user = userEvent.setup()
    let resolveSetLLMDisabled: (value: any) => void
    const setLLMPromise = new Promise<any>((resolve) => {
      resolveSetLLMDisabled = resolve
    })
    jest.spyOn(adminActions, 'setLLMDisabled').mockReturnValue(setLLMPromise)

    render(<LLMToggle initialDisabled={false} />)
    const checkbox = screen.getByRole('checkbox')

    await user.click(checkbox)

    await waitFor(() => {
      expect(checkbox).toBeDisabled()
    })

    resolveSetLLMDisabled!({ success: true, config: { id: 'config', llmDisabled: true, updatedAt: new Date(), updatedBy: null } })
  })

  it('should show loading spinner while saving', async () => {
    const user = userEvent.setup()
    let resolveSetLLMDisabled: (value: any) => void
    const setLLMPromise = new Promise<any>((resolve) => {
      resolveSetLLMDisabled = resolve
    })
    jest.spyOn(adminActions, 'setLLMDisabled').mockReturnValue(setLLMPromise)

    render(<LLMToggle initialDisabled={false} />)
    const checkbox = screen.getByRole('checkbox')

    await user.click(checkbox)

    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    resolveSetLLMDisabled!({ success: true, config: { id: 'config', llmDisabled: true, updatedAt: new Date(), updatedBy: null } })
  })

  it('should apply correct styling for OFF state', () => {
    render(<LLMToggle initialDisabled={true} />)
    const statusText = screen.getByText('OFF')
    expect(statusText).toHaveClass('text-red-400')
  })

  it('should apply correct styling for ON state', () => {
    render(<LLMToggle initialDisabled={false} />)
    const statusText = screen.getByText('ON')
    expect(statusText).toHaveClass('text-green-400')
  })
})

