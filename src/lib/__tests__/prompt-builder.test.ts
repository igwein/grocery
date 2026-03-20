import { describe, it, expect } from 'vitest'
import { buildGenerateListPrompt, buildReceiptParsePrompt, sanitizeLLMJson, parseLLMJson } from '@/lib/prompt-builder'

describe('buildGenerateListPrompt', () => {
  it('includes frequency data and current items in prompt', () => {
    const entries = [
      {
        item_name: 'milk',
        category_emoji: '🧀',
        count: 3,
        first: '2025-01-01',
        last: '2025-01-15',
        dates: [],
        avgInterval: 7,
      },
    ]

    const prompt = buildGenerateListPrompt(entries, ['bread', 'eggs'], '2025-01-20')
    expect(prompt).toContain('2025-01-20')
    expect(prompt).toContain('🧀 milk')
    expect(prompt).toContain('bread, eggs')
  })

  it('shows "empty" when current list is empty', () => {
    const prompt = buildGenerateListPrompt([], [], '2025-01-20')
    expect(prompt).toContain('empty')
  })
})

describe('buildReceiptParsePrompt', () => {
  const catalogItems = ['חלב', 'לחם', 'ביצים', 'עגבניות']
  const categories = [
    { emoji: '🧀', name: 'מוצרי חלב' },
    { emoji: '🥬', name: 'ירקות' },
    { emoji: '🥚', name: 'ביצים' },
  ]

  it('includes category list with emoji and name', () => {
    const prompt = buildReceiptParsePrompt(catalogItems, categories)
    expect(prompt).toContain('🧀 מוצרי חלב')
    expect(prompt).toContain('🥬 ירקות')
    expect(prompt).toContain('🥚 ביצים')
  })

  it('includes catalog item names for matching', () => {
    const prompt = buildReceiptParsePrompt(catalogItems, categories)
    expect(prompt).toContain('חלב')
    expect(prompt).toContain('לחם')
    expect(prompt).toContain('ביצים')
    expect(prompt).toContain('עגבניות')
  })

  it('instructs to return JSON array with required fields', () => {
    const prompt = buildReceiptParsePrompt(catalogItems, categories)
    expect(prompt).toContain('receipt_name')
    expect(prompt).toContain('item_name')
    expect(prompt).toContain('category_emoji')
    expect(prompt).toContain('quantity')
    expect(prompt).toContain('price')
    expect(prompt).toContain('JSON')
  })

  it('works with empty catalog', () => {
    const prompt = buildReceiptParsePrompt([], categories)
    expect(prompt).toContain('🧀 מוצרי חלב')
    // Should still be a valid prompt
    expect(prompt.length).toBeGreaterThan(100)
  })
})

describe('sanitizeLLMJson', () => {
  it('returns clean JSON as-is', () => {
    const input = '[{"a":1}]'
    expect(sanitizeLLMJson(input)).toBe('[{"a":1}]')
  })

  it('strips markdown code fences', () => {
    const input = '```json\n[{"a":1}]\n```'
    expect(sanitizeLLMJson(input)).toBe('[{"a":1}]')
  })

  it('strips fences without language tag', () => {
    const input = '```\n[{"a":1}]\n```'
    expect(sanitizeLLMJson(input)).toBe('[{"a":1}]')
  })

  it('fixes trailing commas in objects', () => {
    const input = '{"a":1,}'
    expect(sanitizeLLMJson(input)).toBe('{"a":1}')
  })

  it('fixes trailing commas in arrays', () => {
    const input = '[1,2,]'
    expect(sanitizeLLMJson(input)).toBe('[1,2]')
  })

  it('trims whitespace', () => {
    const input = '  [1]  '
    expect(sanitizeLLMJson(input)).toBe('[1]')
  })
})

describe('parseLLMJson', () => {
  it('parses valid JSON', () => {
    const result = parseLLMJson<number[]>('[1,2,3]')
    expect(result).toEqual([1, 2, 3])
  })

  it('salvages truncated JSON array by closing at last brace', () => {
    const truncated = '[{"item_name":"milk","category_emoji":"🧀","confidence":"high"},{"item_name":"bread"'
    const result = parseLLMJson<Array<{ item_name: string }>>(truncated)
    expect(result).toHaveLength(1)
    expect(result[0].item_name).toBe('milk')
  })

  it('throws for completely invalid JSON', () => {
    expect(() => parseLLMJson('not json at all')).toThrow('Could not parse AI response as JSON')
  })
})
