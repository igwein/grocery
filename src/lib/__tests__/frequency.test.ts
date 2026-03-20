import { describe, it, expect } from 'vitest'
import { calculateFrequency, formatFrequencyLines, PurchaseRow } from '@/lib/frequency'

describe('calculateFrequency', () => {
  it('returns empty array for empty history', () => {
    expect(calculateFrequency([])).toEqual([])
  })

  it('calculates correct count per item', () => {
    const history: PurchaseRow[] = [
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-01' },
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-08' },
      { item_name: 'bread', category_emoji: '🥖', purchased_at: '2025-01-01' },
    ]

    const result = calculateFrequency(history)
    const milk = result.find(e => e.item_name === 'milk')
    const bread = result.find(e => e.item_name === 'bread')

    expect(milk?.count).toBe(2)
    expect(bread?.count).toBe(1)
  })

  it('identifies first and last purchase dates', () => {
    const history: PurchaseRow[] = [
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-15' },
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-01' },
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-08' },
    ]

    const result = calculateFrequency(history)
    const milk = result[0]

    expect(milk.first).toBe('2025-01-01')
    expect(milk.last).toBe('2025-01-15')
  })

  it('computes average interval for multi-purchase items', () => {
    const history: PurchaseRow[] = [
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-01' },
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-15' },
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-29' },
    ]

    const result = calculateFrequency(history)
    // 28 days span, 2 intervals → 14 days avg
    expect(result[0].avgInterval).toBe(14)
  })

  it('returns null avgInterval for single-purchase items', () => {
    const history: PurchaseRow[] = [
      { item_name: 'cake', category_emoji: '🍰', purchased_at: '2025-01-01' },
    ]

    const result = calculateFrequency(history)
    expect(result[0].avgInterval).toBeNull()
  })

  it('sorts by count descending', () => {
    const history: PurchaseRow[] = [
      { item_name: 'bread', category_emoji: '🥖', purchased_at: '2025-01-01' },
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-01' },
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-08' },
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-15' },
      { item_name: 'bread', category_emoji: '🥖', purchased_at: '2025-01-08' },
    ]

    const result = calculateFrequency(history)
    expect(result[0].item_name).toBe('milk')
    expect(result[1].item_name).toBe('bread')
  })
})

describe('formatFrequencyLines', () => {
  it('formats entries into prompt lines', () => {
    const entries = [
      {
        item_name: 'milk',
        category_emoji: '🧀',
        count: 3,
        first: '2025-01-01',
        last: '2025-01-15',
        dates: ['2025-01-01', '2025-01-08', '2025-01-15'],
        avgInterval: 7,
      },
    ]

    const result = formatFrequencyLines(entries)
    expect(result).toBe('🧀 milk | bought 3x | last: 2025-01-15 | avg interval: 7 days')
  })

  it('shows N/A for null avgInterval', () => {
    const entries = [
      {
        item_name: 'cake',
        category_emoji: '🍰',
        count: 1,
        first: '2025-01-01',
        last: '2025-01-01',
        dates: ['2025-01-01'],
        avgInterval: null,
      },
    ]

    const result = formatFrequencyLines(entries)
    expect(result).toContain('avg interval: N/A days')
  })
})
