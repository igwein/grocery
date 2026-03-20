import { describe, it, expect } from 'vitest'
import { levenshtein, fuzzyMatch } from '@/lib/fuzzy-match'

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0)
  })

  it('returns 0 for two empty strings', () => {
    expect(levenshtein('', '')).toBe(0)
  })

  it('returns length of other string when one is empty', () => {
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('abc', '')).toBe(3)
  })

  it('returns 1 for single substitution', () => {
    expect(levenshtein('abc', 'abd')).toBe(1)
  })

  it('returns 1 for single deletion', () => {
    expect(levenshtein('abc', 'ab')).toBe(1)
  })

  it('returns 1 for single insertion', () => {
    expect(levenshtein('ab', 'abc')).toBe(1)
  })

  it('handles multiple edits', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
  })

  it('works with Hebrew strings', () => {
    expect(levenshtein('חלב', 'חלב')).toBe(0)
    expect(levenshtein('חלב', 'חלה')).toBe(1)
  })
})

describe('fuzzyMatch', () => {
  it('returns 1 for empty search string', () => {
    expect(fuzzyMatch('anything', '')).toBe(1)
    expect(fuzzyMatch('anything', '  ')).toBe(1)
  })

  it('returns 3 for exact substring match', () => {
    expect(fuzzyMatch('chocolate milk', 'choco')).toBe(3)
    expect(fuzzyMatch('חלב', 'חלב')).toBe(3)
  })

  it('returns 2 for close Levenshtein match', () => {
    // "milx" vs "milk" = distance 1, max allowed for 4-char query = max(1, floor(4/3)) = 1
    expect(fuzzyMatch('milk', 'milx')).toBe(2)
  })

  it('returns 0 for no match', () => {
    expect(fuzzyMatch('apple', 'xyz')).toBe(0)
  })

  it('checks each word in multi-word target', () => {
    // "milx" matches "milk" (distance 1) in the second word
    expect(fuzzyMatch('chocolate milk', 'milx')).toBe(2)
  })

  it('applies dynamic tolerance based on query length', () => {
    // 3-char query: maxDist = max(1, floor(3/3)) = 1
    expect(fuzzyMatch('abc', 'abd')).toBe(2) // distance 1 <= 1
    expect(fuzzyMatch('abc', 'xyz')).toBe(0) // distance 3 > 1

    // 6-char query: maxDist = max(1, floor(6/3)) = 2
    // 'abcdef' vs 'abcxyz' = distance 3 > maxDist 2 → no match
    expect(fuzzyMatch('abcdef', 'abcxyz')).toBe(0)
    // 'abcdef' vs 'abcdef' with 2 edits should match
    expect(fuzzyMatch('abcdef', 'abcdeg')).toBe(2) // distance 1 <= 2
  })

  it('trims whitespace from search', () => {
    expect(fuzzyMatch('milk', '  milk  ')).toBe(3)
  })
})
