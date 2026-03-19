'use client'

import { useState } from 'react'
import { ShoppingListItem } from '@/lib/types'
import { getCategoryName } from '@/lib/categories'
import { ItemRow } from './ItemRow'

interface CategoryGroupProps {
  emoji: string
  items: ShoppingListItem[]
  onCheck: (id: string) => void
  onRemove?: (id: string) => void
  showRemove?: boolean
  showCheckbox?: boolean
  defaultOpen?: boolean
  lastPurchased?: Record<string, string>
}

export function CategoryGroup({
  emoji,
  items,
  onCheck,
  onRemove,
  showRemove = false,
  showCheckbox = true,
  defaultOpen = true,
  lastPurchased,
}: CategoryGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const uncheckedCount = items.filter(i => !i.is_checked).length

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-2 bg-white sticky top-0 z-10 border-b border-gray-200"
      >
        <span className="text-xl">{emoji}</span>
        <span className="font-semibold text-gray-700">{getCategoryName(emoji)}</span>
        <span className="text-sm text-gray-400 mr-auto">({uncheckedCount})</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="bg-white">
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onCheck={onCheck}
              onRemove={onRemove}
              showRemove={showRemove}
              showCheckbox={showCheckbox}
              lastPurchased={lastPurchased?.[item.item_name]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
