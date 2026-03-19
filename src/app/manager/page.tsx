'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useShoppingList } from '@/hooks/useShoppingList'
import { ShoppingList } from '@/components/ShoppingList'
import { AddItemInput } from '@/components/AddItemInput'
import { AISuggestion, ShoppingListItem } from '@/lib/types'
import { getCategoryOrder, getCategoryName } from '@/lib/categories'

export default function ManagerPage() {
  const {
    items,
    activeItems,
    doneItems,
    lastPurchased,
    loading,
    addItem,
    removeItem,
  } = useShoppingList()

  const [showAddItem, setShowAddItem] = useState(false)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [generating, setGenerating] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [removedItems, setRemovedItems] = useState<ShoppingListItem[]>([])
  const [showRemoved, setShowRemoved] = useState(false)
  const [showBought, setShowBought] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-list', { method: 'POST' })
      const data = await res.json()
      if (data.success && data.data) {
        setSuggestions(data.data)
        setShowSuggestions(true)
      }
    } catch (err) {
      console.error('Error generating list:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleAcceptSuggestion = async (suggestion: AISuggestion) => {
    await addItem(suggestion.item_name, suggestion.category_emoji, 'ai')
    setSuggestions(prev => prev.filter(s => s.item_name !== suggestion.item_name))
  }

  const handleAcceptAll = async () => {
    const currentNames = new Set(items.map(i => i.item_name))
    const newSuggestions = suggestions.filter(s => !currentNames.has(s.item_name))
    for (const s of newSuggestions) {
      await addItem(s.item_name, s.category_emoji, 'ai')
    }
    setSuggestions([])
    setShowSuggestions(false)
  }

  const groupedSuggestions = useMemo(() => {
    const groups = new Map<string, AISuggestion[]>()
    for (const s of suggestions) {
      const existing = groups.get(s.category_emoji) ?? []
      groups.set(s.category_emoji, [...existing, s])
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => getCategoryOrder(a) - getCategoryOrder(b))
  }, [suggestions])

  const handleRemoveItem = useCallback(async (id: string) => {
    const item = activeItems.find(i => i.id === id)
    if (item) {
      setRemovedItems(prev => [item, ...prev])
    }
    await removeItem(id)
  }, [activeItems, removeItem])

  const handleRestoreItem = useCallback(async (item: ShoppingListItem) => {
    await addItem(item.item_name, item.category_emoji, 'manager')
    setRemovedItems(prev => prev.filter(r => r.id !== item.id))
  }, [addItem])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 text-lg">טוען...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">ניהול רשימה</h1>
          <Link
            href="/manager/history"
            className="text-green-100 hover:text-white text-sm"
          >
            היסטוריה
          </Link>
        </div>
      </header>

      {/* AI Generate Button */}
      <div className="p-4">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-blue-500 text-white rounded-xl py-3 text-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              מייצר רשימה...
            </>
          ) : (
            'צור רשימה שבועית עם AI'
          )}
        </button>
      </div>

      {/* AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mx-4 mb-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-blue-800">הצעות AI</h2>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptAll}
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg"
              >
                הוסף הכל
              </button>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-sm text-blue-500 px-3 py-1"
              >
                סגור
              </button>
            </div>
          </div>

          {groupedSuggestions.map(([emoji, items]) => (
            <div key={emoji}>
              <div className="flex items-center gap-2 pt-3 pb-1 px-1">
                <span className="text-lg">{emoji}</span>
                <span className="text-sm font-semibold text-blue-700">{getCategoryName(emoji)}</span>
              </div>
              {items.map((s) => (
                <div
                  key={s.item_name}
                  className="flex items-center gap-2 py-2 pr-7 border-b border-blue-100 last:border-0"
                >
                  <span className="flex-1">{s.item_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    s.confidence === 'high' ? 'bg-green-100 text-green-700' :
                    s.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {s.confidence === 'high' ? 'בטוח' : s.confidence === 'medium' ? 'אולי' : 'אפשרי'}
                  </span>
                  <button
                    onClick={() => handleAcceptSuggestion(s)}
                    className="text-green-600 p-1"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSuggestions(prev => prev.filter(x => x.item_name !== s.item_name))}
                    className="text-red-400 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Current List */}
      <div className="px-4 mb-2">
        <h2 className="text-sm font-medium text-gray-500">
          רשימה נוכחית ({activeItems.length} פריטים)
        </h2>
      </div>

      <ShoppingList
        items={activeItems}
        onCheck={() => {}}
        onRemove={handleRemoveItem}
        showRemove
        showCheckbox={false}
        lastPurchased={lastPurchased}
      />

      {/* Bought items section - checked by shopper */}
      {doneItems.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowBought(!showBought)}
            className="w-full flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showBought ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-medium">נקנו ({doneItems.length})</span>
          </button>

          {showBought && (
            <div className="bg-green-50/50">
              {doneItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-green-100 opacity-60"
                >
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg flex-1 line-through">{item.item_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Removed items section - quick restore */}
      {removedItems.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowRemoved(!showRemoved)}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-500"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showRemoved ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-medium">הוסרו מהרשימה ({removedItems.length})</span>
          </button>

          {showRemoved && (
            <div className="bg-gray-50">
              {removedItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 opacity-60"
                >
                  <span className="text-lg flex-1 line-through">{item.item_name}</span>
                  <button
                    onClick={() => handleRestoreItem(item)}
                    className="text-green-600 text-sm bg-green-50 px-3 py-1 rounded-lg"
                  >
                    החזר לרשימה
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Add Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={() => setShowAddItem(true)}
          className="w-full bg-green-600 text-white rounded-xl py-3 text-lg font-semibold"
        >
          + הוסף מוצר
        </button>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <AddItemInput
          onAdd={(name, emoji) => addItem(name, emoji, 'manager')}
          onClose={() => setShowAddItem(false)}
          currentItemNames={[
            ...items.map(i => i.item_name),
            ...suggestions.map(s => s.item_name),
          ]}
        />
      )}
    </div>
  )
}
