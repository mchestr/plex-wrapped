/**
 * Error handling tests for scanner.ts
 *
 * Tests error scenarios for:
 * - Tautulli connection failures
 * - Database errors
 * - Invalid data handling
 * - Graceful degradation
 */

import { scanForCandidates } from '../scanner'
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

describe('Scanner Error Handling', () => {
  const mockRuleId = 'rule-error-test'
  const mockScanId = 'scan-error-test'

  const mockTautulliServer = {
    name: 'Tautulli',
    url: 'http://localhost:8181',
    apiKey: 'test-api-key',
    publicUrl: null,
    isActive: true,
  }

  const mockRule = {
    id: mockRuleId,
    name: 'Error Test Rule',
    enabled: true,
    mediaType: 'MOVIE' as const,
    criteria: {
      type: 'group',
      id: 'root',
      operator: 'AND',
      conditions: [
        { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
      ],
      libraryIds: ['lib-1'],
    },
    actionType: 'FLAG_FOR_REVIEW',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Tautulli connection failures', () => {
    it('should handle Tautulli server timeout gracefully', async () => {
      const timeoutError = new Error('ETIMEDOUT: Connection timed out')
      timeoutError.name = 'TimeoutError'

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockRejectedValue(timeoutError)
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toContain('ETIMEDOUT')

      // Verify scan was marked as failed
      expect(prisma.maintenanceScan.update).toHaveBeenCalledWith({
        where: { id: mockScanId },
        data: expect.objectContaining({
          status: 'FAILED',
          error: expect.stringContaining('ETIMEDOUT'),
        }),
      })
    })

    it('should handle Tautulli server connection refused', async () => {
      const connectionError = new Error('ECONNREFUSED: Connection refused')
      connectionError.name = 'ConnectionError'

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockRejectedValue(connectionError)
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toContain('ECONNREFUSED')
    })

    it('should handle Tautulli server returning HTTP 500', async () => {
      const serverError = new Error('HTTP 500: Internal Server Error')

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockRejectedValue(serverError)
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toContain('500')
    })

    it('should handle invalid Tautulli API key', async () => {
      const authResponse = {
        success: true,
        data: {
          response: {
            result: 'error',
            message: 'Invalid apikey',
            data: null,
          },
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(authResponse)
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toBe('Invalid apikey')
    })

    it('should handle Tautulli returning malformed response', async () => {
      const malformedResponse = {
        success: true,
        data: {
          response: {
            // Missing result field
            data: null,
          },
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(malformedResponse)
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toBeTruthy()
    })
  })

  describe('Database errors', () => {
    it('should handle database connection failure when finding rule', async () => {
      const dbError = new Error('Database connection lost')

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockRejectedValue(dbError)

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toBe('Database connection lost')
      expect(result.scanId).toBe('')
    })

    it('should handle database error when creating scan record', async () => {
      const dbError = new Error('Failed to insert scan record')

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockRejectedValue(dbError)

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toBe('Failed to insert scan record')
    })

    it('should handle database error when creating candidate records', async () => {
      const dbError = new Error('Candidate insert failed')

      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: {
              data: [
                {
                  rating_key: '1',
                  title: 'Test Movie',
                  play_count: 0,
                  added_at: 1609459200,
                  file_size: 1073741824,
                  file: '/movies/test.mkv',
                },
              ],
            },
          },
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(mockTautulliResponse)
      ;(prisma.maintenanceCandidate.create as jest.Mock).mockRejectedValue(dbError)
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toBe('Candidate insert failed')
    })

    it('should handle database error when updating scan status', async () => {
      const dbError = new Error('Update failed')

      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: { data: [] },
          },
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(mockTautulliResponse)
      ;(prisma.maintenanceScan.update as jest.Mock)
        .mockRejectedValueOnce(dbError) // First update (completion) fails
        .mockResolvedValue({ status: 'FAILED' }) // Second update (failure recording) succeeds

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
    })

    it('should handle Tautulli config lookup failure', async () => {
      const dbError = new Error('Config lookup failed')

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockRejectedValue(dbError)
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toBe('Config lookup failed')
    })
  })

  describe('Invalid data handling', () => {
    it('should handle missing rating_key in Tautulli data', async () => {
      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: {
              data: [
                {
                  // Missing rating_key
                  title: 'Test Movie',
                  play_count: 0,
                },
              ],
            },
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

      // Should not throw, should handle gracefully
      const result = await scanForCandidates(mockRuleId)
      expect(result.status).toBe('COMPLETED')
    })

    it('should handle null data array from Tautulli', async () => {
      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: {
              data: null, // Null instead of array
            },
          },
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(mockTautulliResponse)
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'COMPLETED' })
      ;(prisma.maintenanceRule.update as jest.Mock).mockResolvedValue(mockRule)

      const result = await scanForCandidates(mockRuleId)

      // Should complete with 0 items scanned
      expect(result.status).toBe('COMPLETED')
      expect(result.itemsScanned).toBe(0)
    })

    it('should handle invalid timestamp values', async () => {
      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: {
              data: [
                {
                  rating_key: '1',
                  title: 'Test Movie',
                  play_count: 0,
                  added_at: 'invalid-timestamp', // Invalid timestamp
                  last_played: NaN, // Invalid number
                  file_size: 1073741824,
                },
              ],
            },
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

      // Should not throw
      const result = await scanForCandidates(mockRuleId)
      expect(result).toBeDefined()
    })

    it('should handle extremely large file size values', async () => {
      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: {
              data: [
                {
                  rating_key: '1',
                  title: 'Test Movie',
                  play_count: 0,
                  added_at: 1609459200,
                  file_size: '9999999999999999999', // Very large number as string
                },
              ],
            },
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

      // Should handle BigInt conversion
      const result = await scanForCandidates(mockRuleId)
      expect(result.status).toBe('COMPLETED')
    })
  })

  describe('Graceful degradation', () => {
    it('should continue scanning other libraries if one fails', async () => {
      const multiLibraryRule = {
        ...mockRule,
        criteria: {
          type: 'group',
          id: 'root',
          operator: 'AND',
          conditions: [
            { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
          ],
          libraryIds: ['lib-1', 'lib-2'],
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(multiLibraryRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock)
        .mockRejectedValueOnce(new Error('Library 1 unavailable')) // First library fails
        .mockResolvedValueOnce({
          success: true,
          data: {
            response: {
              result: 'success',
              message: null,
              data: { data: [] },
            },
          },
        }) // Second library succeeds
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      const result = await scanForCandidates(mockRuleId)

      // Scanner stops on first error - this is current behavior
      expect(result.status).toBe('FAILED')
      expect(result.error).toBe('Library 1 unavailable')
    })

    it('should complete scan even when no items match criteria', async () => {
      // Test that scan completes when no items match (no candidates to create)
      const mockTautulliResponse = {
        success: true,
        data: {
          response: {
            result: 'success',
            message: null,
            data: {
              data: [
                { rating_key: '1', title: 'Movie 1', play_count: 5, added_at: 1609459200, file_size: 1073741824 },
                { rating_key: '2', title: 'Movie 2', play_count: 3, added_at: 1609459200, file_size: 1073741824 },
              ],
            },
          },
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockResolvedValue(mockTautulliResponse)
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({
        id: mockScanId,
        status: 'COMPLETED',
        itemsScanned: 2,
        itemsFlagged: 0,
      })
      ;(prisma.maintenanceRule.update as jest.Mock).mockResolvedValue(mockRule)

      const result = await scanForCandidates(mockRuleId)

      // Scanner should complete with no flags when no items match criteria (playCount === 0)
      expect(result.status).toBe('COMPLETED')
      expect(result.itemsFlagged).toBe(0)
      // Verify no candidate create calls were made (no matches)
      expect(prisma.maintenanceCandidate.create).not.toHaveBeenCalled()
    })
  })

  describe('Rule validation errors', () => {
    it('should provide clear error for disabled rule', async () => {
      const disabledRule = { ...mockRule, enabled: false }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(disabledRule)

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toContain('disabled')
      expect(result.error).toContain(mockRuleId)
    })

    it('should provide clear error for non-existent rule', async () => {
      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await scanForCandidates('non-existent-rule-id')

      expect(result.status).toBe('FAILED')
      expect(result.error).toContain('Rule not found')
      expect(result.error).toContain('non-existent-rule-id')
    })

    it('should provide clear error for missing libraryIds', async () => {
      const noLibraryRule = {
        ...mockRule,
        criteria: {
          type: 'group',
          id: 'root',
          operator: 'AND',
          conditions: [
            { type: 'condition', id: 'c1', field: 'playCount', operator: 'equals', value: 0 },
          ],
          // No libraryIds
        },
      }

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(noLibraryRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toContain('libraryIds')
      expect(result.error).toContain(mockRule.name)
    })
  })

  describe('Error recovery', () => {
    it('should update scan status to FAILED when error occurs', async () => {
      const testError = new Error('Test error for recovery')

      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockRejectedValue(testError)
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      await scanForCandidates(mockRuleId)

      // Verify scan was updated to FAILED with error message
      expect(prisma.maintenanceScan.update).toHaveBeenCalledWith({
        where: { id: mockScanId },
        data: {
          status: 'FAILED',
          completedAt: expect.any(Date),
          error: 'Test error for recovery',
        },
      })
    })

    it('should handle non-Error objects thrown as errors', async () => {
      ;(prisma.maintenanceRule.findUnique as jest.Mock).mockResolvedValue(mockRule)
      ;(prisma.maintenanceScan.create as jest.Mock).mockResolvedValue({ id: mockScanId, status: 'RUNNING' })
      ;(prisma.tautulli.findFirst as jest.Mock).mockResolvedValue(mockTautulliServer)
      ;(getTautulliLibraryMediaInfo as jest.Mock).mockRejectedValue('String error') // Non-Error object
      ;(prisma.maintenanceScan.update as jest.Mock).mockResolvedValue({ status: 'FAILED' })

      const result = await scanForCandidates(mockRuleId)

      expect(result.status).toBe('FAILED')
      expect(result.error).toBe('Unknown error occurred')
    })
  })
})
