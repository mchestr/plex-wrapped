/**
 * Type definitions for Plex Wrapped data structure
 */

export interface WrappedStatistics {
  // User watch statistics
  totalWatchTime: {
    total: number // in minutes
    movies: number // in minutes
    shows: number // in minutes
  }
  moviesWatched: number
  showsWatched: number
  episodesWatched: number

  // Top content
  topMovies: Array<{
    title: string
    watchTime: number // in minutes
    playCount: number
    year?: number
    rating?: number
    ratingKey?: string
  }>
  topShows: Array<{
    title: string
    watchTime: number // in minutes
    playCount: number
    episodesWatched: number
    year?: number
    rating?: number
    ratingKey?: string
  }>

  // Leaderboard data
  leaderboards?: {
    // Leaderboard for top movies/shows
    topContent: {
      movies: Array<{
        title: string
        ratingKey?: string
        leaderboard: Array<{
          userId: string
          username: string
          friendlyName: string
          watchTime: number
          playCount: number
        }>
        userPosition?: number
        totalWatchers: number
      }>
      shows: Array<{
        title: string
        ratingKey?: string
        leaderboard: Array<{
          userId: string
          username: string
          friendlyName: string
          watchTime: number
          playCount: number
          episodesWatched: number
        }>
        userPosition?: number
        totalWatchers: number
      }>
    }
    // Overall watch time leaderboard
    watchTime: {
      leaderboard: Array<{
        userId: string
        username: string
        friendlyName: string
        totalWatchTime: number
        moviesWatchTime: number
        showsWatchTime: number
      }>
      userPosition?: number
      totalUsers: number
    }
  }

  // Server statistics
  serverStats?: {
    serverName: string // Name of the Plex server
    totalStorage: number // in bytes
    totalStorageFormatted: string // e.g., "2.5 TB"
    librarySize: {
      movies: number
      shows: number
      episodes: number
    }
  }

  // Overseerr statistics
  overseerrStats?: {
    totalRequests: number
    totalServerRequests: number
    approvedRequests: number
    pendingRequests: number
    topRequestedGenres: Array<{
      genre: string
      count: number
    }>
  }

  // Time-based statistics
  watchTimeByMonth?: Array<{
    month: number // 1-12
    monthName: string
    watchTime: number // in minutes
    topMovie?: {
      title: string
      watchTime: number
      playCount: number
      year?: number
      rating?: number
    }
    topShow?: {
      title: string
      watchTime: number
      playCount: number
      episodesWatched: number
      year?: number
      rating?: number
    }
  }>

  // Additional insights
  longestBinge?: {
    title: string
    duration: number // in minutes
    date: string
  }
  mostActiveDay?: {
    day: string
    watchTime: number // in minutes
  }
}

export interface WrappedSection {
  id: string
  type:
    | "hero"
    | "total-watch-time"
    | "movies-breakdown"
    | "shows-breakdown"
    | "top-movies"
    | "top-shows"
    | "server-stats"
    | "service-stats"
    | "overseerr-stats"
    | "insights"
    | "fun-facts"
  title: string
  subtitle?: string
  content: string // LLM-generated narrative text
  data?: any // Section-specific data
  animationDelay?: number // Delay before showing this section
}

export interface WrappedData {
  year: number
  userId: string
  userName: string
  generatedAt: string

  // Raw statistics
  statistics: WrappedStatistics

  // LLM-generated sections
  sections: WrappedSection[]

  // LLM-generated insights
  insights: {
    personality: string // e.g., "You're a true cinephile!"
    topGenre: string
    bingeWatcher: boolean
    discoveryScore: number // 0-100
    funFacts: string[]
  }

  // Shareable summary for social sharing
  summary?: string

  // Metadata
  metadata: {
    totalSections: number
    generationTime: number // in seconds
  }
}

