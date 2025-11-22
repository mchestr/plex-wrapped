import { renderHook, act, waitFor } from '@testing-library/react'
import { usePlaygroundState } from '@/hooks/use-playground-state'

const STORAGE_KEY = 'playground-state'

describe('usePlaygroundState', () => {
  let mockLocalStorage: { [key: string]: string }

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {}

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key]
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {}
        }),
      },
      writable: true,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with default values when no saved state exists', () => {
      const templates = [
        { id: 'template-1' },
        { id: 'template-2' },
      ]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      expect(result.current.selectedTemplateId).toBe('template-1')
      expect(result.current.testConfig).toEqual({
        userName: '',
        year: new Date().getFullYear(),
        sendToAI: false,
        model: '',
        temperature: undefined,
        maxTokens: undefined,
      })
      expect(result.current.useCustomModel).toBe(false)
      expect(result.current.result).toBeNull()
      expect(result.current.showStatistics).toBe(false)
      expect(result.current.statisticsViewMode).toBe('formatted')
      expect(result.current.showAIParameters).toBe(false)
      expect(result.current.showRenderedPrompt).toBe(true)
    })

    it('should use initialTemplateId when provided', () => {
      const templates = [
        { id: 'template-1' },
        { id: 'template-2' },
        { id: 'template-3' },
      ]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
          initialTemplateId: 'template-3',
        })
      )

      expect(result.current.selectedTemplateId).toBe('template-3')
    })

    it('should use active template when no initialTemplateId is provided', () => {
      const templates = [
        { id: 'template-1', isActive: false },
        { id: 'template-2', isActive: true },
        { id: 'template-3', isActive: false },
      ]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      expect(result.current.selectedTemplateId).toBe('template-2')
    })

    it('should handle empty templates array', () => {
      const { result } = renderHook(() =>
        usePlaygroundState({
          templates: [],
        })
      )

      expect(result.current.selectedTemplateId).toBe('')
    })
  })

  describe('state restoration from localStorage', () => {
    it('should restore saved state from localStorage', async () => {
      const templates = [
        { id: 'template-1' },
        { id: 'template-2' },
      ]

      const savedState = {
        selectedTemplateId: 'template-2',
        testConfig: {
          userName: 'Test User',
          year: 2023,
          sendToAI: true,
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
        },
        useCustomModel: true,
        result: {
          renderedPrompt: 'Test prompt',
          llmResponse: 'Test response',
          tokenUsage: {
            promptTokens: 100,
            completionTokens: 50,
            totalTokens: 150,
            cost: 0.01,
          },
        },
        showStatistics: true,
        statisticsViewMode: 'json' as const,
        showAIParameters: true,
        showRenderedPrompt: false,
      }

      mockLocalStorage[STORAGE_KEY] = JSON.stringify(savedState)

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      await waitFor(() => {
        expect(result.current.selectedTemplateId).toBe('template-2')
        expect(result.current.testConfig).toEqual(savedState.testConfig)
        expect(result.current.useCustomModel).toBe(true)
        expect(result.current.result).toEqual(savedState.result)
        expect(result.current.showStatistics).toBe(true)
        expect(result.current.statisticsViewMode).toBe('json')
        expect(result.current.showAIParameters).toBe(true)
        expect(result.current.showRenderedPrompt).toBe(false)
      })
    })

    it('should not restore template ID if it does not exist in templates', async () => {
      const templates = [
        { id: 'template-1' },
        { id: 'template-2' },
      ]

      const savedState = {
        selectedTemplateId: 'template-999',
        testConfig: {
          userName: 'Test User',
          year: 2023,
          sendToAI: false,
          model: '',
        },
      }

      mockLocalStorage[STORAGE_KEY] = JSON.stringify(savedState)

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      await waitFor(() => {
        // Should fall back to first template
        expect(result.current.selectedTemplateId).toBe('template-1')
      })
    })

    it('should prefer initialTemplateId over saved template ID', async () => {
      const templates = [
        { id: 'template-1' },
        { id: 'template-2' },
        { id: 'template-3' },
      ]

      const savedState = {
        selectedTemplateId: 'template-2',
      }

      mockLocalStorage[STORAGE_KEY] = JSON.stringify(savedState)

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
          initialTemplateId: 'template-3',
        })
      )

      expect(result.current.selectedTemplateId).toBe('template-3')
    })

    it('should handle corrupted localStorage data gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const templates = [{ id: 'template-1' }]

      mockLocalStorage[STORAGE_KEY] = 'invalid json {'

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load playground state from localStorage:',
          expect.any(Error)
        )
        expect(window.localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
      })

      // Should still have default values
      expect(result.current.selectedTemplateId).toBe('template-1')

      consoleErrorSpy.mockRestore()
    })

    it('should only restore state once', async () => {
      const templates = [{ id: 'template-1' }]

      const savedState = {
        selectedTemplateId: 'template-1',
        testConfig: {
          userName: 'Test User',
          year: 2023,
          sendToAI: false,
          model: '',
        },
      }

      mockLocalStorage[STORAGE_KEY] = JSON.stringify(savedState)

      const { rerender } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      await waitFor(() => {
        expect(window.localStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY)
      })

      const callCount = (window.localStorage.getItem as jest.Mock).mock.calls.length

      // Rerender should not trigger another restore
      rerender()
      rerender()

      expect((window.localStorage.getItem as jest.Mock).mock.calls.length).toBe(callCount)
    })
  })

  describe('state updates', () => {
    it('should update selectedTemplateId', () => {
      const templates = [
        { id: 'template-1' },
        { id: 'template-2' },
      ]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.setSelectedTemplateId('template-2')
      })

      expect(result.current.selectedTemplateId).toBe('template-2')
    })

    it('should update testConfig with partial updates', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.setTestConfig({ userName: 'John Doe' })
      })

      expect(result.current.testConfig.userName).toBe('John Doe')
      expect(result.current.testConfig.year).toBe(new Date().getFullYear())
    })

    it('should update testConfig with function updater', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.setTestConfig({ userName: 'John' })
      })

      act(() => {
        result.current.setTestConfig((prev) => ({
          ...prev,
          userName: prev.userName + ' Doe',
        }))
      })

      expect(result.current.testConfig.userName).toBe('John Doe')
    })

    it('should update useCustomModel', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.setUseCustomModel(true)
      })

      expect(result.current.useCustomModel).toBe(true)
    })

    it('should update result', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      const newResult = {
        renderedPrompt: 'Test prompt',
        llmResponse: 'Test response',
      }

      act(() => {
        result.current.setResult(newResult)
      })

      expect(result.current.result).toEqual(newResult)
    })

    it('should update showStatistics', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.setShowStatistics(true)
      })

      expect(result.current.showStatistics).toBe(true)
    })

    it('should update statisticsViewMode', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.setStatisticsViewMode('json')
      })

      expect(result.current.statisticsViewMode).toBe('json')
    })

    it('should update showAIParameters', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.setShowAIParameters(true)
      })

      expect(result.current.showAIParameters).toBe(true)
    })

    it('should update showRenderedPrompt', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.setShowRenderedPrompt(false)
      })

      expect(result.current.showRenderedPrompt).toBe(false)
    })
  })

  describe('state persistence to localStorage', () => {
    it('should save state to localStorage after updates', async () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      // Wait for initial restore to complete
      await waitFor(() => {
        expect(result.current.selectedTemplateId).toBe('template-1')
      })

      act(() => {
        result.current.setTestConfig({ userName: 'Test User' })
      })

      await waitFor(() => {
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEY,
          expect.stringContaining('"userName":"Test User"')
        )
      })
    })

    it('should save all state properties to localStorage', async () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      await waitFor(() => {
        expect(result.current.selectedTemplateId).toBe('template-1')
      })

      act(() => {
        result.current.setTestConfig({ userName: 'Test User', year: 2023 })
      })

      act(() => {
        result.current.setUseCustomModel(true)
      })

      act(() => {
        result.current.setShowStatistics(true)
      })

      act(() => {
        result.current.setStatisticsViewMode('json')
      })

      await waitFor(() => {
        const savedCalls = (window.localStorage.setItem as jest.Mock).mock.calls.filter(
          (call) => call[0] === STORAGE_KEY
        )
        expect(savedCalls.length).toBeGreaterThan(0)

        const lastSavedData = savedCalls[savedCalls.length - 1]
        const parsedState = JSON.parse(lastSavedData[1])

        expect(parsedState.selectedTemplateId).toBe('template-1')
        expect(parsedState.testConfig.userName).toBe('Test User')
        expect(parsedState.testConfig.year).toBe(2023)
        expect(parsedState.useCustomModel).toBe(true)
        expect(parsedState.showStatistics).toBe(true)
        expect(parsedState.statisticsViewMode).toBe('json')
      })
    })

    it('should not save to localStorage before initial restore', () => {
      const templates: any[] = []

      renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      // Should not have called setItem yet
      expect(window.localStorage.setItem).not.toHaveBeenCalled()
    })

    it('should handle localStorage save errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const templates = [{ id: 'template-1' }]

      // Make setItem throw an error
      ;(window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      await waitFor(() => {
        expect(result.current.selectedTemplateId).toBe('template-1')
      })

      act(() => {
        result.current.setTestConfig({ userName: 'Test' })
      })

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to save playground state to localStorage:',
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('clearSavedState', () => {
    it('should clear saved state from localStorage', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.clearSavedState()
      })

      expect(window.localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
    })

    it('should call removeItem on clearSavedState', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.clearSavedState()
      })

      expect(window.localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
    })
  })

  describe('edge cases', () => {
    it('should handle SSR environment (no window)', () => {
      const templates = [{ id: 'template-1' }]

      // Temporarily remove window
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      // Should still initialize with defaults
      expect(result.current.selectedTemplateId).toBe('template-1')

      // Restore window
      global.window = originalWindow
    })

    it('should handle result being set to null', () => {
      const templates = [{ id: 'template-1' }]

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      act(() => {
        result.current.setResult({
          renderedPrompt: 'Test',
        })
      })

      expect(result.current.result).not.toBeNull()

      act(() => {
        result.current.setResult(null)
      })

      expect(result.current.result).toBeNull()
    })

    it('should handle temperature and maxTokens as undefined', async () => {
      const templates = [{ id: 'template-1' }]

      const savedState = {
        testConfig: {
          userName: 'Test',
          year: 2023,
          sendToAI: false,
          model: 'gpt-4',
          temperature: null,
          maxTokens: null,
        },
      }

      mockLocalStorage[STORAGE_KEY] = JSON.stringify(savedState)

      const { result } = renderHook(() =>
        usePlaygroundState({
          templates,
        })
      )

      await waitFor(() => {
        expect(result.current.testConfig.temperature).toBeUndefined()
        expect(result.current.testConfig.maxTokens).toBeUndefined()
      })
    })
  })
})

