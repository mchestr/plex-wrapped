import { cn, generateShareToken, getBaseUrl } from '@/lib/utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('should merge Tailwind classes correctly', () => {
    // Tailwind merge should deduplicate conflicting classes
    const result = cn('px-2 py-1', 'px-4')
    // The result should have px-4 (later class wins) and py-1
    expect(result).toContain('py-1')
    expect(result).toContain('px-4')
    expect(result).not.toContain('px-2')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
  })

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })
})

describe('generateShareToken', () => {
  it('should generate a token', () => {
    const token = generateShareToken()
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })

  it('should generate unique tokens', () => {
    const token1 = generateShareToken()
    const token2 = generateShareToken()
    expect(token1).not.toBe(token2)
  })

  it('should generate URL-safe tokens', () => {
    const token = generateShareToken()
    // URL-safe base64 should not contain +, /, or = characters
    expect(token).not.toContain('+')
    expect(token).not.toContain('/')
    expect(token).not.toContain('=')
  })

  it('should generate tokens of consistent length', () => {
    const tokens = Array.from({ length: 10 }, () => generateShareToken())
    const lengths = tokens.map(t => t.length)
    const uniqueLengths = new Set(lengths)
    // All tokens should have the same length (43 characters for 32 bytes in base64url)
    expect(uniqueLengths.size).toBe(1)
    expect(lengths[0]).toBe(43)
  })
})

describe('getBaseUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should prefer NEXT_PUBLIC_APP_URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    process.env.NEXTAUTH_URL = 'https://fallback.com'
    process.env.NODE_ENV = 'production'

    const { getBaseUrl } = require('@/lib/utils')
    expect(getBaseUrl()).toBe('https://example.com')
  })

  it('should fallback to NEXTAUTH_URL when NEXT_PUBLIC_APP_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXTAUTH_URL = 'https://fallback.com'
    process.env.NODE_ENV = 'production'

    const { getBaseUrl } = require('@/lib/utils')
    expect(getBaseUrl()).toBe('https://fallback.com')
  })

  it('should use localhost in development when no env vars are set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.NEXTAUTH_URL
    process.env.NODE_ENV = 'development'

    const { getBaseUrl } = require('@/lib/utils')
    expect(getBaseUrl()).toBe('http://localhost:3000')
  })

  it('should throw error in production when no env vars are set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.NEXTAUTH_URL
    process.env.NODE_ENV = 'production'

    const { getBaseUrl } = require('@/lib/utils')
    expect(() => getBaseUrl()).toThrow('Base URL is not configured')
  })
})

