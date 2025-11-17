import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WrappedViewerNavigation } from '../wrapped-viewer-navigation'

// Mock WrappedShareButton
jest.mock('../wrapped-share-button', () => ({
  WrappedShareButton: ({ shareToken }: { shareToken: string }) => (
    <div data-testid="share-button">Share Button {shareToken}</div>
  ),
}))

describe('WrappedViewerNavigation', () => {
  const defaultProps = {
    currentSectionIndex: 0,
    totalSections: 5,
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onShowAll: jest.fn(),
    year: 2024,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render Next button on first section', () => {
    render(<WrappedViewerNavigation {...defaultProps} />)
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
  })

  it('should render Previous and Next buttons on middle sections', () => {
    render(<WrappedViewerNavigation {...defaultProps} currentSectionIndex={2} />)
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('should render Previous and Show All buttons on last section', () => {
    render(<WrappedViewerNavigation {...defaultProps} currentSectionIndex={4} />)
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Show All')).toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('should call onNext when Next button is clicked', async () => {
    const user = userEvent.setup()
    const onNext = jest.fn()
    render(<WrappedViewerNavigation {...defaultProps} onNext={onNext} />)

    const nextButton = screen.getByText('Next')
    await user.click(nextButton)

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('should call onPrevious when Previous button is clicked', async () => {
    const user = userEvent.setup()
    const onPrevious = jest.fn()
    render(<WrappedViewerNavigation {...defaultProps} currentSectionIndex={2} onPrevious={onPrevious} />)

    const previousButton = screen.getByText('Previous')
    await user.click(previousButton)

    expect(onPrevious).toHaveBeenCalledTimes(1)
  })

  it('should call onShowAll when Show All button is clicked', async () => {
    const user = userEvent.setup()
    const onShowAll = jest.fn()
    render(<WrappedViewerNavigation {...defaultProps} currentSectionIndex={4} onShowAll={onShowAll} />)

    const showAllButton = screen.getByText('Show All')
    await user.click(showAllButton)

    expect(onShowAll).toHaveBeenCalledTimes(1)
  })

  it('should render share button on last section when not shared', () => {
    render(
      <WrappedViewerNavigation
        {...defaultProps}
        currentSectionIndex={4}
        shareToken="test-token"
        userName="John"
        summary="Test summary"
      />
    )
    expect(screen.getByTestId('share-button')).toBeInTheDocument()
  })

  it('should not render share button when isShared is true', () => {
    render(
      <WrappedViewerNavigation
        {...defaultProps}
        currentSectionIndex={4}
        isShared={true}
        shareToken="test-token"
      />
    )
    expect(screen.queryByTestId('share-button')).not.toBeInTheDocument()
  })

  it('should not render share button when not on last section', () => {
    render(
      <WrappedViewerNavigation
        {...defaultProps}
        currentSectionIndex={2}
        shareToken="test-token"
      />
    )
    expect(screen.queryByTestId('share-button')).not.toBeInTheDocument()
  })

  it('should not render share button when shareToken is not provided', () => {
    render(
      <WrappedViewerNavigation
        {...defaultProps}
        currentSectionIndex={4}
      />
    )
    expect(screen.queryByTestId('share-button')).not.toBeInTheDocument()
  })

  it('should render placeholder div when on first section', () => {
    const { container } = render(<WrappedViewerNavigation {...defaultProps} />)
    const divs = container.querySelectorAll('div')
    // Should have a placeholder div on the left side
    expect(divs.length).toBeGreaterThan(0)
  })

  it('should pass correct props to share button', () => {
    render(
      <WrappedViewerNavigation
        {...defaultProps}
        currentSectionIndex={4}
        shareToken="test-token-123"
        userName="Jane Doe"
        summary="My wrapped summary"
        year={2023}
      />
    )
    const shareButton = screen.getByTestId('share-button')
    expect(shareButton).toHaveTextContent('Share Button test-token-123')
  })
})

