'use client'

import { useState, useMemo } from 'react'
import { useShoppingList } from '@/hooks/useShoppingList'
import { ShoppingList } from '@/components/ShoppingList'
import { AddItemInput } from '@/components/AddItemInput'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'

export default function ShopperPage() {
  const {
    activeItems,
    doneItems,
    lastPurchased,
    loading,
    checkItem,
    updateQuantity,
    addItem,
    removeItem,
    finishShopping,
  } = useShoppingList()

  const allItemNames = useMemo(() => [...activeItems, ...doneItems].map(i => i.item_name), [activeItems, doneItems])
  const [showAddItem, setShowAddItem] = useState(false)
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
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              {activeItems.length} פריטים
            </span>
            <button className="p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Active Items */}
      <div className="pt-2">
        <ShoppingList
          items={activeItems}
          onCheck={checkItem}
          onRemove={removeItem}
          onUpdateQuantity={updateQuantity}
          showRemove
          lastPurchased={lastPurchased}
          variant="shopper"
        />
      </div>

      {/* Done Section */}
      {doneItems.length > 0 && (
        <div className="mt-4 mx-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 font-medium">פריטים שנקנו</h3>
            <span className="text-sm text-gray-400">{doneItems.length} פריטים</span>
          </div>
          <div className="space-y-2">
            {doneItems.map(item => (
              <div
                key={item.id}
                onClick={() => checkItem(item.id)}
                className="flex items-center gap-3 px-4 py-3 bg-white/60 rounded-xl cursor-pointer"
              >
                {/* Green filled checkmark */}
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-lg font-semibold text-gray-500 line-through">{item.item_name}</span>
                  {item.quantity && (
                    <span className="text-sm text-gray-400 block">{item.quantity}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom: Finish Shopping Button */}
      {doneItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-20">
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="w-full green-gradient text-white rounded-2xl py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            <span>🛒</span>
            <span>סיימתי לקנות</span>
          </button>
        </div>
      )}

      {/* Floating Add Button */}
      <FloatingActionButton onClick={() => setShowAddItem(true)} />

      {/* Add Item Modal */}
      {showAddItem && (
        <AddItemInput
          onAdd={(name, emoji) => addItem(name, emoji, 'shopper')}
          onClose={() => setShowAddItem(false)}
          currentItemNames={allItemNames}
        />
      )}

      {/* Finish Shopping Confirmation */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center card-shadow">
            <p className="text-lg font-bold mb-2">סיים קניות?</p>
            <p className="text-gray-500 mb-6">
              {doneItems.length} פריטים שנקנו יועברו להיסטוריה
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 border border-gray-300 rounded-xl py-3 text-gray-600 font-medium"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  finishShopping()
                  setShowFinishConfirm(false)
                }}
                className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold"
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
