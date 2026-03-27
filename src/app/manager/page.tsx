'use client'

import { useState, useCallback, useMemo } from 'react'
import { useShoppingList } from '@/hooks/useShoppingList'
import { ShoppingList } from '@/components/ShoppingList'
import { AddItemInput } from '@/components/AddItemInput'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { CategoryPicker } from '@/components/CategoryPicker'
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
    addItems,
    updateQuantity,
    updateCategory,
    removeItem,
    removeAllItems,
  } = useShoppingList()

  const [showAddItem, setShowAddItem] = useState(false)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [generating, setGenerating] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [removedItems, setRemovedItems] = useState<ShoppingListItem[]>([])
  const [showRemoved, setShowRemoved] = useState(false)
  const [showBought, setShowBought] = useState(false)
  const [categoryEditItemId, setCategoryEditItemId] = useState<string | null>(null)

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
    await addItems(newSuggestions.map(s => ({
      itemName: s.item_name,
      categoryEmoji: s.category_emoji,
      addedBy: 'ai',
    })))
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

  const handleChangeCategory = useCallback((id: string) => {
    setCategoryEditItemId(id)
  }, [])

  const handleCategorySelected = useCallback(async (emoji: string) => {
    if (categoryEditItemId) {
      await updateCategory(categoryEditItemId, emoji)
      setCategoryEditItemId(null)
    }
  }, [categoryEditItemId, updateCategory])

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
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">ניהול רשימה</h1>
          <button
            className="p-1"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/login'
            }}
            title="התנתק"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* AI Generate Button — green gradient banner */}
      <div className="p-4">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full green-gradient text-white rounded-2xl py-4 px-5 text-lg font-semibold disabled:opacity-70 flex items-center justify-between"
        >
          {generating ? (
            <div className="flex items-center gap-2 mx-auto">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>מייצר רשימה...</span>
            </div>
          ) : (
            <>
              <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>צור רשימה שבועית עם AI</span>
              {/* Sparkle icon */}
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
            </>
          )}
        </button>
      </div>

      {/* AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">הצעות AI</h2>
            <div className="flex gap-3">
              <button
                onClick={handleAcceptAll}
                className="text-sm font-bold text-green-700"
              >
                הוסף הכל
              </button>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-sm text-gray-500"
              >
                סגור
              </button>
            </div>
          </div>

          {groupedSuggestions.map(([emoji, groupItems]) => (
            <div key={emoji}>
              <div className="flex items-center gap-2 pt-3 pb-2 px-1">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-lg">{emoji}</span>
                </div>
                <span className="text-sm font-bold text-gray-700">{getCategoryName(emoji)}</span>
              </div>
              {groupItems.map((s) => (
                <div
                  key={s.item_name}
                  className="flex items-center gap-2 py-2.5 pr-10 border-b border-gray-100 last:border-0"
                >
                  <span className="flex-1 font-medium">{s.item_name}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    s.confidence === 'high' ? 'bg-green-100 text-green-700' :
                    s.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {s.confidence === 'high' ? 'בטוח' : s.confidence === 'medium' ? 'אולי' : 'לא בטוח'}
                  </span>
                  <button
                    onClick={() => handleAcceptSuggestion(s)}
                    className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSuggestions(prev => prev.filter(x => x.item_name !== s.item_name))}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* List heading */}
      <div className="px-4 mb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">הרשימה שלי</h2>
        {activeItems.length > 0 && (
          <button
            onClick={() => {
              if (confirm(`לרוקן את הרשימה? (${activeItems.length} פריטים ימחקו)`)) {
                removeAllItems()
              }
            }}
            className="text-sm text-red-500 font-medium"
          >
            מחק הכל
          </button>
        )}
      </div>

      <ShoppingList
        items={activeItems}
        onCheck={() => {}}
        onRemove={handleRemoveItem}
        onUpdateQuantity={updateQuantity}
        onChangeCategory={handleChangeCategory}
        showRemove
        showCheckbox={false}
        lastPurchased={lastPurchased}
        variant="manager"
      />

      {/* Bought items section */}
      {doneItems.length > 0 && (
        <div className="mt-4 mx-4">
          <button
            onClick={() => setShowBought(!showBought)}
            className="w-full flex items-center gap-2 px-4 py-3 bg-green-100/50 rounded-xl text-green-700"
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
            <div className="mt-2 space-y-2">
              {doneItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white/60 rounded-xl opacity-60"
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

      {/* Removed items section */}
      {removedItems.length > 0 && (
        <div className="mt-4 mx-4">
          <button
            onClick={() => setShowRemoved(!showRemoved)}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-gray-500"
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
            <div className="mt-2 space-y-2">
              {removedItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white/60 rounded-xl opacity-60"
                >
                  <span className="text-lg flex-1 line-through">{item.item_name}</span>
                  <button
                    onClick={() => handleRestoreItem(item)}
                    className="text-green-600 text-sm bg-green-50 px-3 py-1 rounded-lg font-medium"
                  >
                    החזר לרשימה
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Add Button */}
      <FloatingActionButton onClick={() => setShowAddItem(true)} />

      {/* Category Picker Modal */}
      {categoryEditItemId && (
        <CategoryPicker
          onSelect={handleCategorySelected}
          onClose={() => setCategoryEditItemId(null)}
          currentEmoji={items.find(i => i.id === categoryEditItemId)?.category_emoji}
        />
      )}

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
