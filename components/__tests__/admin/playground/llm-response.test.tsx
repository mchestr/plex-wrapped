import { LLMResponse } from "@/components/admin/playground/llm-response"
import { fireEvent, render, screen } from "@testing-library/react"

describe("LLMResponse", () => {
  const mockProps = {
    llmResponse: "This is a test LLM response with some content",
    onPreview: jest.fn(),
    onSave: jest.fn(),
    isSaving: false,
    saveError: null,
    previewError: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Basic Rendering", () => {
    it("should render the component with llm response", () => {
      render(<LLMResponse {...mockProps} />)

      expect(screen.getByText("LLM Response")).toBeInTheDocument()
      expect(
        screen.getByText("The AI-generated response containing the wrapped data")
      ).toBeInTheDocument()
      expect(screen.getByText(mockProps.llmResponse)).toBeInTheDocument()
    })

    it("should render preview button", () => {
      render(<LLMResponse {...mockProps} />)

      const previewButton = screen.getByRole("button", { name: /preview/i })
      expect(previewButton).toBeInTheDocument()
    })

    it("should render save button", () => {
      render(<LLMResponse {...mockProps} />)

      const saveButton = screen.getByRole("button", { name: /save as wrapped/i })
      expect(saveButton).toBeInTheDocument()
    })

    it("should display llm response in pre element", () => {
      const { container } = render(<LLMResponse {...mockProps} />)

      const preElement = container.querySelector("pre")
      expect(preElement).toBeInTheDocument()
      expect(preElement).toHaveTextContent(mockProps.llmResponse)
    })
  })

  describe("Button Interactions", () => {
    it("should call onPreview when preview button is clicked", () => {
      render(<LLMResponse {...mockProps} />)

      const previewButton = screen.getByRole("button", { name: /preview/i })
      fireEvent.click(previewButton)

      expect(mockProps.onPreview).toHaveBeenCalledTimes(1)
    })

    it("should call onSave when save button is clicked", () => {
      render(<LLMResponse {...mockProps} />)

      const saveButton = screen.getByRole("button", { name: /save as wrapped/i })
      fireEvent.click(saveButton)

      expect(mockProps.onSave).toHaveBeenCalledTimes(1)
    })

    it("should not call onSave when button is disabled", () => {
      render(<LLMResponse {...mockProps} isSaving={true} />)

      const saveButton = screen.getByRole("button", { name: /saving/i })
      fireEvent.click(saveButton)

      expect(mockProps.onSave).not.toHaveBeenCalled()
    })
  })

  describe("Saving State", () => {
    it("should disable save button when isSaving is true", () => {
      render(<LLMResponse {...mockProps} isSaving={true} />)

      const saveButton = screen.getByRole("button", { name: /saving/i })
      expect(saveButton).toBeDisabled()
    })

    it("should show saving text when isSaving is true", () => {
      render(<LLMResponse {...mockProps} isSaving={true} />)

      expect(screen.getByText("Saving...")).toBeInTheDocument()
    })

    it("should show save icon when not saving", () => {
      const { container } = render(<LLMResponse {...mockProps} isSaving={false} />)

      const saveButton = screen.getByRole("button", { name: /save as wrapped/i })
      const svg = saveButton.querySelector("svg")
      expect(svg).toBeInTheDocument()
    })

    it("should show spinner when saving", () => {
      const { container } = render(<LLMResponse {...mockProps} isSaving={true} />)

      const saveButton = screen.getByRole("button", { name: /saving/i })
      const spinner = saveButton.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()
    })
  })

  describe("Error Handling", () => {
    it("should display save error when provided", () => {
      render(<LLMResponse {...mockProps} saveError="Failed to save wrapped data" />)

      expect(screen.getByText("Failed to save wrapped data")).toBeInTheDocument()
    })

    it("should display preview error when provided", () => {
      render(<LLMResponse {...mockProps} previewError="Failed to preview wrapped data" />)

      expect(screen.getByText("Failed to preview wrapped data")).toBeInTheDocument()
    })

    it("should display both errors when both are provided", () => {
      render(
        <LLMResponse
          {...mockProps}
          saveError="Save error"
          previewError="Preview error"
        />
      )

      expect(screen.getByText("Save error")).toBeInTheDocument()
      expect(screen.getByText("Preview error")).toBeInTheDocument()
    })

    it("should not display error messages when errors are null", () => {
      render(<LLMResponse {...mockProps} saveError={null} previewError={null} />)

      const errorElements = screen.queryAllByText(/error/i)
      expect(errorElements).toHaveLength(0)
    })

    it("should style error messages with red background", () => {
      const { container } = render(
        <LLMResponse {...mockProps} saveError="Test error" />
      )

      const errorDiv = container.querySelector(".bg-red-500\\/10")
      expect(errorDiv).toBeInTheDocument()
      expect(errorDiv).toHaveClass("border-red-500/50", "text-red-400")
    })
  })

  describe("Visual Elements", () => {
    it("should render with proper styling classes", () => {
      const { container } = render(<LLMResponse {...mockProps} />)

      const mainDiv = container.querySelector(".bg-slate-800\\/50")
      expect(mainDiv).toBeInTheDocument()
      expect(mainDiv).toHaveClass("backdrop-blur-sm", "border", "border-slate-700/50")
    })

    it("should render icon for LLM Response header", () => {
      const { container } = render(<LLMResponse {...mockProps} />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass("text-cyan-400")
    })

    it("should render response in scrollable container", () => {
      const { container } = render(<LLMResponse {...mockProps} />)

      const scrollableDiv = container.querySelector(".max-h-96")
      expect(scrollableDiv).toBeInTheDocument()
      expect(scrollableDiv).toHaveClass("overflow-y-auto")
    })
  })

  describe("Button Styling", () => {
    it("should style preview button with cyan-purple gradient", () => {
      render(<LLMResponse {...mockProps} />)

      const previewButton = screen.getByRole("button", { name: /preview/i })
      expect(previewButton).toHaveClass("bg-gradient-to-r", "from-cyan-600", "to-purple-600")
    })

    it("should style save button with green-emerald gradient", () => {
      render(<LLMResponse {...mockProps} />)

      const saveButton = screen.getByRole("button", { name: /save as wrapped/i })
      expect(saveButton).toHaveClass("bg-gradient-to-r", "from-green-600", "to-emerald-600")
    })

    it("should apply disabled styling when saving", () => {
      render(<LLMResponse {...mockProps} isSaving={true} />)

      const saveButton = screen.getByRole("button", { name: /saving/i })
      expect(saveButton).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed")
    })
  })

  describe("Long Content", () => {
    it("should handle very long llm responses", () => {
      const longResponse = "A".repeat(10000)
      render(<LLMResponse {...mockProps} llmResponse={longResponse} />)

      expect(screen.getByText(longResponse)).toBeInTheDocument()
    })

    it("should preserve whitespace in response", () => {
      const responseWithWhitespace = "Line 1\n\nLine 2\n  Indented Line 3"
      const { container } = render(
        <LLMResponse {...mockProps} llmResponse={responseWithWhitespace} />
      )

      const preElement = container.querySelector("pre")
      expect(preElement).toHaveClass("whitespace-pre-wrap")
    })
  })
})

