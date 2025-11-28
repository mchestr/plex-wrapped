import { formatFileSize, formatDate, getMediaTypeLabel } from '../formatters'

describe('formatters', () => {
  describe('formatFileSize', () => {
    it('should return "Unknown" for null input', () => {
      expect(formatFileSize(null)).toBe('Unknown')
    })

    it('should format bytes to GB when >= 1 GB', () => {
      const oneGB = 1024 ** 3
      expect(formatFileSize(oneGB)).toBe('1.00 GB')
      expect(formatFileSize(oneGB * 2.5)).toBe('2.50 GB')
      expect(formatFileSize(oneGB * 10)).toBe('10.00 GB')
    })

    it('should format bytes to MB when < 1 GB', () => {
      const oneMB = 1024 ** 2
      expect(formatFileSize(oneMB)).toBe('1.00 MB')
      expect(formatFileSize(oneMB * 500)).toBe('500.00 MB')
      expect(formatFileSize(oneMB * 1.5)).toBe('1.50 MB')
    })

    it('should handle bigint input', () => {
      const oneGB = BigInt(1024 ** 3)
      expect(formatFileSize(oneGB)).toBe('1.00 GB')
      expect(formatFileSize(oneGB * BigInt(5))).toBe('5.00 GB')
    })

    it('should handle number input', () => {
      expect(formatFileSize(1073741824)).toBe('1.00 GB') // 1 GB in bytes
      expect(formatFileSize(1048576)).toBe('1.00 MB') // 1 MB in bytes
    })

    it('should round to 2 decimal places', () => {
      const bytes = 1536 * 1024 * 1024 // 1.5 GB
      expect(formatFileSize(bytes)).toBe('1.50 GB')
    })

    it('should handle very large file sizes', () => {
      const largeSize = BigInt(1024) ** BigInt(3) * BigInt(1000) // 1000 GB
      expect(formatFileSize(largeSize)).toBe('1000.00 GB')
    })

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('Unknown')
    })
  })

  describe('formatDate', () => {
    it('should return "Never" for null input', () => {
      expect(formatDate(null)).toBe('Never')
    })

    it('should format valid Date object', () => {
      const testDate = new Date('2024-01-15T12:00:00Z')
      const result = formatDate(testDate)

      // Check that it returns a localized date string (format may vary by locale)
      expect(result).toBeTruthy()
      expect(result).not.toBe('Never')
      expect(result).not.toBe('Unknown')
    })

    it('should handle different dates consistently', () => {
      const date1 = new Date('2023-12-25T00:00:00Z')
      const date2 = new Date('2024-06-01T00:00:00Z')

      expect(formatDate(date1)).toBeTruthy()
      expect(formatDate(date2)).toBeTruthy()
      expect(formatDate(date1)).not.toBe(formatDate(date2))
    })

    it('should handle dates passed as Date objects', () => {
      const now = new Date()
      const result = formatDate(now)

      expect(result).toBeTruthy()
      expect(result).not.toBe('Never')
    })
  })

  describe('getMediaTypeLabel', () => {
    it('should replace underscores with spaces', () => {
      expect(getMediaTypeLabel('TV_SHOW')).toBe('TV SHOW')
      expect(getMediaTypeLabel('AUDIO_BOOK')).toBe('AUDIO BOOK')
    })

    it('should handle single word media types', () => {
      expect(getMediaTypeLabel('MOVIE')).toBe('MOVIE')
      expect(getMediaTypeLabel('MUSIC')).toBe('MUSIC')
    })

    it('should only replace the first underscore', () => {
      // This tests the current implementation which uses replace() not replaceAll()
      expect(getMediaTypeLabel('TV_SHOW_EPISODE')).toBe('TV SHOW_EPISODE')
    })

    it('should handle empty string', () => {
      expect(getMediaTypeLabel('')).toBe('')
    })

    it('should handle strings without underscores', () => {
      expect(getMediaTypeLabel('Movie')).toBe('Movie')
    })
  })
})
