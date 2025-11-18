import { render, screen } from '@testing-library/react'
import { UsersStatsSummary } from '../admin/users/users-stats-summary'

describe('UsersStatsSummary', () => {
  it('should render total users count', () => {
    const users = [
      { wrappedStatus: 'completed', totalLlmUsage: null },
      { wrappedStatus: 'generating', totalLlmUsage: null },
    ]
    render(<UsersStatsSummary users={users} />)

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should count completed wrapped users', () => {
    const users = [
      { wrappedStatus: 'completed', totalLlmUsage: null },
      { wrappedStatus: 'completed', totalLlmUsage: null },
      { wrappedStatus: 'generating', totalLlmUsage: null },
    ]
    render(<UsersStatsSummary users={users} />)

    expect(screen.getByText('Completed Wrapped')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should count generating users', () => {
    const users = [
      { wrappedStatus: 'generating', totalLlmUsage: null },
      { wrappedStatus: 'generating', totalLlmUsage: null },
      { wrappedStatus: 'completed', totalLlmUsage: null },
    ]
    render(<UsersStatsSummary users={users} />)

    expect(screen.getByText('Generating')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should count not generated users', () => {
    const users = [
      { wrappedStatus: null, totalLlmUsage: null },
      { wrappedStatus: null, totalLlmUsage: null },
      { wrappedStatus: 'completed', totalLlmUsage: null },
    ]
    render(<UsersStatsSummary users={users} />)

    expect(screen.getByText('Not Generated')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should calculate total tokens', () => {
    const users = [
      {
        wrappedStatus: 'completed',
        totalLlmUsage: {
          totalTokens: 1000,
          cost: 0.01,
        },
      },
      {
        wrappedStatus: 'completed',
        totalLlmUsage: {
          totalTokens: 2000,
          cost: 0.02,
        },
      },
    ]
    render(<UsersStatsSummary users={users} />)

    expect(screen.getByText('Total Tokens')).toBeInTheDocument()
    expect(screen.getByText('3,000')).toBeInTheDocument()
  })

  it('should calculate total cost', () => {
    const users = [
      {
        wrappedStatus: 'completed',
        totalLlmUsage: {
          totalTokens: 1000,
          cost: 0.015,
        },
      },
      {
        wrappedStatus: 'completed',
        totalLlmUsage: {
          totalTokens: 2000,
          cost: 0.025,
        },
      },
    ]
    render(<UsersStatsSummary users={users} />)

    expect(screen.getByText('Total Cost')).toBeInTheDocument()
    expect(screen.getByText('$0.0400')).toBeInTheDocument()
  })

  it('should handle users without LLM usage', () => {
    const users = [
      { wrappedStatus: 'completed', totalLlmUsage: null },
      { wrappedStatus: 'generating', totalLlmUsage: null },
    ]
    render(<UsersStatsSummary users={users} />)

    expect(screen.getByText('Total Tokens')).toBeInTheDocument()
    const tokenValue = screen.getByText('Total Tokens').parentElement?.querySelector('.text-2xl')
    expect(tokenValue).toHaveTextContent('0')
    expect(screen.getByText('Total Cost')).toBeInTheDocument()
    expect(screen.getByText('$0.0000')).toBeInTheDocument()
  })

  it('should handle empty users array', () => {
    render(<UsersStatsSummary users={[]} />)

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThan(0)
  })

  it('should format large token numbers with commas', () => {
    const users = [
      {
        wrappedStatus: 'completed',
        totalLlmUsage: {
          totalTokens: 1234567,
          cost: 1.23,
        },
      },
    ]
    render(<UsersStatsSummary users={users} />)

    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })

  it('should show helper text for tokens and cost', () => {
    const users = [
      {
        wrappedStatus: 'completed',
        totalLlmUsage: {
          totalTokens: 1000,
          cost: 0.01,
        },
      },
    ]
    render(<UsersStatsSummary users={users} />)

    const helperTexts = screen.getAllByText('Across all years & regenerations')
    expect(helperTexts.length).toBe(2)
  })
})

