'use client'

import { useState } from 'react'
import { useShoppingList } from '@/hooks/useShoppingList'
import { ShoppingList } from '@/components/ShoppingList'
import { AddItemInput } from '@/components/AddItemInput'

export default function ShopperPage() {
  const {
    activeItems,
    doneItems,
    lastPurchased,
    loading,
    checkItem,
    addItem,
    finishShopping,
  } = useShoppingList()

  const [showAddItem, setShowAddItem] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)

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
          <h1 className="text-xl font-bold">רשימת קניות</h1>
          <div className="flex items-center gap-3">
            <span className="bg-green-700 px-3 py-1 rounded-full text-sm">
              {activeItems.length} פריטים
            </span>
          </div>
        </div>
      </header>

      {/* Active Items */}
      <ShoppingList
        items={activeItems}
        onCheck={checkItem}
        lastPurchased={lastPurchased}
      />

      {/* Done Section */}
      {doneItems.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowDone(!showDone)}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-500"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showDone ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-medium">נקנו ({doneItems.length})</span>
          </button>

          {showDone && (
            <div className="bg-gray-50">
              <ShoppingList
                items={doneItems}
                onCheck={checkItem}
              />
            </div>
          )}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3">
        {doneItems.length > 0 && (
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="flex-1 bg-green-600 text-white rounded-xl py-3 text-lg font-semibold"
          >
            סיים קניות
          </button>
        )}
        <button
          onClick={() => setShowAddItem(true)}
          className="bg-green-100 text-green-700 rounded-xl px-4 py-3 text-lg font-semibold"
        >
          + הוסף
        </button>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <AddItemInput
          onAdd={(name, emoji) => addItem(name, emoji, 'shopper')}
          onClose={() => setShowAddItem(false)}
        />
      )}

      {/* Finish Shopping Confirmation */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <p className="text-lg font-semibold mb-2">סיים קניות?</p>
            <p className="text-gray-500 mb-6">
              {doneItems.length} פריטים שנקנו יועברו להיסטוריה
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 border border-gray-300 rounded-xl py-3 text-gray-600"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  finishShopping()
                  setShowFinishConfirm(false)
                  setShowDone(false)
                }}
                className="flex-1 bg-green-600 text-white rounded-xl py-3 font-semibold"
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
