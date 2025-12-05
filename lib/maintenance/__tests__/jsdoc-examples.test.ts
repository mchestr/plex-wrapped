/**
 * Tests for JSDoc documentation examples
 *
 * These tests verify that the code examples in JSDoc comments remain accurate
 * and continue to work as documented.
 */

import { evaluateRule, calculateComplexity, type MediaItem } from '../rule-evaluator'
import type { RuleCriteria } from '@/lib/validations/maintenance'

describe('JSDoc Documentation Examples', () => {
  describe('MediaItem interface example', () => {
    /**
     * Tests the MediaItem example from the interface documentation:
     *
     * ```ts
     * const item: MediaItem = {
     *   plexRatingKey: "12345",
     *   title: "Example Movie",
     *   year: 2020,
     *   playCount: 0,
     *   lastWatchedAt: null,
     *   fileSize: BigInt(1500000000),
     *   radarr: {
     *     hasFile: true,
     *     monitored: false
     *   }
     * }
     * ```
     */
    it('should accept the documented MediaItem structure', () => {
      const item: MediaItem = {
        plexRatingKey: '12345',
        title: 'Example Movie',
        year: 2020,
        playCount: 0,
        lastWatchedAt: null,
        fileSize: BigInt(1500000000),
        radarr: {
          hasFile: true,
          monitored: false,
        },
      }

      expect(item.plexRatingKey).toBe('12345')
      expect(item.title).toBe('Example Movie')
      expect(item.year).toBe(2020)
      expect(item.playCount).toBe(0)
      expect(item.lastWatchedAt).toBeNull()
      expect(item.fileSize).toBe(BigInt(1500000000))
      expect(item.radarr?.hasFile).toBe(true)
      expect(item.radarr?.monitored).toBe(false)
    })
  })

  describe('evaluateRule function example', () => {
    /**
     * Tests the evaluateRule example from the function documentation:
     *
     * ```ts
     * const criteria: RuleCriteria = {
     *   type: 'group',
     *   operator: 'AND',
     *   conditions: [
     *     { type: 'condition', field: 'playCount', operator: 'equals', value: 0 },
     *     { type: 'condition', field: 'addedAt', operator: 'olderThan', value: 365, valueUnit: 'days' }
     *   ]
     * }
     *
     * const matches = evaluateRule(mediaItem, criteria)
     * if (matches) {
     *   console.log('Item matches maintenance rule')
     * }
     * ```
     */
    it('should match item with the documented criteria structure', () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-01'))

      const mediaItem: MediaItem = {
        title: 'Test Movie',
        playCount: 0,
        addedAt: new Date('2023-01-01'), // More than 365 days ago
      }

      const criteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
          { type: 'condition', id: 'c2', field: 'addedAt', operator: 'olderThan', value: 365, valueUnit: 'days' },
        ],
      }

      const matches = evaluateRule(mediaItem, criteria)
      expect(matches).toBe(true)

      jest.useRealTimers()
    })

    it('should not match when criteria is not satisfied', () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-01'))

      const mediaItem: MediaItem = {
        title: 'Test Movie',
        playCount: 5, // Not zero
        addedAt: new Date('2023-01-01'),
      }

      const criteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
          { type: 'condition', id: 'c2', field: 'addedAt', operator: 'olderThan', value: 365, valueUnit: 'days' },
        ],
      }

      const matches = evaluateRule(mediaItem, criteria)
      expect(matches).toBe(false)

      jest.useRealTimers()
    })
  })

  describe('calculateComplexity function example', () => {
    /**
     * Tests the calculateComplexity example from the function documentation:
     *
     * ```ts
     * const complexity = calculateComplexity(ruleCriteria)
     *
     * // { conditionCount: 3, groupCount: 2, maxDepth: 1, complexity: 'simple' }
     * console.log(complexity)
     *
     * // Use in UI
     * <ComplexityBadge level={complexity.complexity} />
     * ```
     */
    it('should return correct complexity metrics for simple rules', () => {
      const ruleCriteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
          { type: 'condition', id: 'c2', field: 'rating', operator: 'lessThan', value: 5 },
          {
            type: 'group',
            id: 'g1',
            operator: 'OR',
            conditions: [{ type: 'condition', id: 'c3', field: 'year', operator: 'lessThan', value: 2000 }],
          },
        ],
      }

      const complexity = calculateComplexity(ruleCriteria)

      expect(complexity.conditionCount).toBe(3)
      expect(complexity.groupCount).toBe(2)
      expect(complexity.maxDepth).toBe(2)
      expect(complexity.complexity).toBe('simple')
    })

    it('should categorize moderate complexity correctly', () => {
      // More than 5 conditions = moderate
      const conditions = Array.from({ length: 6 }, (_, i) => ({
        type: 'condition' as const,
        id: `c${i}`,
        field: 'playCount',
        operator: 'equals',
        value: i,
      }))

      const ruleCriteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions,
      }

      const complexity = calculateComplexity(ruleCriteria)

      expect(complexity.conditionCount).toBe(6)
      expect(complexity.complexity).toBe('moderate')
    })

    it('should categorize complex rules correctly', () => {
      // More than 10 conditions = complex
      const conditions = Array.from({ length: 11 }, (_, i) => ({
        type: 'condition' as const,
        id: `c${i}`,
        field: 'playCount',
        operator: 'equals',
        value: i,
      }))

      const ruleCriteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions,
      }

      const complexity = calculateComplexity(ruleCriteria)

      expect(complexity.conditionCount).toBe(11)
      expect(complexity.complexity).toBe('complex')
    })
  })

  describe('calculateDateThreshold example', () => {
    /**
     * Tests the calculateDateThreshold example from the internal function documentation:
     *
     * ```ts
     * // Get the date 90 days ago
     * const threshold = calculateDateThreshold(90, 'days')
     *
     * // Check if a date is older than 90 days
     * if (someDate < threshold) {
     *   console.log('Date is older than 90 days')
     * }
     * ```
     *
     * Note: calculateDateThreshold is internal, so we test its behavior
     * through evaluateRule with date conditions.
     */
    it('should correctly evaluate dates older than 90 days', () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-01'))

      const oldItem: MediaItem = {
        title: 'Old Movie',
        lastWatchedAt: new Date('2024-02-01'), // ~120 days ago
      }

      const recentItem: MediaItem = {
        title: 'Recent Movie',
        lastWatchedAt: new Date('2024-05-01'), // ~31 days ago
      }

      const criteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          { type: 'condition', id: 'c1', field: 'lastWatchedAt', operator: 'olderThan', value: 90, valueUnit: 'days' },
        ],
      }

      expect(evaluateRule(oldItem, criteria)).toBe(true)
      expect(evaluateRule(recentItem, criteria)).toBe(false)

      jest.useRealTimers()
    })
  })

  describe('scanForCandidates example (documented pattern)', () => {
    /**
     * Tests the pattern documented in scanForCandidates:
     *
     * ```ts
     * // Basic scan
     * const result = await scanForCandidates(ruleId)
     * if (result.status === 'COMPLETED') {
     *   console.log(`Found ${result.itemsFlagged} candidates`)
     * }
     *
     * // With progress callback
     * const result = await scanForCandidates(ruleId, (percent) => {
     *   updateProgressBar(percent)
     * })
     * ```
     *
     * Note: Since scanForCandidates requires database and Tautulli mocking,
     * we test the pattern using evaluateRule which it calls internally.
     */
    it('should demonstrate the rule evaluation pattern used in scanning', () => {
      // This simulates what scanForCandidates does internally
      const mediaItems: MediaItem[] = [
        { title: 'Movie 1', playCount: 0 },
        { title: 'Movie 2', playCount: 5 },
        { title: 'Movie 3', playCount: 0 },
      ]

      const criteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [{ type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 }],
      }

      // Simulate the scanning loop
      const matchedItems = mediaItems.filter((item) => evaluateRule(item, criteria))

      expect(matchedItems.length).toBe(2)
      expect(matchedItems[0].title).toBe('Movie 1')
      expect(matchedItems[1].title).toBe('Movie 3')
    })
  })

  describe('Hierarchical criteria tree example', () => {
    /**
     * Tests the tree structure documented in the module JSDoc:
     *
     * ```
     *          GROUP (AND)
     *         /    |     \
     *    cond1  cond2   GROUP (OR)
     *                   /        \
     *               cond3      cond4
     * ```
     *
     * For the above tree:
     * - First, cond3 and cond4 are evaluated and combined with OR
     * - Then cond1, cond2, and the OR result are combined with AND
     */
    it('should correctly evaluate nested AND/OR tree structure', () => {
      const item: MediaItem = {
        title: 'Test Movie',
        playCount: 0, // cond1: true
        rating: 5, // cond2: true
        year: 2019, // cond3: false
        resolution: '4K', // cond4: true
      }

      const criteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
          { type: 'condition', id: 'c2', field: 'rating', operator: 'lessThanOrEqual', value: 7 },
          {
            type: 'group',
            id: 'g1',
            operator: 'OR',
            conditions: [
              { type: 'condition', id: 'c3', field: 'year', operator: 'lessThan', value: 2010 },
              { type: 'condition', id: 'c4', field: 'resolution', operator: 'equals', value: '4K' },
            ],
          },
        ],
      }

      // cond1: true (playCount = 0)
      // cond2: true (rating 5 <= 7)
      // cond3: false (year 2019 is not < 2010)
      // cond4: true (resolution is '4K')
      // OR group: true (cond3 OR cond4 = false OR true = true)
      // AND result: true AND true AND true = true

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should fail when AND condition in nested tree fails', () => {
      const item: MediaItem = {
        title: 'Test Movie',
        playCount: 5, // cond1: false (breaks AND)
        rating: 5, // cond2: true
        year: 2019, // cond3: false
        resolution: '4K', // cond4: true
      }

      const criteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
          { type: 'condition', id: 'c2', field: 'rating', operator: 'lessThanOrEqual', value: 7 },
          {
            type: 'group',
            id: 'g1',
            operator: 'OR',
            conditions: [
              { type: 'condition', id: 'c3', field: 'year', operator: 'lessThan', value: 2010 },
              { type: 'condition', id: 'c4', field: 'resolution', operator: 'equals', value: '4K' },
            ],
          },
        ],
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })
  })
})
