import { RenderedPrompt } from "@/components/admin/playground/rendered-prompt"
import { fireEvent, render, screen } from "@testing-library/react"

describe("RenderedPrompt", () => {
  const mockProps = {
    renderedPrompt: "This is a test rendered prompt with {{placeholders}} replaced",
    isExpanded: false,
    onToggle: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Basic Rendering", () => {
    it("should render the component", () => {
      render(<RenderedPrompt {...mockProps} />)

      expect(screen.getByText("Rendered Prompt")).toBeInTheDocument()
      expect(
        screen.getByText("The prompt with all placeholders replaced with actual data")
      ).toBeInTheDocument()
    })

    it("should render toggle button", () => {
      render(<RenderedPrompt {...mockProps} />)

      const toggleButton = screen.getByRole("button")
      expect(toggleButton).toBeInTheDocument()
    })

    it("should render icon", () => {
      const { container } = render(<RenderedPrompt {...mockProps} />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass("text-cyan-400")
    })
  })

  describe("Expand/Collapse Behavior", () => {
    it("should not show prompt content when collapsed", () => {
      render(<RenderedPrompt {...mockProps} isExpanded={false} />)

      expect(screen.queryByText(mockProps.renderedPrompt)).not.toBeInTheDocument()
    })

    it("should show prompt content when expanded", () => {
      render(<RenderedPrompt {...mockProps} isExpanded={true} />)

      expect(screen.getByText(mockProps.renderedPrompt)).toBeInTheDocument()
    })

    it("should call onToggle when button is clicked", () => {
      render(<RenderedPrompt {...mockProps} />)

      const toggleButton = screen.getByRole("button")
      fireEvent.click(toggleButton)

      expect(mockProps.onToggle).toHaveBeenCalledTimes(1)
    })

    it("should call onToggle multiple times", () => {
      render(<RenderedPrompt {...mockProps} />)

      const toggleButton = screen.getByRole("button")
      fireEvent.click(toggleButton)
      fireEvent.click(toggleButton)
      fireEvent.click(toggleButton)

      expect(mockProps.onToggle).toHaveBeenCalledTimes(3)
    })
  })

  describe("Chevron Icon", () => {
    it("should rotate chevron when expanded", () => {
      const { container } = render(<RenderedPrompt {...mockProps} isExpanded={true} />)

      const chevron = container.querySelectorAll("svg")[1] // Second SVG is the chevron
      expect(chevron).toHaveClass("rotate-180")
    })

    it("should not rotate chevron when collapsed", () => {
      const { container } = render(<RenderedPrompt {...mockProps} isExpanded={false} />)

      const chevron = container.querySelectorAll("svg")[1]
      expect(chevron).not.toHaveClass("rotate-180")
    })

    it("should have transition class on chevron", () => {
      const { container } = render(<RenderedPrompt {...mockProps} />)

      const chevron = container.querySelectorAll("svg")[1]
      expect(chevron).toHaveClass("transition-transform")
    })
  })

  describe("Content Display", () => {
    it("should display prompt in pre element", () => {
      const { container } = render(<RenderedPrompt {...mockProps} isExpanded={true} />)

      const preElement = container.querySelector("pre")
      expect(preElement).toBeInTheDocument()
      expect(preElement).toHaveTextContent(mockProps.renderedPrompt)
    })

    it("should preserve whitespace in prompt", () => {
      const promptWithWhitespace = "Line 1\n\nLine 2\n  Indented"
      const { container } = render(
        <RenderedPrompt
          {...mockProps}
          renderedPrompt={promptWithWhitespace}
          isExpanded={true}
        />
      )

      const preElement = container.querySelector("pre")
      expect(preElement).toHaveClass("whitespace-pre-wrap")
    })

    it("should handle very long prompts", () => {
      const longPrompt = "A".repeat(10000)
      render(<RenderedPrompt {...mockProps} renderedPrompt={longPrompt} isExpanded={true} />)

      expect(screen.getByText(longPrompt)).toBeInTheDocument()
    })

    it("should handle empty prompt", () => {
      render(<RenderedPrompt {...mockProps} renderedPrompt="" isExpanded={true} />)

      const { container } = render(
        <RenderedPrompt {...mockProps} renderedPrompt="" isExpanded={true} />
      )
      const preElement = container.querySelector("pre")
      expect(preElement).toHaveTextContent("")
    })
  })

  describe("Styling", () => {
    it("should have proper container styling", () => {
      const { container } = render(<RenderedPrompt {...mockProps} />)

      const mainDiv = container.querySelector(".bg-slate-800\\/50")
      expect(mainDiv).toBeInTheDocument()
      expect(mainDiv).toHaveClass("backdrop-blur-sm", "border", "border-slate-700/50")
    })

    it("should have scrollable content area", () => {
      const { container } = render(<RenderedPrompt {...mockProps} isExpanded={true} />)

      const scrollableDiv = container.querySelector(".max-h-96")
      expect(scrollableDiv).toBeInTheDocument()
      expect(scrollableDiv).toHaveClass("overflow-y-auto")
    })

    it("should style pre element with monospace font", () => {
      const { container } = render(<RenderedPrompt {...mockProps} isExpanded={true} />)

      const preElement = container.querySelector("pre")
      expect(preElement).toHaveClass("font-mono")
    })

    it("should have hover effect on toggle button", () => {
      render(<RenderedPrompt {...mockProps} />)

      const toggleButton = screen.getByRole("button")
      expect(toggleButton).toHaveClass("hover:text-slate-200", "transition-colors")
    })
  })

  describe("Accessibility", () => {
    it("should have button type", () => {
      render(<RenderedPrompt {...mockProps} />)

      const toggleButton = screen.getByRole("button")
      expect(toggleButton).toHaveAttribute("type", "button")
    })

    it("should be keyboard accessible", () => {
      render(<RenderedPrompt {...mockProps} />)

      const toggleButton = screen.getByRole("button")
      toggleButton.focus()
      expect(toggleButton).toHaveFocus()
    })
  })

  describe("Different Prompt Content", () => {
    it("should handle prompt with special characters", () => {
      const specialPrompt = "Test with <html> & special chars: @#$%"
      const { container } = render(
        <RenderedPrompt {...mockProps} renderedPrompt={specialPrompt} isExpanded={true} />
      )

      const preElement = container.querySelector("pre")
      expect(preElement).toHaveTextContent(specialPrompt)
    })

    it("should handle prompt with line breaks", () => {
      const multiLinePrompt = "Line 1\nLine 2\nLine 3"
      const { container } = render(
        <RenderedPrompt
          {...mockProps}
          renderedPrompt={multiLinePrompt}
          isExpanded={true}
        />
      )

      const preElement = container.querySelector("pre")
      // Check that the content includes all lines
      expect(preElement?.textContent).toContain("Line 1")
      expect(preElement?.textContent).toContain("Line 2")
      expect(preElement?.textContent).toContain("Line 3")
    })

    it("should handle prompt with unicode characters", () => {
      const unicodePrompt = "Test with emoji 🎬 and unicode ñ é ü"
      const { container } = render(
        <RenderedPrompt {...mockProps} renderedPrompt={unicodePrompt} isExpanded={true} />
      )

      const preElement = container.querySelector("pre")
      expect(preElement).toHaveTextContent(unicodePrompt)
    })
  })

  describe("Toggle State Changes", () => {
    it("should update display when isExpanded changes from false to true", () => {
      const { rerender } = render(<RenderedPrompt {...mockProps} isExpanded={false} />)

      expect(screen.queryByText(mockProps.renderedPrompt)).not.toBeInTheDocument()

      rerender(<RenderedPrompt {...mockProps} isExpanded={true} />)

      expect(screen.getByText(mockProps.renderedPrompt)).toBeInTheDocument()
    })

    it("should update display when isExpanded changes from true to false", () => {
      const { rerender } = render(<RenderedPrompt {...mockProps} isExpanded={true} />)

      expect(screen.getByText(mockProps.renderedPrompt)).toBeInTheDocument()

      rerender(<RenderedPrompt {...mockProps} isExpanded={false} />)

      expect(screen.queryByText(mockProps.renderedPrompt)).not.toBeInTheDocument()
    })
  })

  describe("Visual Elements", () => {
    it("should render with proper border styling", () => {
      const { container } = render(<RenderedPrompt {...mockProps} isExpanded={true} />)

      const contentDiv = container.querySelector(".border-slate-700\\/50")
      expect(contentDiv).toBeInTheDocument()
    })

    it("should render with proper background colors", () => {
      const { container } = render(<RenderedPrompt {...mockProps} isExpanded={true} />)

      const contentDiv = container.querySelector(".bg-slate-900\\/50")
      expect(contentDiv).toBeInTheDocument()
    })
  })
})

