import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberInput } from '../NumberInput'
import type { Condition } from '@/lib/validations/maintenance'

describe('NumberInput', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('Basic Rendering', () => {
    it('should render number input with placeholder', () => {
      const condition: Condition = {
        field: 'playCount',
        operator: 'greaterThan',
        value: null,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should display correct placeholder for bytes unit', () => {
      const condition: Condition = {
        field: 'fileSize',
        operator: 'greaterThan',
        value: null,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} unit="bytes" />)

      expect(screen.getByPlaceholderText('Size in GB (e.g., 10)')).toBeInTheDocument()
    })

    it('should display correct placeholder for minutes unit', () => {
      const condition: Condition = {
        field: 'duration',
        operator: 'greaterThan',
        value: null,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} unit="minutes" />)

      expect(screen.getByPlaceholderText('Duration in minutes')).toBeInTheDocument()
    })

    it('should display correct placeholder for kbps unit', () => {
      const condition: Condition = {
        field: 'bitrate',
        operator: 'greaterThan',
        value: null,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} unit="kbps" />)

      expect(screen.getByPlaceholderText('Bitrate in Mbps')).toBeInTheDocument()
    })
  })

  describe('Min/Max Validation', () => {
    it('should add min attribute when min prop is provided', () => {
      const condition: Condition = {
        field: 'playCount',
        operator: 'greaterThan',
        value: 5,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} min={0} />)

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveAttribute('min', '0')
    })

    it('should add max attribute when max prop is provided', () => {
      const condition: Condition = {
        field: 'rating',
        operator: 'lessThan',
        value: 8,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} max={10} />)

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveAttribute('max', '10')
    })

    it('should add both min and max attributes when both props are provided', () => {
      const condition: Condition = {
        field: 'rating',
        operator: 'equals',
        value: 7,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} min={0} max={10} />)

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '10')
    })

    it('should not add min/max attributes when props are not provided', () => {
      const condition: Condition = {
        field: 'year',
        operator: 'equals',
        value: 2020,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).not.toHaveAttribute('min')
      expect(input).not.toHaveAttribute('max')
    })
  })

  describe('Value Handling', () => {
    it('should display current value', () => {
      const condition: Condition = {
        field: 'playCount',
        operator: 'equals',
        value: 42,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveValue(42)
    })

    it('should handle null value', () => {
      const condition: Condition = {
        field: 'playCount',
        operator: 'equals',
        value: null,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveValue(null)
    })

    it('should call onChange when value changes', async () => {
      const user = userEvent.setup()
      const condition: Condition = {
        field: 'playCount',
        operator: 'greaterThan',
        value: null,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter number')
      await user.type(input, '7')

      expect(mockOnChange).toHaveBeenCalled()
      // Find the call with value 7
      const matchingCall = mockOnChange.mock.calls.find(call => call[0].value === 7)
      expect(matchingCall).toBeDefined()
      expect(matchingCall[0].value).toBe(7)
    })

    it('should call onChange with null for invalid input', async () => {
      const user = userEvent.setup()
      const condition: Condition = {
        field: 'playCount',
        operator: 'greaterThan',
        value: 10,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} />)

      const input = screen.getByDisplayValue('10')
      await user.clear(input)

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: null,
        })
      )
    })
  })

  describe('Unit Conversion', () => {
    it('should convert bytes to GB for display', () => {
      const oneGB = 1024 * 1024 * 1024
      const condition: Condition = {
        field: 'fileSize',
        operator: 'greaterThan',
        value: oneGB * 5, // 5 GB
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} unit="bytes" />)

      const input = screen.getByPlaceholderText('Size in GB (e.g., 10)')
      expect(input).toHaveValue(5)
      expect(screen.getByText('GB')).toBeInTheDocument()
    })

    it('should convert GB input to bytes for storage', async () => {
      const user = userEvent.setup()
      const condition: Condition = {
        field: 'fileSize',
        operator: 'greaterThan',
        value: null,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} unit="bytes" />)

      const input = screen.getByPlaceholderText('Size in GB (e.g., 10)')
      await user.type(input, '2')

      expect(mockOnChange).toHaveBeenCalled()
      // Find the call where value is 2 GB converted to bytes
      const expectedBytes = 2 * 1024 * 1024 * 1024
      const matchingCall = mockOnChange.mock.calls.find(call => call[0].value === expectedBytes)
      expect(matchingCall).toBeDefined()
    })

    it('should convert kbps to Mbps for display', () => {
      const condition: Condition = {
        field: 'bitrate',
        operator: 'greaterThan',
        value: 5000, // 5000 kbps = 5 Mbps
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} unit="kbps" />)

      const input = screen.getByPlaceholderText('Bitrate in Mbps')
      expect(input).toHaveValue(5)
      expect(screen.getByText('Mbps')).toBeInTheDocument()
    })

    it('should convert Mbps input to kbps for storage', async () => {
      const user = userEvent.setup()
      const condition: Condition = {
        field: 'bitrate',
        operator: 'greaterThan',
        value: null,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} unit="kbps" />)

      const input = screen.getByPlaceholderText('Bitrate in Mbps')
      await user.type(input, '5')

      expect(mockOnChange).toHaveBeenCalled()
      // Find the call where value is 5 Mbps converted to kbps
      const expectedKbps = 5000
      const matchingCall = mockOnChange.mock.calls.find(call => call[0].value === expectedKbps)
      expect(matchingCall).toBeDefined()
    })

    it('should display unit label for minutes', () => {
      const condition: Condition = {
        field: 'duration',
        operator: 'greaterThan',
        value: 90,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} unit="minutes" />)

      expect(screen.getByText('min')).toBeInTheDocument()
    })

    it('should not display unit label when no unit is provided', () => {
      const condition: Condition = {
        field: 'playCount',
        operator: 'greaterThan',
        value: 10,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} />)

      expect(screen.queryByText('GB')).not.toBeInTheDocument()
      expect(screen.queryByText('Mbps')).not.toBeInTheDocument()
      expect(screen.queryByText('min')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero value', () => {
      const condition: Condition = {
        field: 'playCount',
        operator: 'equals',
        value: 0,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter number')
      // Zero value is treated as falsy and displays as empty string
      expect(input).toHaveValue(null)
    })

    it('should handle decimal values', () => {
      const condition: Condition = {
        field: 'rating',
        operator: 'greaterThan',
        value: 7.5,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} />)

      // Verify the decimal value is displayed
      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveValue(7.5)
    })

    it('should preserve condition field and operator when changing value', async () => {
      const user = userEvent.setup()
      const condition: Condition = {
        field: 'playCount',
        operator: 'greaterThan',
        value: null,
      }

      render(<NumberInput condition={condition} onChange={mockOnChange} />)

      const input = screen.getByPlaceholderText('Enter number')
      await user.type(input, '5')

      expect(mockOnChange).toHaveBeenCalled()
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0]
      expect(lastCall).toMatchObject({
        field: 'playCount',
        operator: 'greaterThan',
        value: 5,
      })
    })
  })
})
