/**
 * Field Registry for Maintenance Rules
 *
 * Centralized definition of all available fields from Plex, Tautulli, Radarr, and Sonarr
 * with metadata for UI generation, validation, and evaluation.
 */

import { MediaType } from "@/lib/validations/maintenance"

// Field type definitions
export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'array' | 'enum'
export type DataSource = 'plex' | 'tautulli' | 'radarr' | 'sonarr'

// Comparison operators by field type
export type StringOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'regex' | 'in' | 'notIn'
export type NumberOperator = 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between'
export type DateOperator = 'before' | 'after' | 'between' | 'olderThan' | 'newerThan' | 'null' | 'notNull'
export type BooleanOperator = 'equals' | 'notEquals'
export type ArrayOperator = 'contains' | 'notContains' | 'containsAny' | 'containsAll' | 'isEmpty' | 'isNotEmpty'

export type ComparisonOperator = StringOperator | NumberOperator | DateOperator | BooleanOperator | ArrayOperator

// Field metadata for UI generation and validation
export interface FieldDefinition {
  key: string
  label: string
  description?: string
  type: FieldType
  dataSource: DataSource
  mediaTypes: MediaType[] // MOVIE, TV_SERIES, EPISODE
  allowedOperators: ComparisonOperator[]
  enumValues?: Array<{ value: string; label: string }> // For enum types
  unit?: 'bytes' | 'seconds' | 'minutes' | 'hours' | 'days' | 'kbps' // For display/conversion
  category: 'metadata' | 'playback' | 'file' | 'quality' | 'external' // For UI grouping
}

// Comprehensive field registry
export const FIELD_DEFINITIONS: FieldDefinition[] = [
  // === METADATA CATEGORY ===
  {
    key: 'title',
    label: 'Title',
    type: 'string',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'notEquals', 'contains', 'notContains', 'startsWith', 'regex'],
    category: 'metadata',
  },
  {
    key: 'year',
    label: 'Year',
    type: 'number',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'],
    category: 'metadata',
  },
  {
    key: 'rating',
    label: 'Rating (User)',
    description: 'Plex user rating (0-10)',
    type: 'number',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'null', 'notNull'],
    category: 'metadata',
  },
  {
    key: 'audienceRating',
    label: 'Audience Rating',
    description: 'TMDB/IMDB audience rating',
    type: 'number',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'null', 'notNull'],
    category: 'metadata',
  },
  {
    key: 'contentRating',
    label: 'Content Rating',
    description: 'Age rating (PG, PG-13, R, etc.)',
    type: 'string',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'notEquals', 'in', 'notIn'],
    category: 'metadata',
  },
  {
    key: 'genres',
    label: 'Genres',
    type: 'array',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['contains', 'notContains', 'containsAny', 'containsAll', 'isEmpty'],
    category: 'metadata',
  },
  {
    key: 'labels',
    label: 'Labels/Tags',
    type: 'array',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['contains', 'notContains', 'containsAny', 'containsAll', 'isEmpty'],
    category: 'metadata',
  },
  {
    key: 'libraryId',
    label: 'Library',
    type: 'string',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'notEquals', 'in', 'notIn'],
    category: 'metadata',
  },

  // === PLAYBACK CATEGORY ===
  {
    key: 'playCount',
    label: 'Play Count',
    type: 'number',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'],
    category: 'playback',
  },
  {
    key: 'neverWatched',
    label: 'Never Watched',
    description: 'Media that has never been played',
    type: 'boolean',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals'],
    category: 'playback',
  },
  {
    key: 'lastWatchedAt',
    label: 'Last Watched Date',
    type: 'date',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['before', 'after', 'between', 'olderThan', 'newerThan', 'null', 'notNull'],
    unit: 'days',
    category: 'playback',
  },
  {
    key: 'addedAt',
    label: 'Date Added',
    type: 'date',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['before', 'after', 'between', 'olderThan', 'newerThan'],
    unit: 'days',
    category: 'playback',
  },

  // === FILE CATEGORY ===
  {
    key: 'fileSize',
    label: 'File Size',
    type: 'number',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'],
    unit: 'bytes',
    category: 'file',
  },
  {
    key: 'filePath',
    label: 'File Path',
    type: 'string',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['contains', 'notContains', 'startsWith', 'regex'],
    category: 'file',
  },
  {
    key: 'duration',
    label: 'Duration',
    type: 'number',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'],
    unit: 'minutes',
    category: 'file',
  },

  // === QUALITY CATEGORY ===
  {
    key: 'resolution',
    label: 'Resolution',
    type: 'enum',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'notEquals', 'in', 'notIn'],
    enumValues: [
      { value: '4k', label: '4K' },
      { value: '1080', label: '1080p' },
      { value: '720', label: '720p' },
      { value: 'sd', label: 'SD' },
    ],
    category: 'quality',
  },
  {
    key: 'videoCodec',
    label: 'Video Codec',
    type: 'enum',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'notEquals', 'in', 'notIn'],
    enumValues: [
      { value: 'h264', label: 'H.264' },
      { value: 'hevc', label: 'HEVC/H.265' },
      { value: 'av1', label: 'AV1' },
      { value: 'mpeg4', label: 'MPEG-4' },
      { value: 'mpeg2video', label: 'MPEG-2' },
    ],
    category: 'quality',
  },
  {
    key: 'audioCodec',
    label: 'Audio Codec',
    type: 'enum',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'notEquals', 'in', 'notIn'],
    enumValues: [
      { value: 'aac', label: 'AAC' },
      { value: 'ac3', label: 'AC3' },
      { value: 'eac3', label: 'E-AC3' },
      { value: 'dts', label: 'DTS' },
      { value: 'truehd', label: 'TrueHD' },
      { value: 'flac', label: 'FLAC' },
      { value: 'mp3', label: 'MP3' },
    ],
    category: 'quality',
  },
  {
    key: 'container',
    label: 'Container Format',
    type: 'enum',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['equals', 'notEquals', 'in', 'notIn'],
    enumValues: [
      { value: 'mkv', label: 'MKV' },
      { value: 'mp4', label: 'MP4' },
      { value: 'avi', label: 'AVI' },
      { value: 'mov', label: 'MOV' },
      { value: 'wmv', label: 'WMV' },
    ],
    category: 'quality',
  },
  {
    key: 'bitrate',
    label: 'Bitrate',
    type: 'number',
    dataSource: 'tautulli',
    mediaTypes: ['MOVIE', 'TV_SERIES'],
    allowedOperators: ['greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'],
    unit: 'kbps',
    category: 'quality',
  },

  // === RADARR FIELDS (Movies only) ===
  {
    key: 'radarr.hasFile',
    label: 'Has File (Radarr)',
    type: 'boolean',
    dataSource: 'radarr',
    mediaTypes: ['MOVIE'],
    allowedOperators: ['equals'],
    category: 'external',
  },
  {
    key: 'radarr.monitored',
    label: 'Monitored (Radarr)',
    type: 'boolean',
    dataSource: 'radarr',
    mediaTypes: ['MOVIE'],
    allowedOperators: ['equals'],
    category: 'external',
  },
  {
    key: 'radarr.qualityProfileId',
    label: 'Quality Profile (Radarr)',
    type: 'number',
    dataSource: 'radarr',
    mediaTypes: ['MOVIE'],
    allowedOperators: ['equals', 'notEquals', 'in', 'notIn'],
    category: 'external',
  },
  {
    key: 'radarr.minimumAvailability',
    label: 'Minimum Availability (Radarr)',
    type: 'enum',
    dataSource: 'radarr',
    mediaTypes: ['MOVIE'],
    allowedOperators: ['equals', 'notEquals', 'in', 'notIn'],
    enumValues: [
      { value: 'announced', label: 'Announced' },
      { value: 'inCinemas', label: 'In Cinemas' },
      { value: 'released', label: 'Released' },
      { value: 'preDB', label: 'PreDB' },
    ],
    category: 'external',
  },

  // === SONARR FIELDS (TV only) ===
  {
    key: 'sonarr.monitored',
    label: 'Monitored (Sonarr)',
    type: 'boolean',
    dataSource: 'sonarr',
    mediaTypes: ['TV_SERIES'],
    allowedOperators: ['equals'],
    category: 'external',
  },
  {
    key: 'sonarr.status',
    label: 'Series Status (Sonarr)',
    type: 'enum',
    dataSource: 'sonarr',
    mediaTypes: ['TV_SERIES'],
    allowedOperators: ['equals', 'notEquals', 'in', 'notIn'],
    enumValues: [
      { value: 'continuing', label: 'Continuing' },
      { value: 'ended', label: 'Ended' },
    ],
    category: 'external',
  },
  {
    key: 'sonarr.episodeFileCount',
    label: 'Episode File Count (Sonarr)',
    description: 'Number of episode files available',
    type: 'number',
    dataSource: 'sonarr',
    mediaTypes: ['TV_SERIES'],
    allowedOperators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'],
    category: 'external',
  },
  {
    key: 'sonarr.percentOfEpisodes',
    label: 'Percent Complete (Sonarr)',
    description: 'Percentage of episodes available',
    type: 'number',
    dataSource: 'sonarr',
    mediaTypes: ['TV_SERIES'],
    allowedOperators: ['equals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'],
    category: 'external',
  },
]

/**
 * Get fields filtered by media type
 */
export function getFieldsForMediaType(mediaType: MediaType): FieldDefinition[] {
  return FIELD_DEFINITIONS.filter(f => f.mediaTypes.includes(mediaType))
}

/**
 * Get fields grouped by category
 */
export function getFieldsByCategory(mediaType: MediaType): Record<string, FieldDefinition[]> {
  const fields = getFieldsForMediaType(mediaType)
  const grouped: Record<string, FieldDefinition[]> = {
    metadata: [],
    playback: [],
    file: [],
    quality: [],
    external: [],
  }

  fields.forEach(field => {
    grouped[field.category].push(field)
  })

  return grouped
}

/**
 * Get fields grouped by data source (recommended for UI organization)
 */
export function getFieldsByDataSource(mediaType: MediaType): Record<string, FieldDefinition[]> {
  const fields = getFieldsForMediaType(mediaType)
  const grouped: Record<string, FieldDefinition[]> = {
    plex: [],
    tautulli: [],
    radarr: [],
    sonarr: [],
  }

  fields.forEach(field => {
    grouped[field.dataSource].push(field)
  })

  return grouped
}

/**
 * Get field definition by key
 */
export function getFieldDefinition(key: string): FieldDefinition | undefined {
  return FIELD_DEFINITIONS.find(f => f.key === key)
}

/**
 * Format operator label for UI display
 */
export function formatOperatorLabel(operator: ComparisonOperator): string {
  const labels: Record<string, string> = {
    equals: 'equals',
    notEquals: 'not equals',
    contains: 'contains',
    notContains: 'does not contain',
    startsWith: 'starts with',
    endsWith: 'ends with',
    regex: 'matches regex',
    in: 'is one of',
    notIn: 'is not one of',
    greaterThan: 'greater than',
    greaterThanOrEqual: 'greater than or equal to',
    lessThan: 'less than',
    lessThanOrEqual: 'less than or equal to',
    between: 'between',
    before: 'before',
    after: 'after',
    olderThan: 'older than',
    newerThan: 'newer than',
    null: 'is empty',
    notNull: 'is not empty',
    containsAny: 'contains any of',
    containsAll: 'contains all of',
    isEmpty: 'is empty',
    isNotEmpty: 'is not empty',
  }

  return labels[operator] || operator
}

/**
 * Generate unique ID for condition/group
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}
