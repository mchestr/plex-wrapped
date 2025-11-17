/**
 * Tests for lib/wrapped/api-calls.ts - LLM API call implementations
 */

import { callOpenAI, callOpenRouter } from '@/lib/wrapped/api-calls'
import { WrappedStatistics } from '@/types/wrapped'
import { parseWrappedResponse } from '@/lib/wrapped/prompt'

// Mock dependencies
jest.mock('@/lib/wrapped/prompt', () => ({
  parseWrappedResponse: jest.fn(),
}))

jest.mock('@/lib/utils', () => ({
  getBaseUrl: jest.fn(() => 'https://example.com'),
}))

const mockStatistics: WrappedStatistics = {
  totalWatchTime: {
    total: 1000,
    movies: 500,
    shows: 500,
  },
  moviesWatched: 10,
  showsWatched: 5,
  episodesWatched: 50,
  topMovies: [],
  topShows: [],
  watchTimeByMonth: [],
}

describe('LLM API Calls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('callOpenAI', () => {
    it('should successfully call OpenAI API and parse response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ sections: [], summary: 'Test summary' }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      ;(parseWrappedResponse as jest.Mock).mockReturnValue({
        sections: [],
        summary: 'Test summary',
      })

      const result = await callOpenAI(
        {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.tokenUsage).toBeDefined()
      expect(result.tokenUsage?.promptTokens).toBe(1000)
      expect(result.tokenUsage?.completionTokens).toBe(500)
      expect(result.tokenUsage?.totalTokens).toBe(1500)
      expect(result.rawResponse).toBe(mockResponse.choices[0].message.content)
      expect(parseWrappedResponse).toHaveBeenCalled()
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            message: 'Invalid API key',
          },
        }),
      })

      const result = await callOpenAI(
        {
          provider: 'openai',
          apiKey: 'invalid-key',
          model: 'gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid API key')
    })

    it('should handle truncated responses', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ sections: [] }).slice(0, -10), // Incomplete JSON
            },
            finish_reason: 'length',
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await callOpenAI(
        {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('truncated')
    })

    it('should handle incomplete JSON responses', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '{"sections": [', // Incomplete JSON
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await callOpenAI(
        {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('truncated')
    })

    it('should handle missing content in response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {},
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await callOpenAI(
        {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('No content')
    })

    it('should use default model if not provided', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ sections: [] }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      ;(parseWrappedResponse as jest.Mock).mockReturnValue({
        sections: [],
      })

      await callOpenAI(
        {
          provider: 'openai',
          apiKey: 'test-key',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.model).toBe('gpt-4') // Default model
    })

    it('should send correct request format', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ sections: [] }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      ;(parseWrappedResponse as jest.Mock).mockReturnValue({
        sections: [],
      })

      await callOpenAI(
        {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-key',
          }),
          body: expect.stringContaining('test prompt'),
        })
      )
    })
  })

  describe('callOpenRouter', () => {
    it('should successfully call OpenRouter API and parse response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ sections: [], summary: 'Test summary' }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      ;(parseWrappedResponse as jest.Mock).mockReturnValue({
        sections: [],
        summary: 'Test summary',
      })

      const result = await callOpenRouter(
        {
          provider: 'openrouter',
          apiKey: 'test-key',
          model: 'openai/gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.tokenUsage).toBeDefined()
      expect(result.tokenUsage?.promptTokens).toBe(1000)
      expect(result.tokenUsage?.completionTokens).toBe(500)
      expect(result.tokenUsage?.totalTokens).toBe(1500)
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            message: 'Invalid API key',
          },
        }),
      })

      const result = await callOpenRouter(
        {
          provider: 'openrouter',
          apiKey: 'invalid-key',
          model: 'openai/gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid API key')
    })

    it('should use default model if not provided', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ sections: [] }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      ;(parseWrappedResponse as jest.Mock).mockReturnValue({
        sections: [],
      })

      await callOpenRouter(
        {
          provider: 'openrouter',
          apiKey: 'test-key',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.model).toBe('openai/gpt-4') // Default model
    })

    it('should include HTTP-Referer header', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ sections: [] }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      ;(parseWrappedResponse as jest.Mock).mockReturnValue({
        sections: [],
      })

      await callOpenRouter(
        {
          provider: 'openrouter',
          apiKey: 'test-key',
          model: 'openai/gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({
            'HTTP-Referer': 'https://example.com',
          }),
        })
      )
    })

    it('should handle truncated responses', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ sections: [] }).slice(0, -10), // Incomplete JSON
            },
            finish_reason: 'length',
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await callOpenRouter(
        {
          provider: 'openrouter',
          apiKey: 'test-key',
          model: 'openai/gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('truncated')
    })

    it('should handle JSON parse errors in error response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      const result = await callOpenRouter(
        {
          provider: 'openrouter',
          apiKey: 'test-key',
          model: 'openai/gpt-4',
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('OpenRouter API error')
    })
  })
})

