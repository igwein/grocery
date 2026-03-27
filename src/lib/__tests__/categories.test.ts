import { describe, it, expect } from 'vitest'
import {
  CATEGORIES,
  CATEGORY_MAP,
  getCategoryOrder,
  getCategoryName,
} from '@/lib/categories'

describe('categories', () => {
  describe('CATEGORIES', () => {
    it('has 25 categories', () => {
      expect(CATEGORIES).toHaveLength(25)
    })

    it('has unique order values', () => {
      const orders = CATEGORIES.map(c => c.order)
      expect(new Set(orders).size).toBe(orders.length)
    })

    it('has unique emojis', () => {
      const emojis = CATEGORIES.map(c => c.emoji)
      expect(new Set(emojis).size).toBe(emojis.length)
    })
  })

  describe('CATEGORY_MAP', () => {
    it('has 25 entries', () => {
      expect(CATEGORY_MAP.size).toBe(25)
    })
  })

  describe('getCategoryOrder', () => {
    it('returns correct order for known emoji', () => {
      expect(getCategoryOrder('🥬')).toBe(1)
      expect(getCategoryOrder('🍽')).toBe(24)
      expect(getCategoryOrder('🧀')).toBe(3)
    })

    it('returns 99 for unknown emoji', () => {
      expect(getCategoryOrder('🤷')).toBe(99)
      expect(getCategoryOrder('')).toBe(99)
    })
  })

  describe('getCategoryName', () => {
    it('returns Hebrew name for known emoji', () => {
      expect(getCategoryName('🥬')).toBe('ירקות')
      expect(getCategoryName('🧀')).toBe('מוצרי חלב')
      expect(getCategoryName('🍽')).toBe('חד פעמי')
    })

    it('returns "אחר" for unknown emoji', () => {
      expect(getCategoryName('🤷')).toBe('אחר')
      expect(getCategoryName('')).toBe('אחר')
    })
  })
})
