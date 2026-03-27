'use client'

import { CATEGORIES } from '@/lib/categories'

interface CategoryPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  currentEmoji?: string
}

export function CategoryPicker({ onSelect, onClose, currentEmoji }: CategoryPickerProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full rounded-t-2xl p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-gray-500 mb-3">בחר קטגוריה:</p>
        <div className="grid grid-cols-6 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.emoji}
              onClick={() => onSelect(cat.emoji)}
              className={`text-2xl p-2 rounded-lg flex flex-col items-center transition-colors ${
                currentEmoji === cat.emoji
                  ? 'bg-green-100 ring-2 ring-green-500'
                  : 'hover:bg-gray-100'
              }`}
              title={cat.name}
            >
              {cat.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
