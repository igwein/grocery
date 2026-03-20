'use client'

import { useMemo } from 'react'
import { ShoppingListItem } from '@/lib/types'
import { getCategoryOrder } from '@/lib/categories'
import { CategoryGroup } from './CategoryGroup'

interface ShoppingListProps {
  items: ShoppingListItem[]
  onCheck: (id: string) => void
  onRemove?: (id: string) => void
  onUpdateQuantity?: (id: string, quantity: string | null) => void
  showRemove?: boolean
  showCheckbox?: boolean
  lastPurchased?: Record<string, string>
}

export function ShoppingList({ items, onCheck, onRemove, onUpdateQuantity, showRemove = false, showCheckbox = true, lastPurchased }: ShoppingListProps) {
  const groupedItems = useMemo(() => {
    const groups = new Map<string, ShoppingListItem[]>()

    for (const item of items) {
      const key = item.category_emoji
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(item)
    }

    // Sort groups by category order
    return Array.from(groups.entries()).sort(
      ([a], [b]) => getCategoryOrder(a) - getCategoryOrder(b)
    )
  }, [items])

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p className="text-lg">הרשימה ריקה</p>
      </div>
    )
  }

  return (
    <div>
      {groupedItems.map(([emoji, categoryItems]) => (
        <CategoryGroup
          key={emoji}
          emoji={emoji}
          items={categoryItems}
          onCheck={onCheck}
          onRemove={onRemove}
          onUpdateQuantity={onUpdateQuantity}
          showRemove={showRemove}
          showCheckbox={showCheckbox}
          lastPurchased={lastPurchased}
        />
      ))}
    </div>
  )
}
