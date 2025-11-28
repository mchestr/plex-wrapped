import { evaluateRule } from '../rule-evaluator'
import type { MediaItem } from '../rule-evaluator'
import type { RuleCriteria } from '@/lib/validations/maintenance'

describe('evaluateRule', () => {
  const baseMediaItem: MediaItem = {
    plexRatingKey: '12345',
    title: 'Test Movie',
    year: 2020,
    libraryId: 'lib1',
    playCount: 5,
    lastWatchedAt: new Date('2024-01-15'),
    addedAt: new Date('2023-06-01'),
    fileSize: BigInt(5368709120), // 5GB in bytes
    filePath: '/media/movies/test.mkv',
    resolution: '1080p',
    rating: 7.5,
    labels: ['action', 'thriller'],
  }

  describe('neverWatched criteria', () => {
    it('should match when neverWatched is true and playCount is 0', () => {
      const item: MediaItem = { ...baseMediaItem, playCount: 0 }
      const criteria: RuleCriteria = { neverWatched: true, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when neverWatched is true and playCount is greater than 0', () => {
      const item: MediaItem = { ...baseMediaItem, playCount: 3 }
      const criteria: RuleCriteria = { neverWatched: true, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when neverWatched is false and playCount is greater than 0', () => {
      const item: MediaItem = { ...baseMediaItem, playCount: 5 }
      const criteria: RuleCriteria = { neverWatched: false, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when neverWatched is false and playCount is 0', () => {
      const item: MediaItem = { ...baseMediaItem, playCount: 0 }
      const criteria: RuleCriteria = { neverWatched: false, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })
  })

  describe('lastWatchedBefore criteria', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-01'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should match when last watched before specified days', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        lastWatchedAt: new Date('2024-05-01'), // 31 days ago
      }
      const criteria: RuleCriteria = {
        lastWatchedBefore: { value: 30, unit: 'days' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when last watched after specified days', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        lastWatchedAt: new Date('2024-05-28'), // 4 days ago
      }
      const criteria: RuleCriteria = {
        lastWatchedBefore: { value: 30, unit: 'days' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when last watched before specified months', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        lastWatchedAt: new Date('2024-03-01'), // ~3 months ago
      }
      const criteria: RuleCriteria = {
        lastWatchedBefore: { value: 2, unit: 'months' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when last watched after specified months', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        lastWatchedAt: new Date('2024-05-15'), // ~0.5 months ago
      }
      const criteria: RuleCriteria = {
        lastWatchedBefore: { value: 2, unit: 'months' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when last watched before specified years', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        lastWatchedAt: new Date('2022-01-01'), // ~2.4 years ago
      }
      const criteria: RuleCriteria = {
        lastWatchedBefore: { value: 2, unit: 'years' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when last watched after specified years', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        lastWatchedAt: new Date('2023-12-01'), // ~0.5 years ago
      }
      const criteria: RuleCriteria = {
        lastWatchedBefore: { value: 2, unit: 'years' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when lastWatchedAt is null (never watched)', () => {
      const item: MediaItem = { ...baseMediaItem, lastWatchedAt: null }
      const criteria: RuleCriteria = {
        lastWatchedBefore: { value: 30, unit: 'days' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should match when lastWatchedAt is undefined (never watched)', () => {
      const item: MediaItem = { ...baseMediaItem, lastWatchedAt: undefined }
      const criteria: RuleCriteria = {
        lastWatchedBefore: { value: 30, unit: 'days' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })
  })

  describe('maxPlayCount criteria', () => {
    it('should match when playCount is below max', () => {
      const item: MediaItem = { ...baseMediaItem, playCount: 3 }
      const criteria: RuleCriteria = { maxPlayCount: 5, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should match when playCount equals max', () => {
      const item: MediaItem = { ...baseMediaItem, playCount: 5 }
      const criteria: RuleCriteria = { maxPlayCount: 5, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when playCount exceeds max', () => {
      const item: MediaItem = { ...baseMediaItem, playCount: 10 }
      const criteria: RuleCriteria = { maxPlayCount: 5, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when playCount is 0 and max is 0', () => {
      const item: MediaItem = { ...baseMediaItem, playCount: 0 }
      const criteria: RuleCriteria = { maxPlayCount: 0, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when playCount is 1 and max is 0', () => {
      const item: MediaItem = { ...baseMediaItem, playCount: 1 }
      const criteria: RuleCriteria = { maxPlayCount: 0, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })
  })

  describe('addedBefore criteria', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-01'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should match when added before specified days', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        addedAt: new Date('2024-04-01'), // ~61 days ago
      }
      const criteria: RuleCriteria = {
        addedBefore: { value: 60, unit: 'days' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when added after specified days', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        addedAt: new Date('2024-05-25'), // ~7 days ago
      }
      const criteria: RuleCriteria = {
        addedBefore: { value: 60, unit: 'days' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when added before specified months', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        addedAt: new Date('2023-12-01'), // ~6 months ago
      }
      const criteria: RuleCriteria = {
        addedBefore: { value: 3, unit: 'months' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should match when added before specified years', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        addedAt: new Date('2021-01-01'), // ~3.4 years ago
      }
      const criteria: RuleCriteria = {
        addedBefore: { value: 2, unit: 'years' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when addedAt is null', () => {
      const item: MediaItem = { ...baseMediaItem, addedAt: null }
      const criteria: RuleCriteria = {
        addedBefore: { value: 30, unit: 'days' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should not match when addedAt is undefined', () => {
      const item: MediaItem = { ...baseMediaItem, addedAt: undefined }
      const criteria: RuleCriteria = {
        addedBefore: { value: 30, unit: 'days' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })
  })

  describe('minFileSize criteria', () => {
    it('should match when file size meets minimum in MB', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        fileSize: BigInt(1024 * 1024 * 500), // 500MB
      }
      const criteria: RuleCriteria = {
        minFileSize: { value: 400, unit: 'MB' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should match when file size equals minimum in MB', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        fileSize: BigInt(1024 * 1024 * 500), // 500MB
      }
      const criteria: RuleCriteria = {
        minFileSize: { value: 500, unit: 'MB' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when file size is below minimum in MB', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        fileSize: BigInt(1024 * 1024 * 300), // 300MB
      }
      const criteria: RuleCriteria = {
        minFileSize: { value: 500, unit: 'MB' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when file size meets minimum in GB', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        fileSize: BigInt(1024 * 1024 * 1024 * 10), // 10GB
      }
      const criteria: RuleCriteria = {
        minFileSize: { value: 5, unit: 'GB' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when file size is below minimum in GB', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        fileSize: BigInt(1024 * 1024 * 1024 * 3), // 3GB
      }
      const criteria: RuleCriteria = {
        minFileSize: { value: 5, unit: 'GB' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when file size meets minimum in TB', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        fileSize: BigInt(1024) * BigInt(1024) * BigInt(1024) * BigInt(1024) * BigInt(2), // 2TB
      }
      const criteria: RuleCriteria = {
        minFileSize: { value: 1, unit: 'TB' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when file size is below minimum in TB', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        fileSize: BigInt(1024 * 1024 * 1024 * 500), // 500GB
      }
      const criteria: RuleCriteria = {
        minFileSize: { value: 1, unit: 'TB' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should not match when fileSize is null', () => {
      const item: MediaItem = { ...baseMediaItem, fileSize: null }
      const criteria: RuleCriteria = {
        minFileSize: { value: 1, unit: 'GB' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should not match when fileSize is undefined', () => {
      const item: MediaItem = { ...baseMediaItem, fileSize: undefined }
      const criteria: RuleCriteria = {
        minFileSize: { value: 1, unit: 'GB' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })
  })

  describe('maxQuality criteria', () => {
    it('should match when quality is below max (alphabetically)', () => {
      const item: MediaItem = { ...baseMediaItem, resolution: '1080p' }
      const criteria: RuleCriteria = { maxQuality: '720p', operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should match when quality equals max', () => {
      const item: MediaItem = { ...baseMediaItem, resolution: '1080p' }
      const criteria: RuleCriteria = { maxQuality: '1080p', operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when quality exceeds max (alphabetically)', () => {
      const item: MediaItem = { ...baseMediaItem, resolution: '720p' }
      const criteria: RuleCriteria = { maxQuality: '1080p', operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should not match when quality is null', () => {
      const item: MediaItem = { ...baseMediaItem, resolution: null }
      const criteria: RuleCriteria = { maxQuality: '1080p', operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should not match when quality is undefined', () => {
      const item: MediaItem = { ...baseMediaItem, resolution: undefined }
      const criteria: RuleCriteria = { maxQuality: '1080p', operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })
  })

  describe('maxRating criteria', () => {
    it('should match when rating is below max', () => {
      const item: MediaItem = { ...baseMediaItem, rating: 5.0 }
      const criteria: RuleCriteria = { maxRating: 7.0, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should match when rating equals max', () => {
      const item: MediaItem = { ...baseMediaItem, rating: 7.0 }
      const criteria: RuleCriteria = { maxRating: 7.0, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when rating exceeds max', () => {
      const item: MediaItem = { ...baseMediaItem, rating: 9.0 }
      const criteria: RuleCriteria = { maxRating: 7.0, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when rating is 0 and max is 0', () => {
      const item: MediaItem = { ...baseMediaItem, rating: 0 }
      const criteria: RuleCriteria = { maxRating: 0, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should match when rating is 10 and max is 10', () => {
      const item: MediaItem = { ...baseMediaItem, rating: 10 }
      const criteria: RuleCriteria = { maxRating: 10, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when rating is null', () => {
      const item: MediaItem = { ...baseMediaItem, rating: null }
      const criteria: RuleCriteria = { maxRating: 7.0, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should not match when rating is undefined', () => {
      const item: MediaItem = { ...baseMediaItem, rating: undefined }
      const criteria: RuleCriteria = { maxRating: 7.0, operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })
  })

  describe('libraryIds criteria', () => {
    it('should match when item libraryId is in the list', () => {
      const item: MediaItem = { ...baseMediaItem, libraryId: 'lib1' }
      const criteria: RuleCriteria = {
        libraryIds: ['lib1', 'lib2', 'lib3'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when item libraryId is not in the list', () => {
      const item: MediaItem = { ...baseMediaItem, libraryId: 'lib5' }
      const criteria: RuleCriteria = {
        libraryIds: ['lib1', 'lib2', 'lib3'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when libraryId matches single-item list', () => {
      const item: MediaItem = { ...baseMediaItem, libraryId: 'lib1' }
      const criteria: RuleCriteria = {
        libraryIds: ['lib1'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when libraryId is null', () => {
      const item: MediaItem = { ...baseMediaItem, libraryId: undefined }
      const criteria: RuleCriteria = {
        libraryIds: ['lib1', 'lib2'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should not match when libraryId is undefined', () => {
      const item: MediaItem = { ...baseMediaItem, libraryId: undefined }
      const criteria: RuleCriteria = {
        libraryIds: ['lib1', 'lib2'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should handle empty libraryIds array by ignoring criteria', () => {
      const item: MediaItem = { ...baseMediaItem, libraryId: 'lib1' }
      const criteria: RuleCriteria = {
        libraryIds: [],
        operator: 'AND',
      }

      // Empty criteria array should result in no evaluation
      expect(evaluateRule(item, criteria)).toBe(false)
    })
  })

  describe('tags criteria', () => {
    it('should match when item has at least one matching tag', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        labels: ['action', 'thriller', 'drama'],
      }
      const criteria: RuleCriteria = {
        tags: ['action', 'comedy'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should match when item has all matching tags', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        labels: ['action', 'thriller', 'drama'],
      }
      const criteria: RuleCriteria = {
        tags: ['action', 'thriller'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when item has no matching tags', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        labels: ['action', 'thriller'],
      }
      const criteria: RuleCriteria = {
        tags: ['comedy', 'romance'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when single tag matches', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        labels: ['action'],
      }
      const criteria: RuleCriteria = {
        tags: ['action'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when item tags is null', () => {
      const item: MediaItem = { ...baseMediaItem, labels: undefined }
      const criteria: RuleCriteria = {
        tags: ['action', 'thriller'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should not match when item tags is empty array', () => {
      const item: MediaItem = { ...baseMediaItem, labels: [] }
      const criteria: RuleCriteria = {
        tags: ['action', 'thriller'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should handle empty tags criteria by ignoring it', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        labels: ['action', 'thriller'],
      }
      const criteria: RuleCriteria = {
        tags: [],
        operator: 'AND',
      }

      // Empty criteria array should result in no evaluation
      expect(evaluateRule(item, criteria)).toBe(false)
    })
  })

  describe('operator logic - AND', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-01'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should match when all criteria are satisfied with AND operator', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 2,
        lastWatchedAt: new Date('2024-01-01'), // ~5 months ago
        rating: 5.0,
      }
      const criteria: RuleCriteria = {
        maxPlayCount: 5,
        lastWatchedBefore: { value: 3, unit: 'months' },
        maxRating: 7.0,
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when one criterion fails with AND operator', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 10, // Exceeds maxPlayCount
        lastWatchedAt: new Date('2024-01-01'),
        rating: 5.0,
      }
      const criteria: RuleCriteria = {
        maxPlayCount: 5,
        lastWatchedBefore: { value: 3, unit: 'months' },
        maxRating: 7.0,
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should not match when multiple criteria fail with AND operator', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 10, // Exceeds maxPlayCount
        lastWatchedAt: new Date('2024-05-20'), // Recent (fails lastWatchedBefore)
        rating: 5.0,
      }
      const criteria: RuleCriteria = {
        maxPlayCount: 5,
        lastWatchedBefore: { value: 3, unit: 'months' },
        maxRating: 7.0,
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should default to AND operator when not specified', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 2,
        rating: 5.0,
      }
      const criteria: RuleCriteria = {
        maxPlayCount: 5,
        maxRating: 7.0,
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })
  })

  describe('operator logic - OR', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-01'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should match when all criteria are satisfied with OR operator', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 2,
        lastWatchedAt: new Date('2024-01-01'), // ~5 months ago
        rating: 5.0,
      }
      const criteria: RuleCriteria = {
        maxPlayCount: 5,
        lastWatchedBefore: { value: 3, unit: 'months' },
        maxRating: 7.0,
        operator: 'OR',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should match when at least one criterion is satisfied with OR operator', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 10, // Exceeds maxPlayCount
        lastWatchedAt: new Date('2024-01-01'), // ~5 months ago (satisfies lastWatchedBefore)
        rating: 9.0, // Exceeds maxRating
      }
      const criteria: RuleCriteria = {
        maxPlayCount: 5,
        lastWatchedBefore: { value: 3, unit: 'months' },
        maxRating: 7.0,
        operator: 'OR',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when no criteria are satisfied with OR operator', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 10, // Exceeds maxPlayCount
        lastWatchedAt: new Date('2024-05-20'), // Recent (fails lastWatchedBefore)
        rating: 9.0, // Exceeds maxRating
      }
      const criteria: RuleCriteria = {
        maxPlayCount: 5,
        lastWatchedBefore: { value: 3, unit: 'months' },
        maxRating: 7.0,
        operator: 'OR',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match when only first criterion is satisfied with OR operator', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 2, // Satisfies maxPlayCount
        lastWatchedAt: new Date('2024-05-20'), // Recent
        rating: 9.0, // Exceeds maxRating
      }
      const criteria: RuleCriteria = {
        maxPlayCount: 5,
        lastWatchedBefore: { value: 3, unit: 'months' },
        maxRating: 7.0,
        operator: 'OR',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })
  })

  describe('multiple criteria combinations', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-01'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should match complex AND criteria for old unwatched content', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 0,
        addedAt: new Date('2022-01-01'), // ~2.4 years ago
        libraryId: 'movies',
        rating: 5.0,
      }
      const criteria: RuleCriteria = {
        neverWatched: true,
        addedBefore: { value: 2, unit: 'years' },
        libraryIds: ['movies', 'tv-shows'],
        maxRating: 6.0,
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should match complex OR criteria for quality or size', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        fileSize: BigInt(1024 * 1024 * 1024 * 10), // 10GB
        quality: '1080p',
      }
      const criteria: RuleCriteria = {
        minFileSize: { value: 5, unit: 'GB' },
        maxQuality: '720p',
        operator: 'OR',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should not match when complex AND criteria has one failure', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 0,
        addedAt: new Date('2022-01-01'),
        libraryId: 'music', // Not in allowed libraries
        rating: 5.0,
      }
      const criteria: RuleCriteria = {
        neverWatched: true,
        addedBefore: { value: 2, unit: 'years' },
        libraryIds: ['movies', 'tv-shows'],
        maxRating: 6.0,
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should match criteria combining temporal and tag filters', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        lastWatchedAt: new Date('2023-01-01'), // ~1.4 years ago
        labels: ['anime', 'action'],
      }
      const criteria: RuleCriteria = {
        lastWatchedBefore: { value: 1, unit: 'years' },
        tags: ['anime'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should handle all criteria types together with AND', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 1,
        lastWatchedAt: new Date('2023-01-01'),
        addedAt: new Date('2022-01-01'),
        fileSize: BigInt(1024 * 1024 * 1024 * 8),
        resolution: '1080p',
        rating: 6.0,
        libraryId: 'movies',
        labels: ['action'],
      }
      const criteria: RuleCriteria = {
        neverWatched: false,
        maxPlayCount: 2,
        lastWatchedBefore: { value: 1, unit: 'years' },
        addedBefore: { value: 1, unit: 'years' },
        minFileSize: { value: 5, unit: 'GB' },
        maxQuality: '720p',
        maxRating: 7.0,
        libraryIds: ['movies'],
        tags: ['action', 'drama'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should handle all criteria types together with OR', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 10, // Fails maxPlayCount
        lastWatchedAt: new Date('2024-05-20'), // Fails lastWatchedBefore
        addedAt: new Date('2024-05-01'), // Fails addedBefore
        fileSize: BigInt(1024 * 1024 * 100), // Fails minFileSize
        resolution: '720p', // Fails maxQuality (alphabetically > '1080p')
        rating: 9.0, // Fails maxRating
        libraryId: 'music', // Fails libraryIds
        labels: ['action'], // Satisfies tags
      }
      const criteria: RuleCriteria = {
        neverWatched: true,
        maxPlayCount: 2,
        lastWatchedBefore: { value: 1, unit: 'years' },
        addedBefore: { value: 1, unit: 'years' },
        minFileSize: { value: 5, unit: 'GB' },
        maxQuality: '1080p',
        maxRating: 7.0,
        libraryIds: ['movies'],
        tags: ['action'],
        operator: 'OR',
      }

      // Should match because tags criterion is satisfied
      expect(evaluateRule(item, criteria)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should return false when no criteria are provided', () => {
      const item: MediaItem = { ...baseMediaItem }
      const criteria: RuleCriteria = { operator: 'AND' }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should handle item with all null optional fields', () => {
      const item: MediaItem = {
        plexRatingKey: '12345',
        title: 'Test Movie',
        playCount: 0,
        lastWatchedAt: null,
        addedAt: null,
        fileSize: null,
        quality: null,
        rating: null,
      }
      const criteria: RuleCriteria = {
        neverWatched: true,
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should handle item with all undefined optional fields', () => {
      const item: MediaItem = {
        plexRatingKey: '12345',
        title: 'Test Movie',
        playCount: 0,
      }
      const criteria: RuleCriteria = {
        neverWatched: true,
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should fail safely when null values are checked against non-existence criteria', () => {
      const item: MediaItem = {
        plexRatingKey: '12345',
        title: 'Test Movie',
        playCount: 0,
        fileSize: null,
        quality: null,
        rating: null,
        libraryId: undefined,
      }
      const criteria: RuleCriteria = {
        minFileSize: { value: 1, unit: 'GB' },
        maxQuality: '1080p',
        maxRating: 7.0,
        libraryIds: ['movies'],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should handle very large file sizes', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        fileSize: BigInt('999999999999999999'), // Very large number
      }
      const criteria: RuleCriteria = {
        minFileSize: { value: 1, unit: 'TB' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should handle playCount of 0 with various criteria', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 0,
      }
      const criteria: RuleCriteria = {
        maxPlayCount: 0,
        neverWatched: true,
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should handle boundary values for rating', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        rating: 0,
      }
      const criteria: RuleCriteria = {
        maxRating: 0,
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should handle dates at exact threshold boundary', () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-01T00:00:00Z'))

      const item: MediaItem = {
        ...baseMediaItem,
        lastWatchedAt: new Date('2024-05-02T00:00:00Z'), // Exactly 30 days ago
      }
      const criteria: RuleCriteria = {
        lastWatchedBefore: { value: 30, unit: 'days' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)

      jest.useRealTimers()
    })

    it('should handle empty tags array in both item and criteria', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        labels: [],
      }
      const criteria: RuleCriteria = {
        tags: [],
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(false)
    })

    it('should handle single criterion with OR operator', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 3,
      }
      const criteria: RuleCriteria = {
        maxPlayCount: 5,
        operator: 'OR',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })

    it('should handle neverWatched with null lastWatchedAt', () => {
      const item: MediaItem = {
        ...baseMediaItem,
        playCount: 0,
        lastWatchedAt: null,
      }
      const criteria: RuleCriteria = {
        neverWatched: true,
        lastWatchedBefore: { value: 30, unit: 'days' },
        operator: 'AND',
      }

      expect(evaluateRule(item, criteria)).toBe(true)
    })
  })
})
