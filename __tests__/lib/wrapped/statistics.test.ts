/**
 * Tests for lib/wrapped/statistics.ts - statistics fetching functions
 * Focuses on key functions and edge cases
 */

import {
  fetchTautulliStatistics,
  fetchPlexServerStatistics,
  fetchOverseerrStatistics,
  fetchTopContentLeaderboards,
  fetchWatchTimeLeaderboard,
  formatBytes,
} from '@/lib/wrapped/statistics'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Statistics Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset fetch mock to default implementation
    mockFetch.mockReset()
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1024 * 1024)).toBe('1 MB')
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB')
    })

    it('should handle large values', () => {
      expect(formatBytes(1024 * 1024 * 1024 * 100)).toContain('GB')
    })

    it('should round to 2 decimal places', () => {
      const result = formatBytes(1536) // 1.5 KB
      expect(result).toContain('1.5')
    })
  })

  describe('fetchTautulliStatistics', () => {
    const config = {
      hostname: 'tautulli.example.com',
      port: 8181,
      protocol: 'https',
      apiKey: 'test-key',
    }

    const mockUsersResponse = {
      response: {
        result: 'success',
        data: [
          {
            user_id: '123',
            username: 'testuser',
            email: 'test@example.com',
            friendly_name: 'Test User',
          },
        ],
      },
    }

    it('should fetch statistics successfully', async () => {
      const mockHistoryResponse = {
        response: {
          result: 'success',
          data: {
            recordsTotal: 1,
            data: [
              {
                date: Math.floor(new Date('2024-06-15').getTime() / 1000),
                media_type: 'movie',
                title: 'Test Movie',
                duration: 3600, // 60 minutes in seconds
                viewed_duration: 3600,
                year: 2020,
              },
            ],
          },
        },
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistoryResponse,
        } as Response)

      const result = await fetchTautulliStatistics(
        config,
        'plex-user-123',
        'test@example.com',
        2024
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.totalWatchTime).toBe(60) // minutes
      expect(result.data?.moviesWatched).toBe(1)
    })

    it('should return error when user not found', async () => {
      const mockUsersResponseNoMatch = {
        response: {
          result: 'success',
          data: [
            {
              user_id: '999',
              username: 'otheruser',
              email: 'other@example.com',
            },
          ],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersResponseNoMatch,
      } as Response)

      const result = await fetchTautulliStatistics(
        config,
        'plex-user-123',
        'test@example.com',
        2024
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('User not found')
    })

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          result: 'error',
          message: 'Invalid API key',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => errorResponse,
      } as Response)

      const result = await fetchTautulliStatistics(
        config,
        'plex-user-123',
        'test@example.com',
        2024
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid API key')
    })

    it('should filter history by date range', async () => {
      const currentYear = new Date().getFullYear()
      const year = currentYear - 1 // Past year

      const mockHistoryResponse = {
        response: {
          result: 'success',
          data: {
            recordsTotal: 2,
            data: [
              {
                date: Math.floor(new Date(`${year}-06-15`).getTime() / 1000),
                media_type: 'movie',
                title: 'Movie 1',
                duration: 3600,
                viewed_duration: 3600,
              },
              {
                date: Math.floor(new Date(`${year - 1}-06-15`).getTime() / 1000), // Previous year
                media_type: 'movie',
                title: 'Movie 2',
                duration: 3600,
                viewed_duration: 3600,
              },
            ],
          },
        },
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistoryResponse,
        } as Response)

      const result = await fetchTautulliStatistics(
        config,
        'plex-user-123',
        'test@example.com',
        year
      )

      expect(result.success).toBe(true)
      expect(result.data?.moviesWatched).toBe(1) // Only one movie from the correct year
    })

    it('should handle episodes correctly', async () => {
      const mockHistoryResponse = {
        response: {
          result: 'success',
          data: {
            recordsTotal: 1,
            data: [
              {
                date: Math.floor(new Date('2024-06-15').getTime() / 1000),
                media_type: 'episode',
                grandparent_title: 'Test Show',
                title: 'Episode 1',
                duration: 1800, // 30 minutes
                viewed_duration: 1800,
                year: 2020,
              },
            ],
          },
        },
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistoryResponse,
        } as Response)

      const result = await fetchTautulliStatistics(
        config,
        'plex-user-123',
        'test@example.com',
        2024
      )

      expect(result.success).toBe(true)
      expect(result.data?.showsWatched).toBe(1)
      expect(result.data?.episodesWatched).toBe(1)
      expect(result.data?.showsWatchTime).toBe(30)
    })
  })

  describe('fetchPlexServerStatistics', () => {
    const plexConfig = {
      hostname: 'plex.example.com',
      port: 32400,
      protocol: 'https',
      token: 'plex-token',
    }

    const tautulliConfig = {
      hostname: 'tautulli.example.com',
      port: 8181,
      protocol: 'https',
      apiKey: 'test-key',
    }

    it('should fetch server statistics successfully', async () => {
      const mockSectionsResponse = {
        MediaContainer: {
          Directory: [
            {
              key: '1',
              title: 'Movies',
              type: 'movie',
            },
            {
              key: '2',
              title: 'TV Shows',
              type: 'show',
            },
          ],
        },
      }

      const mockMoviesResponse = {
        MediaContainer: {
          Metadata: [
            {
              Media: [
                {
                  Part: [{ size: '1073741824' }], // 1 GB
                },
              ],
            },
          ],
          totalSize: 1,
        },
      }

      const mockShowsResponse = {
        MediaContainer: {
          Metadata: [
            {
              Media: [
                {
                  Part: [{ size: '536870912' }], // 0.5 GB
                },
              ],
            },
          ],
          totalSize: 1,
        },
      }

      const mockEpisodesResponse = {
        MediaContainer: {
          Metadata: [
            {
              Media: [
                {
                  Part: [{ size: '536870912' }], // 0.5 GB
                },
              ],
            },
          ],
        },
      }

      const mockTautulliLibrariesResponse = {
        response: {
          result: 'success',
          data: [
            {
              section_type: 'movie',
              count: '1',
              child_count: '0',
            },
            {
              section_type: 'show',
              count: '1',
              child_count: '2',
            },
          ],
        },
      }

      // Mock calls: sections, movies section, shows section, episodes, tautulli libraries
      // Note: fetchPlexServerStatisticsFromPlex and fetchTautulliLibraryCounts run in parallel,
      // so we need to mock all calls. The order might vary, so we use mockImplementation
      // to match URLs or provide enough mocks for all calls
      let callCount = 0
      mockFetch.mockImplementation((url: string | Request | URL) => {
        callCount++
        const urlStr = typeof url === 'string' ? url : url.toString()

        // Tautulli library call
        if (urlStr.includes('get_libraries')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockTautulliLibrariesResponse,
          } as Response)
        }

        // Plex sections call
        if (urlStr.includes('/library/sections?') && !urlStr.includes('/all')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockSectionsResponse,
          } as Response)
        }

        // Plex movies section call
        if (urlStr.includes('/library/sections/1/all') && !urlStr.includes('type=4')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMoviesResponse,
          } as Response)
        }

        // Plex shows section call
        if (urlStr.includes('/library/sections/2/all') && !urlStr.includes('type=4')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockShowsResponse,
          } as Response)
        }

        // Plex episodes call
        if (urlStr.includes('type=4')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockEpisodesResponse,
          } as Response)
        }

        // Default fallback
        return Promise.resolve({
          ok: false,
          statusText: 'Not mocked',
        } as Response)
      })

      const result = await fetchPlexServerStatistics(plexConfig, tautulliConfig)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.librarySize.movies).toBe(1)
      expect(result.data?.librarySize.shows).toBe(1)
      expect(result.data?.librarySize.episodes).toBe(2)
    })

    it('should handle Plex API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      } as Response)

      const result = await fetchPlexServerStatistics(plexConfig, tautulliConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('fetchOverseerrStatistics', () => {
    const config = {
      hostname: 'overseerr.example.com',
      port: 5055,
      protocol: 'https',
      apiKey: 'test-key',
    }

    it('should fetch Overseerr statistics successfully', async () => {
      const mockUsersResponse = {
        results: [
          {
            id: 1,
            email: 'test@example.com',
          },
        ],
      }

      const mockRequestsResponse = {
        results: [
          {
            id: 1,
            requestedBy: { id: 1, email: 'test@example.com' },
            createdAt: '2024-06-15T00:00:00Z',
            status: 2, // Approved
            media: {
              genres: [{ name: 'Action' }, { name: 'Drama' }],
            },
          },
          {
            id: 2,
            requestedBy: { id: 1, email: 'test@example.com' },
            createdAt: '2024-07-15T00:00:00Z',
            status: 1, // Pending
            media: {
              genres: [{ name: 'Action' }],
            },
          },
        ],
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRequestsResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        } as Response)

      const result = await fetchOverseerrStatistics(
        config,
        'test@example.com',
        2024
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.totalRequests).toBe(2)
      expect(result.data?.approvedRequests).toBe(1)
      expect(result.data?.pendingRequests).toBe(1)
      expect(result.data?.topRequestedGenres).toHaveLength(2)
      expect(result.data?.topRequestedGenres[0].genre).toBe('Action')
    })

    it('should handle user not found', async () => {
      const mockUsersResponse = {
        results: [],
      }

      const mockRequestsResponse = {
        results: [],
        pageInfo: {
          pages: 1,
          pageSize: 100,
          results: 0,
        },
      }

      // Mock both users and requests calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRequestsResponse,
        } as Response)

      const result = await fetchOverseerrStatistics(
        config,
        'test@example.com',
        2024
      )

      expect(result.success).toBe(true)
      expect(result.data?.totalRequests).toBe(0)
    })

    it('should filter requests by year', async () => {
      const mockUsersResponse = {
        results: [{ id: 1, email: 'test@example.com' }],
      }

      const mockRequestsResponse = {
        results: [
          {
            id: 1,
            requestedBy: { id: 1 },
            createdAt: '2024-06-15T00:00:00Z',
            status: 2,
            media: { genres: [] },
          },
          {
            id: 2,
            requestedBy: { id: 1 },
            createdAt: '2023-06-15T00:00:00Z', // Previous year
            status: 2,
            media: { genres: [] },
          },
        ],
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRequestsResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        } as Response)

      const result = await fetchOverseerrStatistics(
        config,
        'test@example.com',
        2024
      )

      expect(result.success).toBe(true)
      expect(result.data?.totalRequests).toBe(1) // Only 2024 request
    })
  })

  describe('fetchWatchTimeLeaderboard', () => {
    const config = {
      hostname: 'tautulli.example.com',
      port: 8181,
      protocol: 'https',
      apiKey: 'test-key',
    }

    it('should fetch watch time leaderboard successfully', async () => {
      const mockResponse = {
        response: {
          result: 'success',
          data: [
            {
              stat_id: 'top_users',
              rows: [
                {
                  user_id: '123',
                  user: 'user1',
                  friendly_name: 'User 1',
                  total_duration: 3600, // 60 minutes in seconds
                  movies_duration: 1800,
                  shows_duration: 1800,
                },
                {
                  user_id: '456',
                  user: 'user2',
                  friendly_name: 'User 2',
                  total_duration: 1800, // 30 minutes
                  movies_duration: 900,
                  shows_duration: 900,
                },
              ],
            },
          ],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await fetchWatchTimeLeaderboard(config, 2024)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0].totalWatchTime).toBe(60)
      expect(result.data?.[0].userId).toBe('123')
      expect(result.data?.[1].totalWatchTime).toBe(30)
    })

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          result: 'error',
          message: 'API error',
        },
      }

      // Reset any previous mockImplementation
      mockFetch.mockReset()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => errorResponse,
      } as Response)

      const result = await fetchWatchTimeLeaderboard(config, 2024)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      // The function returns the error message from response.message or a default message
      expect(result.error).toMatch(/API error|Tautulli API error/)
    })
  })

  describe('fetchTopContentLeaderboards', () => {
    const config = {
      hostname: 'tautulli.example.com',
      port: 8181,
      protocol: 'https',
      apiKey: 'test-key',
    }

    it('should fetch leaderboards for top content', async () => {
      const mockMovie1Leaderboard = {
        response: {
          result: 'success',
          data: [
            {
              user_id: '123',
              username: 'user1',
              friendly_name: 'User 1',
              total_duration: 3600,
              plays: 2,
            },
            {
              user_id: '456',
              username: 'user2',
              friendly_name: 'User 2',
              total_duration: 1800,
              plays: 1,
            },
          ],
        },
      }

      const mockMovie2Leaderboard = {
        response: {
          result: 'success',
          data: [
            {
              user_id: '123',
              username: 'user1',
              friendly_name: 'User 1',
              total_duration: 3600,
              plays: 2,
            },
            {
              user_id: '456',
              username: 'user2',
              friendly_name: 'User 2',
              total_duration: 1800,
              plays: 1,
            },
          ],
        },
      }

      const mockShowLeaderboard = {
        response: {
          result: 'success',
          data: [
            {
              user_id: '123',
              username: 'user1',
              friendly_name: 'User 1',
              total_duration: 7200,
              plays: 5,
            },
          ],
        },
      }

      // Mock 3 calls: Movie 1, Movie 2, Show 1
      // Reset mock first to clear any previous implementation
      mockFetch.mockReset()
      // Use mockImplementation to handle calls in any order
      mockFetch.mockImplementation((url: string | Request | URL) => {
        const urlStr = typeof url === 'string' ? url : url.toString()

        // Movie 1 (ratingKey 12345)
        if (urlStr.includes('rating_key=12345') || urlStr.includes('12345')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMovie1Leaderboard,
          } as Response)
        }

        // Movie 2 (ratingKey 12346)
        if (urlStr.includes('rating_key=12346') || urlStr.includes('12346')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockMovie2Leaderboard,
          } as Response)
        }

        // Show 1 (ratingKey 67890)
        if (urlStr.includes('rating_key=67890') || urlStr.includes('67890')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockShowLeaderboard,
          } as Response)
        }

        // Default fallback - log for debugging
        console.warn('Unmatched URL in fetchTopContentLeaderboards test:', urlStr)
        return Promise.resolve({
          ok: false,
          statusText: 'Not mocked',
        } as Response)
      })

      const topMovies = [
        { title: 'Movie 1', ratingKey: '12345' },
        { title: 'Movie 2', ratingKey: '12346' },
      ]

      const topShows = [
        { title: 'Show 1', ratingKey: '67890' },
      ]

      const result = await fetchTopContentLeaderboards(
        config,
        topMovies,
        topShows,
        '123',
        2024
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.movies).toHaveLength(2)
      expect(result.data?.shows).toHaveLength(1)
      expect(result.data?.movies[0].userPosition).toBe(1) // User 123 is first
    })

    it('should skip items without ratingKey', async () => {
      const topMovies = [
        { title: 'Movie 1', ratingKey: undefined },
      ]

      const topShows = []

      const result = await fetchTopContentLeaderboards(
        config,
        topMovies,
        topShows,
        '123',
        2024
      )

      expect(result.success).toBe(true)
      expect(result.data?.movies).toHaveLength(0)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})

