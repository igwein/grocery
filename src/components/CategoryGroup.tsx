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
  onUpdateQuantity?: (id: string, quantity: string | null) => void
  showRemove?: boolean
  showCheckbox?: boolean
  defaultOpen?: boolean
  lastPurchased?: Record<string, string>
  variant?: 'manager' | 'shopper'
}

export function CategoryGroup({
  emoji,
  items,
  onCheck,
  onRemove,
  onUpdateQuantity,
  showRemove = false,
  showCheckbox = true,
  defaultOpen = true,
  lastPurchased,
  variant,
}: CategoryGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const uncheckedCount = items.filter(i => !i.is_checked).length

  return (
    <div className="mb-4 mx-4">
      {/* Category card container */}
      <div className="rounded-2xl bg-green-50/70 border border-green-100 overflow-hidden">
        {/* Category header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 px-4 py-3"
        >
          {/* Emoji circle */}
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{emoji}</span>
          </div>

          <div className="flex-1 text-right">
            <span className="font-bold text-gray-800">{getCategoryName(emoji)}</span>
            <p className="text-sm text-gray-500">{uncheckedCount} פריטים</p>
          </div>

          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Items inside the category card */}
        {isOpen && (
          <div className="px-3 pb-3 space-y-2">
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onCheck={onCheck}
                onRemove={onRemove}
                onUpdateQuantity={onUpdateQuantity}
                showRemove={showRemove}
                showCheckbox={showCheckbox}
                lastPurchased={lastPurchased?.[item.item_name]}
                variant={variant}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
