/**
 * Tests for lib/wrapped/api-calls.ts - LLM API call implementations
 */

// Mock next-auth and admin modules before other imports
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/admin', () => ({
  requireAdmin: jest.fn(),
}))

import { callOpenAI } from '@/lib/wrapped/api-calls'
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

    it('should return error when model is not provided', async () => {
      const result = await callOpenAI(
        {
          provider: 'openai',
          apiKey: 'test-key',
        } as any, // TypeScript will complain, but we're testing runtime behavior
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Model is required')
      expect(global.fetch).not.toHaveBeenCalled()
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

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.model).toBe('gpt-4')
      // Temperature and max_tokens are only included if provided
      expect(body.temperature).toBeUndefined()
      expect(body.max_tokens).toBeUndefined()
      expect(body.messages).toHaveLength(2)
      expect(body.messages[0].role).toBe('system')
      expect(body.messages[1].role).toBe('user')
      expect(body.messages[1].content).toBe('test prompt')
    })

    it('should use configured temperature and maxTokens', async () => {
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
          temperature: 0.9,
          maxTokens: 8000,
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.temperature).toBe(0.9)
      expect(body.max_tokens).toBe(8000)
    })

    it('should use max_completion_tokens for newer models', async () => {
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
          model: 'gpt-5',
          maxTokens: 5000,
        },
        'test prompt',
        mockStatistics,
        2024,
        'user-1',
        'Test User'
      )

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.max_completion_tokens).toBe(5000)
      expect(body.max_tokens).toBeUndefined()
    })
  })
})

