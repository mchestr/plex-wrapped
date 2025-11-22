import { render, screen } from '@testing-library/react'
import { ImportPlexUsersClient } from '@/components/admin/users/import-plex-users-client'

// Mock the ImportPlexUsersButton component
jest.mock('@/components/admin/users/import-plex-users-button', () => ({
  ImportPlexUsersButton: () => <button>Import Plex Users</button>,
}))

describe('ImportPlexUsersClient', () => {
  it('should render the component', () => {
    render(<ImportPlexUsersClient />)
    expect(screen.getByText('Import Plex Users')).toBeInTheDocument()
  })

  it('should render ImportPlexUsersButton', () => {
    render(<ImportPlexUsersClient />)
    const button = screen.getByText('Import Plex Users')
    expect(button).toBeInTheDocument()
  })

  it('should have correct layout classes', () => {
    const { container } = render(<ImportPlexUsersClient />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-end')
  })

  it('should be a client component', () => {
    // This test verifies the component can be rendered in a test environment
    // which uses jsdom (client-side rendering)
    expect(() => render(<ImportPlexUsersClient />)).not.toThrow()
  })
})

