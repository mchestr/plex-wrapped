/**
 * Tests for lib/wrapped/pricing.ts - cost calculation logic
 */

import { calculateCost, MODEL_PRICING } from '@/lib/wrapped/pricing'

describe('Pricing Calculation', () => {
  describe('calculateCost', () => {
    it('should calculate cost for OpenAI GPT-4 model', () => {
      const cost = calculateCost('gpt-4', 1000000, 500000, 'openai')
      // GPT-4: $30 per 1M input tokens, $60 per 1M output tokens
      // 1M input * $30/1M + 0.5M output * $60/1M = $30 + $30 = $60
      expect(cost).toBe(60)
    })

    it('should calculate cost for OpenAI GPT-3.5-turbo model', () => {
      const cost = calculateCost('gpt-3.5-turbo', 1000000, 1000000, 'openai')
      // GPT-3.5-turbo: $0.5 per 1M input tokens, $1.5 per 1M output tokens
      // 1M input * $0.5/1M + 1M output * $1.5/1M = $0.5 + $1.5 = $2
      expect(cost).toBe(2)
    })

    it('should calculate cost for OpenAI GPT-4o model', () => {
      const cost = calculateCost('gpt-4o', 500000, 250000, 'openai')
      // GPT-4o: $2.5 per 1M input tokens, $10 per 1M output tokens
      // 0.5M input * $2.5/1M + 0.25M output * $10/1M = $1.25 + $2.5 = $3.75
      expect(cost).toBe(3.75)
    })

    it('should calculate cost for OpenAI GPT-4o-mini model', () => {
      const cost = calculateCost('gpt-4o-mini', 2000000, 1000000, 'openai')
      // GPT-4o-mini: $0.15 per 1M input tokens, $0.6 per 1M output tokens
      // 2M input * $0.15/1M + 1M output * $0.6/1M = $0.3 + $0.6 = $0.9
      expect(cost).toBeCloseTo(0.9, 2)
    })

    it('should use fallback pricing for unknown OpenAI model', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      const cost = calculateCost('unknown-model', 1000000, 500000, 'openai')
      // Should fallback to GPT-4 pricing: $30 + $30 = $60
      expect(cost).toBe(60)
      expect(consoleWarnSpy).toHaveBeenCalled()
      const warnCall = consoleWarnSpy.mock.calls[0]
      expect(warnCall[0]).toContain('Unknown model')
      expect(warnCall[0]).toContain('unknown-model')
      consoleWarnSpy.mockRestore()
    })

    it('should handle zero tokens', () => {
      const cost = calculateCost('gpt-4', 0, 0, 'openai')
      expect(cost).toBe(0)
    })

    it('should handle null model name', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      const cost = calculateCost(null, 1000000, 500000, 'openai')
      expect(cost).toBe(60) // Fallback to GPT-4 pricing
      consoleWarnSpy.mockRestore()
    })

    it('should handle undefined model name', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      const cost = calculateCost(undefined, 1000000, 500000, 'openai')
      expect(cost).toBe(60) // Fallback to GPT-4 pricing
      consoleWarnSpy.mockRestore()
    })

    it('should calculate cost for batch tier models', () => {
      // Check if batch tier model exists, otherwise skip or use fallback
      const cost = calculateCost('gpt-4-0613-batch', 1000000, 500000, 'openai')
      // GPT-4-0613-batch: $15 per 1M input tokens, $30 per 1M output tokens
      // 1M input * $15/1M + 0.5M output * $30/1M = $15 + $15 = $30
      expect(cost).toBe(30)
    })

    it('should calculate cost for priority tier models', () => {
      const cost = calculateCost('gpt-4o-priority', 1000000, 500000, 'openai')
      // GPT-4o-priority: $4.25 per 1M input tokens, $17 per 1M output tokens
      // 1M input * $4.25/1M + 0.5M output * $17/1M = $4.25 + $8.5 = $12.75
      expect(cost).toBe(12.75)
    })

    it('should calculate cost for O-series models', () => {
      const cost = calculateCost('o1', 1000000, 500000, 'openai')
      // o1: $15 per 1M input tokens, $60 per 1M output tokens
      // 1M input * $15/1M + 0.5M output * $60/1M = $15 + $30 = $45
      expect(cost).toBe(45)
    })

    it('should handle fractional token counts', () => {
      const cost = calculateCost('gpt-4', 1234567, 987654, 'openai')
      // Should handle non-round numbers
      expect(cost).toBeCloseTo(1234567 / 1000000 * 30 + 987654 / 1000000 * 60, 2)
    })

    it('should calculate cost for models with cached input pricing', () => {
      // Note: cached input pricing exists but calculateCost doesn't use it currently
      // This test verifies the function still works with models that have cachedInput
      const cost = calculateCost('gpt-4o', 1000000, 500000, 'openai')
      expect(cost).toBeGreaterThan(0)
      expect(typeof cost).toBe('number')
    })
  })

  describe('MODEL_PRICING', () => {
    it('should have pricing for common models', () => {
      expect(MODEL_PRICING['gpt-4']).toBeDefined()
      expect(MODEL_PRICING['gpt-3.5-turbo']).toBeDefined()
      expect(MODEL_PRICING['gpt-4o']).toBeDefined()
      expect(MODEL_PRICING['gpt-4o-mini']).toBeDefined()
    })

    it('should have input and output pricing for all models', () => {
      Object.entries(MODEL_PRICING).forEach(([model, pricing]) => {
        expect(pricing.input).toBeDefined()
        expect(pricing.output).toBeDefined()
        expect(typeof pricing.input).toBe('number')
        expect(typeof pricing.output).toBe('number')
        expect(pricing.input).toBeGreaterThanOrEqual(0)
        expect(pricing.output).toBeGreaterThanOrEqual(0)
      })
    })

    it('should have reasonable pricing values', () => {
      Object.entries(MODEL_PRICING).forEach(([model, pricing]) => {
        // Prices should be reasonable (not negative, not extremely high)
        expect(pricing.input).toBeGreaterThanOrEqual(0)
        expect(pricing.output).toBeGreaterThanOrEqual(0)
        expect(pricing.input).toBeLessThan(1000) // Sanity check
        expect(pricing.output).toBeLessThan(1000) // Sanity check
      })
    })
  })
})

