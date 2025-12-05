/**
 * Integration tests for the complete scan → evaluate → flag flow
 *
 * Tests the end-to-end maintenance scanning pipeline:
 * 1. Scanner fetches media from Tautulli
 * 2. Rule evaluator checks each item against criteria
 * 3. Matching items are flagged as maintenance candidates
 */

import { scanForCandidates } from '../scanner'
import { evaluateRule } from '../rule-evaluator'
import type { MediaItem } from '../rule-evaluator'
import { getTautulliLibraryMediaInfo } from '@/lib/connections/tautulli'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    maintenanceRule: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    maintenanceScan: {
      create: jest.fn(),
      update: jest.fn(),
    },
    maintenanceCandidate: {
      create: jest.fn(),
    },
    tautulli: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('@/lib/connections/tautulli', () => ({
  getTautulliLibraryMediaInfo: jest.fn(),
}))

jest.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}))

describe('Scan → Evaluate → Flag Integration', () => {
  const mockRuleId = 'rule-integration-test'
  const mockScanId = 'scan-integration-test'

  const mockTautulliServer = {
    name: 'Tautulli',
    url: 'http://localhost:8181',
    apiKey: 'test-api-key',
    publicUrl: null,
    isActive: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-06-01'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Rule evaluation integration with scanner', () => {
    it('should correctly evaluate and flag items matching never watched + old criteria', async () => {
      // Hierarchical criteria: never watched AND added more than 180 days ago
      // Note: libraryIds must be at top level of criteria for scanner to find libraries
      const criteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
          { type: 'condition', id: 'c2', field: 'addedAt', operator: 'olderThan', value: 180, valueUnit: 'days' },
        ],
        libraryIds: ['lib-1'], // Required at top level for scanner
      }

      const mockRule = {
        id: mockRuleId,
        name: 'Integration Test Rule',
        description: 'Test never watched + old items',
        enabled: true,
        mediaType: 'MOVIE' as const,
        criteria,
        actionType: 'FLAG_FOR_REVIEW',
      }

      const mockScan = {
        id: mockScanId,
        ruleId: mockRuleId,
        status: 'RUNNING',
        startedAt: new Date(),
      }

      // Mock Tautulli response with various movies
      const mockMovies = [
        {
          rating_key: '1',
          title: 'Old Unwatched Movie',
          year: 2020,
          play_count: 0, // Never watched
          last_played: null,
          added_at: 1609459200, // 2021-01-01 (more than 180 days ago)
          file_size: 1073741824,
          file: '/movies/old-unwatched.mkv',
          radarr_id: 100,
          tmdb_id: 200,
          thumb: '/poster1.jpg',
        },
        {
          rating_key: '2',
          title: 'Recently Added Unwatched',
          year: 2024,
          play_count: 0, // Never watched but recently added
          last_played: null,
          added_at: 1714521600, // 2024-05-01 (about 31 days ago)
          file_size: 2147483648,
          file: '/movies/recent-unwatched.mkv',
          radarr_id: 101,
          tmdb_id: 201,
          thumb: '/poster2.jpg',
        },
        {
          rating_key: '3',
          title: 'Old Watched Movie',
          year: 2020,
          play_count: 5, // Watched
          last_played: 1640995200,
          added_at: 1609459200, // 2021-01-01
          file_size: 3221225472,
          file: '/movies/old-watched.mkv',
          radarr_id: 102,
          tmdb_id: 202,
          thumb: '/poster3.jpg',
        },
      ]

      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: { data: mockMovies },
          },
        },
      }

      // Setup mocks
      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue(mockScan)
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(mockTautulliResponse)

      const createdCandidates: unknown[] = []
      ;(prisma.maintenanceCandidate.create as jest.Mock).mockImplementation((data) => {
        createdCandidates.push(data.data)
        return Promise.resolve({ id: `candidate-${createdCandidates.length}`, ...data.data })
      })

      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({
        ...mockScan,
        status: 'COMPLETED',
      })
      ;(prisma.maintenanceRule.update as jest.Mock).mockResolvedValue(mockRule)

      // Execute the scan
      const result = await scanForCandidates(mockRuleId)

      // Verify results
      expect(result.status).toBe('COMPLETED')
      expect(result.itemsScanned).toBe(3)
      expect(result.itemsFlagged).toBe(1)

      // Only the old unwatched movie should be flagged
      expect(createdCandidates).toHaveLength(1)
      expect(createdCandidates[0]).toMatchObject({
        title: 'Old Unwatched Movie',
        plexRatingKey: '1',
        playCount: 0,
        reviewStatus: 'PENDING',
      })
    })

    it('should correctly handle OR conditions in hierarchical criteria', async () => {
      // Hierarchical criteria: never watched OR year before 2015
      // (using fields that scanner actually maps)
      const criteria = {
        type: 'group',
        id: 'root',
        operator: 'OR',
        conditions: [
          { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
          { type: 'condition', id: 'c2', field: 'year', operator: 'lessThan', value: 2015 },
        ],
        libraryIds: ['lib-1'], // Required at top level for scanner
      }

      const mockRule = {
        id: mockRuleId,
        name: 'OR Condition Test Rule',
        enabled: true,
        mediaType: 'MOVIE' as const,
        criteria,
        actionType: 'FLAG_FOR_REVIEW',
      }

      const mockMovies = [
        {
          rating_key: '1',
          title: 'Unwatched New Movie',
          year: 2023,
          play_count: 0, // Matches: never watched
          added_at: 1609459200,
          file_size: 1073741824,
          file: '/movies/1.mkv',
        },
        {
          rating_key: '2',
          title: 'Watched Old Movie',
          year: 2010, // Matches: year < 2015
          play_count: 3,
          added_at: 1609459200,
          file_size: 1073741824,
          file: '/movies/2.mkv',
        },
        {
          rating_key: '3',
          title: 'Watched New Movie',
          year: 2023, // Does not match: watched AND year >= 2015
          play_count: 5,
          added_at: 1609459200,
          file_size: 1073741824,
          file: '/movies/3.mkv',
        },
      ]

      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: { data: mockMovies },
          },
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(mockTautulliResponse)

      const createdCandidates: unknown[] = []
      ;(prisma.maintenanceCandidate.create as jest.Mock).mockImplementation((data) => {
        createdCandidates.push(data.data)
        return Promise.resolve({ id: `candidate-${createdCandidates.length}`, ...data.data })
      })

      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'COMPLETED' })
      ;(prisma.maintenanceRule.update as jest.Mock).mockResolvedValue(mockRule)

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('COMPLETED')
      expect(result.itemsFlagged).toBe(2) // Unwatched + Low rating

      const flaggedTitles = createdCandidates.map((c: any) => c.title)
      expect(flaggedTitles).toContain('Unwatched New Movie')
      expect(flaggedTitles).toContain('Watched Old Movie')
      expect(flaggedTitles).not.toContain('Watched New Movie')
    })

    it('should correctly handle nested AND/OR groups', async () => {
      // Complex criteria: (never watched AND old) OR (low play count AND old year)
      // Using fields that scanner actually maps
      const criteria = {
        type: 'group',
        id: 'root',
        operator: 'OR',
        conditions: [
          {
            type: 'group',
            id: 'g1',
            operator: 'AND',
            conditions: [
              { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
              { type: 'condition', id: 'c2', field: 'addedAt', operator: 'olderThan', value: 365, valueUnit: 'days' },
            ],
          },
          {
            type: 'group',
            id: 'g2',
            operator: 'AND',
            conditions: [
              { type: 'condition', id: 'c3', field: 'playCount', operator: 'lessThanOrEqual', value: 2 },
              { type: 'condition', id: 'c4', field: 'year', operator: 'lessThan', value: 2010 },
            ],
          },
        ],
        libraryIds: ['lib-1'], // Required at top level for scanner
      }

      const mockRule = {
        id: mockRuleId,
        name: 'Nested Groups Test Rule',
        enabled: true,
        mediaType: 'MOVIE' as const,
        criteria,
        actionType: 'FLAG_FOR_REVIEW',
      }

      const mockMovies = [
        {
          rating_key: '1',
          title: 'Old Unwatched',
          year: 2020,
          play_count: 0,
          added_at: 1577836800, // 2020-01-01 (more than 365 days ago)
          file_size: 1073741824,
          file: '/movies/1.mkv',
        },
        {
          rating_key: '2',
          title: 'Low Plays Old Year',
          year: 2005, // year < 2010
          play_count: 1, // play_count <= 2
          added_at: 1714521600, // Recent
          file_size: 1073741824,
          file: '/movies/2.mkv',
        },
        {
          rating_key: '3',
          title: 'Many Plays Old Year',
          year: 2005,
          play_count: 10, // Fails: too many plays for second group
          added_at: 1714521600,
          file_size: 1073741824,
          file: '/movies/3.mkv',
        },
        {
          rating_key: '4',
          title: 'Low Plays New Year',
          year: 2023, // Fails: year too new for second group
          play_count: 1,
          added_at: 1714521600,
          file_size: 1073741824,
          file: '/movies/4.mkv',
        },
        {
          rating_key: '5',
          title: 'Recent Unwatched',
          year: 2023,
          play_count: 0,
          added_at: 1714521600, // Recent - fails first group (not old enough)
          file_size: 1073741824,
          file: '/movies/5.mkv',
        },
      ]

      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: { data: mockMovies },
          },
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(mockTautulliResponse)

      const createdCandidates: unknown[] = []
      ;(prisma.maintenanceCandidate.create as jest.Mock).mockImplementation((data) => {
        createdCandidates.push(data.data)
        return Promise.resolve({ id: `candidate-${createdCandidates.length}`, ...data.data })
      })

      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'COMPLETED' })
      ;(prisma.maintenanceRule.update as jest.Mock).mockResolvedValue(mockRule)

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('COMPLETED')
      expect(result.itemsFlagged).toBe(2)

      const flaggedTitles = createdCandidates.map((c: any) => c.title)
      expect(flaggedTitles).toContain('Old Unwatched') // Matches first group
      expect(flaggedTitles).toContain('Low Plays Old Year') // Matches second group
      expect(flaggedTitles).not.toContain('Many Plays Old Year') // Fails play count check
      expect(flaggedTitles).not.toContain('Low Plays New Year') // Fails year check
      expect(flaggedTitles).not.toContain('Recent Unwatched') // Fails old check
    })
  })

  describe('TV series evaluation integration', () => {
    it('should correctly evaluate TV series with never watched criteria', async () => {
      const criteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
        ],
        libraryIds: ['lib-tv-1'], // Required at top level for scanner
      }

      const mockRule = {
        id: mockRuleId,
        name: 'TV Series Test Rule',
        enabled: true,
        mediaType: 'TV_SERIES' as const,
        criteria,
        actionType: 'FLAG_FOR_REVIEW',
      }

      const mockSeries = [
        {
          rating_key: '10',
          title: 'Unwatched Series',
          year: 2020,
          play_count: 0,
          last_played: null,
          added_at: 1609459200,
          file_size: 10737418240,
          file: '/tv/unwatched-series',
          sonarr_id: 300,
          tvdb_id: 400,
          thumb: '/poster10.jpg',
        },
        {
          rating_key: '11',
          title: 'Watched Series',
          year: 2021,
          play_count: 20,
          last_played: 1640995200,
          added_at: 1609459200,
          file_size: 21474836480,
          file: '/tv/watched-series',
          sonarr_id: 301,
          tvdb_id: 401,
          thumb: '/poster11.jpg',
        },
      ]

      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: { data: mockSeries },
          },
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(mockTautulliResponse)

      const createdCandidates: unknown[] = []
      ;(prisma.maintenanceCandidate.create as jest.Mock).mockImplementation((data) => {
        createdCandidates.push(data.data)
        return Promise.resolve({ id: `candidate-${createdCandidates.length}`, ...data.data })
      })

      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'COMPLETED' })
      ;(prisma.maintenanceRule.update as jest.Mock).mockResolvedValue(mockRule)

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('COMPLETED')
      expect(result.itemsFlagged).toBe(1)

      expect(createdCandidates[0]).toMatchObject({
        title: 'Unwatched Series',
        mediaType: 'TV_SERIES',
        sonarrId: 300,
        tvdbId: 400,
      })
    })
  })

  describe('Progress callback integration', () => {
    it('should report progress during scan with hierarchical criteria', async () => {
      const criteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
        ],
        libraryIds: ['lib-1'], // Required at top level for scanner
      }

      const mockRule = {
        id: mockRuleId,
        name: 'Progress Test Rule',
        enabled: true,
        mediaType: 'MOVIE' as const,
        criteria,
        actionType: 'FLAG_FOR_REVIEW',
      }

      // Create 25 mock movies to trigger multiple progress updates
      const mockMovies = Array.from({ length: 25 }, (_, i) => ({
        rating_key: String(i + 1),
        title: `Movie ${i + 1}`,
        play_count: i % 3, // Some watched, some not
        added_at: 1609459200,
        file_size: 1073741824,
        file: `/movies/${i + 1}.mkv`,
      }))

      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: { data: mockMovies },
          },
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(mockTautulliResponse)
      ;(prisma.maintenanceCandidate.create as jest.Mock).mockResolvedValue({})
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'COMPLETED' })
      ;(prisma.maintenanceRule.update as jest.Mock).mockResolvedValue(mockRule)

      const progressUpdates: number[] = []
      const onProgress = jest.fn((percent: number) => {
        progressUpdates.push(percent)
      })

      await scanForCandidates(mockRuleId, onProgress)

      // Should have progress updates every 10 items
      expect(onProgress).toHaveBeenCalled()
      expect(progressUpdates.length).toBeGreaterThan(0)

      // Progress should be monotonically increasing
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1])
      }
    })
  })

  describe('Direct rule evaluator integration', () => {
    it('should correctly transform and evaluate Tautulli data format', () => {
      // Simulate the data transformation that happens in scanner
      const tautulliData = {
        rating_key: '1',
        title: 'Test Movie',
        year: 2020,
        play_count: 0,
        last_played: null,
        added_at: 1609459200, // Unix timestamp
        file_size: 1073741824,
        file: '/movies/test.mkv',
      }

      // Transform like scanner does
      const mediaItem: MediaItem = {
        plexRatingKey: String(tautulliData.rating_key),
        title: tautulliData.title,
        year: tautulliData.year,
        playCount: Number(tautulliData.play_count || 0),
        lastWatchedAt: tautulliData.last_played
          ? new Date(Number(tautulliData.last_played) * 1000)
          : null,
        addedAt: tautulliData.added_at
          ? new Date(Number(tautulliData.added_at) * 1000)
          : null,
        fileSize: tautulliData.file_size
          ? BigInt(tautulliData.file_size)
          : null,
        filePath: tautulliData.file || null,
      }

      const criteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
        ],
      }

      expect(evaluateRule(mediaItem, criteria)).toBe(true)
    })

    it('should handle null lastWatchedAt as never watched', () => {
      jest.setSystemTime(new Date('2024-06-01'))

      const mediaItem: MediaItem = {
        title: 'Never Watched Movie',
        playCount: 0,
        lastWatchedAt: null, // Never watched
      }

      const criteria: RuleCriteria = {
        type: 'group',
        id: 'root',
        operator: 'AND',
        conditions: [
          // olderThan should match null dates (never watched = infinitely old)
          { type: 'condition', id: 'c1', field: 'lastWatchedAt', operator: 'olderThan', value: 30, valueUnit: 'days' },
        ],
      }

      expect(evaluateRule(mediaItem, criteria)).toBe(true)
    })
  })
})
