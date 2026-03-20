'use client'

import { ShoppingListItem } from '@/lib/types'
import { QuantityBadge } from './QuantityBadge'

interface ItemRowProps {
  item: ShoppingListItem
  onCheck: (id: string) => void
  onRemove?: (id: string) => void
  onUpdateQuantity?: (id: string, quantity: string | null) => void
  showRemove?: boolean
  showCheckbox?: boolean
  lastPurchased?: string
}

export function ItemRow({ item, onCheck, onRemove, onUpdateQuantity, showRemove = false, showCheckbox = true, lastPurchased }: ItemRowProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 active:bg-gray-50 transition-colors ${
        item.is_checked ? 'item-checked' : ''
      }`}
      onClick={() => showCheckbox && onCheck(item.id)}
    >
      {showCheckbox && (
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            item.is_checked
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300'
          }`}
        >
          {item.is_checked && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <span className="text-lg">{item.item_name}</span>
        {lastPurchased && (
          <span className="text-xs text-gray-400 mr-2">נקנה {formatDate(lastPurchased)}</span>
        )}
      </div>

      {onUpdateQuantity ? (
        <QuantityBadge
          quantity={item.quantity}
          onUpdate={(q) => onUpdateQuantity(item.id, q)}
        />
      ) : item.quantity ? (
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {item.quantity}
        </span>
      ) : null}

      {item.notes && (
        <span className="text-sm text-gray-400">{item.notes}</span>
      )}

      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(item.id)
          }}
          className="text-red-400 hover:text-red-600 p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
