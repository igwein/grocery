export interface Category {
  emoji: string
  name: string
  order: number
}

// Ordered roughly by supermarket aisle flow
export const CATEGORIES: Category[] = [
  { emoji: '🥬', name: 'ירקות', order: 1 },
  { emoji: '🍎', name: 'פירות', order: 2 },
  { emoji: '🧀', name: 'מוצרי חלב', order: 3 },
  { emoji: '🥚', name: 'ביצים', order: 4 },
  { emoji: '🥩', name: 'בשר', order: 5 },
  { emoji: '🐟', name: 'דגים', order: 6 },
  { emoji: '🌭', name: 'נקניקים', order: 7 },
  { emoji: '🥖', name: 'לחם ומאפים', order: 8 },
  { emoji: '🍰', name: 'אפייה', order: 9 },
  { emoji: '🍚', name: 'קטניות ודגנים', order: 10 },
  { emoji: '🍝', name: 'פסטה', order: 11 },
  { emoji: '🫓', name: 'ממרחים', order: 12 },
  { emoji: '🥫', name: 'שימורים', order: 13 },
  { emoji: '🍯', name: 'שמנים ורטבים', order: 14 },
  { emoji: '🧂', name: 'תבלינים', order: 15 },
  { emoji: '🥜', name: 'אגוזים וגרעינים', order: 16 },
  { emoji: '🍫', name: 'חטיפים ומתוקים', order: 17 },
  { emoji: '🍷', name: 'אלכוהול', order: 18 },
  { emoji: '☕', name: 'משקאות', order: 19 },
  { emoji: '🥣', name: 'דגני בוקר', order: 20 },
  { emoji: '❄️', name: 'קפואים', order: 21 },
  { emoji: '🧻', name: 'ניקיון', order: 22 },
  { emoji: '🛀', name: 'היגיינה', order: 23 },
  { emoji: '🍽', name: 'חד פעמי', order: 24 },
]

export const CATEGORY_MAP = new Map(CATEGORIES.map(c => [c.emoji, c]))

export function getCategoryOrder(emoji: string): number {
  return CATEGORY_MAP.get(emoji)?.order ?? 99
}

export function getCategoryName(emoji: string): string {
  return CATEGORY_MAP.get(emoji)?.name ?? 'אחר'
}
