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
  variant?: 'manager' | 'shopper'
}

export function ItemRow({
  item,
  onCheck,
  onRemove,
  onUpdateQuantity,
  showRemove = false,
  showCheckbox = true,
  lastPurchased,
  variant,
}: ItemRowProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })
  }

  const isShopper = variant === 'shopper'

  return (
    <div
      className={`rounded-xl bg-white p-3 card-shadow transition-colors ${
        item.is_checked ? 'item-checked' : ''
      } ${showCheckbox ? 'active:bg-gray-50 cursor-pointer' : ''}`}
      onClick={() => showCheckbox && onCheck(item.id)}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        {showCheckbox && (
          <div
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              item.is_checked
                ? 'bg-green-600 border-green-600'
                : 'border-gray-300'
            }`}
          >
            {item.is_checked && (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <span className="text-lg font-semibold block">{item.item_name}</span>
          {isShopper && item.quantity && (
            <span className="text-sm text-gray-500">{item.quantity}</span>
          )}
          {!isShopper && lastPurchased && (
            <span className="text-xs text-gray-400 block">נקנה {formatDate(lastPurchased)}</span>
          )}
        </div>

        {/* Quantity badge (manager only) */}
        {!isShopper && onUpdateQuantity ? (
          <QuantityBadge
            quantity={item.quantity}
            onUpdate={(q) => onUpdateQuantity(item.id, q)}
          />
        ) : !isShopper && item.quantity ? (
          <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full font-medium">
            {item.quantity}
          </span>
        ) : null}

        {item.notes && (
          <span className="text-sm text-gray-400">{item.notes}</span>
        )}

        {/* Remove button */}
        {showRemove && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item.id)
            }}
            className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
