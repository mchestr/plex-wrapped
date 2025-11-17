import { stripHighlightTags, parseStyledText } from '@/lib/wrapped/text-processor'

describe('stripHighlightTags', () => {
  it('should remove highlight tags while preserving content', () => {
    const input = 'In 2025, you watched <highlight>23 days, 6 hours, 27 minutes</highlight> of content!'
    const expected = 'In 2025, you watched 23 days, 6 hours, 27 minutes of content!'
    expect(stripHighlightTags(input)).toBe(expected)
  })

  it('should handle multiple highlight tags', () => {
    const input = 'Your top movie was <highlight>One Battle After Another</highlight> and you binged <highlight>56</highlight> shows.'
    const expected = 'Your top movie was One Battle After Another and you binged 56 shows.'
    expect(stripHighlightTags(input)).toBe(expected)
  })

  it('should handle backward compatibility with double asterisks', () => {
    const input = 'You watched **45 days** of content!'
    const expected = 'You watched 45 days of content!'
    expect(stripHighlightTags(input)).toBe(expected)
  })

  it('should handle empty string', () => {
    expect(stripHighlightTags('')).toBe('')
  })

  it('should handle text without highlight tags', () => {
    const input = 'This is plain text without any tags.'
    expect(stripHighlightTags(input)).toBe(input)
  })

  it('should handle unclosed highlight tags', () => {
    const input = 'Text with <highlight>unclosed tag'
    // Should not crash, but behavior may vary
    expect(() => stripHighlightTags(input)).not.toThrow()
  })

  it('should handle highlight tags with empty content', () => {
    const input = 'Before<highlight></highlight>After'
    const expected = 'BeforeAfter'
    expect(stripHighlightTags(input)).toBe(expected)
  })

  it('should handle the example from the user query', () => {
    const input = 'In 2025, you watched <highlight>23 days, 6 hours, 27 minutes</highlight> of content! Your top movie was <highlight>One Battle After Another</highlight> and you binged <highlight>56</highlight> shows. What a year of entertainment!'
    const expected = 'In 2025, you watched 23 days, 6 hours, 27 minutes of content! Your top movie was One Battle After Another and you binged 56 shows. What a year of entertainment!'
    expect(stripHighlightTags(input)).toBe(expected)
  })
})

describe('parseStyledText', () => {
  it('should parse text with highlight tags', () => {
    const result = parseStyledText('Hello <highlight>world</highlight>!')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ type: 'text', content: 'Hello ' })
    expect(result[1]).toEqual({ type: 'highlight', content: 'world' })
    expect(result[2]).toEqual({ type: 'text', content: '!' })
  })

  it('should handle plain text', () => {
    const result = parseStyledText('Plain text')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'text', content: 'Plain text' })
  })
})

