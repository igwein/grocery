'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CatalogItem } from '@/lib/types'
import { CATEGORIES, getCategoryName } from '@/lib/categories'
import { fuzzyMatch } from '@/lib/fuzzy-match'

interface CatalogItemWithHistory extends CatalogItem {
  lastPurchased: string | null
}

interface AddItemInputProps {
  onAdd: (itemName: string, categoryEmoji: string) => void
  onClose: () => void
  currentItemNames?: string[]
}

export function AddItemInput({ onAdd, onClose, currentItemNames = [] }: AddItemInputProps) {
  const [query, setQuery] = useState('')
  const [allItems, setAllItems] = useState<CatalogItemWithHistory[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Fetch all catalog items with last purchase date
  useEffect(() => {
    async function fetchAll() {
      const [catalogResult, historyResult] = await Promise.all([
        supabase.from('items_catalog').select('*'),
        supabase
          .from('purchase_history')
          .select('item_name, purchased_at')
          .order('purchased_at', { ascending: false }),
      ])

      // Get last purchase date per item (first occurrence due to desc order)
      const lastPurchasedMap = new Map<string, string>()
      if (historyResult.data) {
        for (const row of historyResult.data) {
          if (!lastPurchasedMap.has(row.item_name)) {
            lastPurchasedMap.set(row.item_name, row.purchased_at)
          }
        }
      }

      const items: CatalogItemWithHistory[] = (catalogResult.data ?? []).map(item => ({
        ...item,
        lastPurchased: lastPurchasedMap.get(item.name) ?? null,
      }))

      // Sort by last purchase date descending (most recent first), items never purchased last
      items.sort((a, b) => {
        if (!a.lastPurchased && !b.lastPurchased) return 0
        if (!a.lastPurchased) return 1
        if (!b.lastPurchased) return -1
        return b.lastPurchased.localeCompare(a.lastPurchased)
      })
      setAllItems(items)
      setLoadingItems(false)
    }
    fetchAll()
  }, [])

  const currentSet = useMemo(() => new Set(currentItemNames), [currentItemNames])

  // Filter: not on current list, matches search query (fuzzy)
  const filteredItems = useMemo(() => {
    const available = allItems.filter(item => !currentSet.has(item.name))
    const q = query.trim()
    if (!q) return available
    return available
      .map(item => ({ item, score: fuzzyMatch(item.name, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
  }, [allItems, currentSet, query])

  const handleSelect = (item: CatalogItemWithHistory) => {
    onAdd(item.name, item.category_emoji)
    // Don't close - let manager add multiple items
  }

  const handleSubmitNew = () => {
    if (!query.trim()) return

    if (!selectedCategory) {
      setShowCategoryPicker(true)
      return
    }

    onAdd(query.trim(), selectedCategory)
    setQuery('')
    setSelectedCategory(null)
    setShowCategoryPicker(false)
  }

  const handleCategorySelect = (emoji: string) => {
    setSelectedCategory(emoji)
    setShowCategoryPicker(false)
    onAdd(query.trim(), emoji)
    setQuery('')
  }

  const isNewItem = query.trim() && filteredItems.every(s => s.name !== query.trim())

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center gap-2 p-4 pb-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmitNew()
              if (e.key === 'Escape') onClose()
            }}
            placeholder="חפש מוצר..."
            className="flex-1 text-lg border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500"
            dir="rtl"
          />
          <button
            onClick={onClose}
            className="text-gray-400 p-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!query.trim() && (
          <p className="text-sm text-gray-400 px-4 pb-2">
            מוצרים שלא ברשימה (לפי תאריך קנייה אחרון)
          </p>
        )}

        <div className="overflow-y-auto flex-1 pb-4">
          {loadingItems ? (
            <div className="text-center text-gray-400 py-8">טוען...</div>
          ) : (
            <>
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full text-right px-4 py-3 border-b border-gray-100 active:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-xl">{item.category_emoji}</span>
                  <span className="text-lg flex-1">{item.name}</span>
                  {item.lastPurchased && (
                    <span className="text-xs text-gray-400">
                      {new Date(item.lastPurchased).toLocaleDateString('he-IL')}
                    </span>
                  )}
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}

              {isNewItem && (
                <button
                  onClick={handleSubmitNew}
                  className="w-full bg-green-500 text-white py-3 text-lg font-semibold mx-4 mt-3 rounded-xl"
                  style={{ width: 'calc(100% - 2rem)' }}
                >
                  הוסף &quot;{query.trim()}&quot;
                </button>
              )}
            </>
          )}
        </div>

        {showCategoryPicker && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">בחר קטגוריה:</p>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.emoji}
                  onClick={() => handleCategorySelect(cat.emoji)}
                  className="text-2xl p-2 rounded-lg hover:bg-gray-100 flex flex-col items-center"
                  title={cat.name}
                >
                  {cat.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
