'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useShoppingList } from '@/hooks/useShoppingList'
import { ShoppingList } from '@/components/ShoppingList'
import { AddItemInput } from '@/components/AddItemInput'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { ReceiptItem } from '@/lib/types'

/**
 * Compress an image file to max 1600px width, JPEG quality 0.7.
 * Returns a compressed File object suitable for upload.
 */
function compressImage(file: File, maxWidth = 1600, quality = 0.7): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
          } else {
            resolve(file) // fallback to original
          }
        },
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => resolve(file) // fallback to original
    img.src = URL.createObjectURL(file)
  })
}

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
    addToHistory,
    finishShopping,
    finishing,
  } = useShoppingList()

  const allItemNames = useMemo(() => [...activeItems, ...doneItems].map(i => i.item_name), [activeItems, doneItems])
  const [showAddItem, setShowAddItem] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)

  // Receipt scanning state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [receiptPhotos, setReceiptPhotos] = useState<File[]>([])
  const [receiptPhotoUrls, setReceiptPhotoUrls] = useState<string[]>([])
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([])
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [showReceiptReview, setShowReceiptReview] = useState(false)
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split('T')[0])
  const [receiptParsing, setReceiptParsing] = useState(false)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [receiptSaved, setReceiptSaved] = useState(false)

  const handlePhotosSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles = Array.from(files)
    setReceiptPhotos(prev => [...prev, ...newFiles])
    setReceiptPhotoUrls(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))])
    setReceiptError(null)

    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleRemovePhoto = useCallback((index: number) => {
    setReceiptPhotoUrls(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
    setReceiptPhotos(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleClearPhotos = useCallback(() => {
    receiptPhotoUrls.forEach(url => URL.revokeObjectURL(url))
    setReceiptPhotos([])
    setReceiptPhotoUrls([])
    setReceiptError(null)
  }, [receiptPhotoUrls])

  const [receiptStoring, setReceiptStoring] = useState(false)

  const handleSubmitReceipt = useCallback(async (storeOnly = false) => {
    if (receiptPhotos.length === 0) return

    if (storeOnly) {
      setReceiptStoring(true)
    } else {
      setReceiptParsing(true)
    }
    setReceiptError(null)
    setReceiptSaved(false)

    try {
      // Compress images before upload to avoid body size limits
      const compressed = await Promise.all(receiptPhotos.map(f => compressImage(f)))

      const formData = new FormData()
      for (const file of compressed) {
        formData.append('images', file)
      }
      if (storeOnly) {
        formData.append('storeOnly', 'true')
      }

      const res = await fetch('/api/parse-receipt', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success && data.data) {
        receiptPhotoUrls.forEach(url => URL.revokeObjectURL(url))
        setReceiptPhotos([])
        setReceiptPhotoUrls([])

        if (storeOnly) {
          // Store only — no review needed, just show success
          setReceiptSaved(true)
          setReceiptId(data.data.receipt_id)
          setTimeout(() => setReceiptSaved(false), 2000)
        } else {
          setReceiptItems(data.data.items)
          setReceiptId(data.data.receipt_id)
          setReceiptDate(new Date().toISOString().split('T')[0])
          setShowReceiptReview(true)
        }
      } else {
        setReceiptError(data.error || 'שגיאה בעיבוד הקבלה')
      }
    } catch {
      setReceiptError('שגיאה בעיבוד הקבלה')
    } finally {
      setReceiptParsing(false)
      setReceiptStoring(false)
    }
  }, [receiptPhotos, receiptPhotoUrls])

  const handleRemoveReceiptItem = useCallback((index: number) => {
    setReceiptItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleAcceptReceiptItem = useCallback(async (index: number) => {
    const item = receiptItems[index]
    if (!item) return

    await addToHistory([{
      item_name: item.item_name,
      category_emoji: item.category_emoji,
      purchased_at: receiptDate,
      source: 'receipt',
      receipt_id: receiptId,
    }])

    setReceiptItems(prev => prev.filter((_, i) => i !== index))
  }, [receiptItems, receiptDate, receiptId, addToHistory])

  const handleSaveReceipt = useCallback(async () => {
    if (receiptItems.length === 0) return

    const entries = receiptItems.map(item => ({
      item_name: item.item_name,
      category_emoji: item.category_emoji,
      purchased_at: receiptDate,
      source: 'receipt',
      receipt_id: receiptId,
    }))

    await addToHistory(entries)
    setReceiptSaved(true)
    setTimeout(() => {
      setShowReceiptReview(false)
      setReceiptItems([])
      setReceiptId(null)
      setReceiptSaved(false)
    }, 1500)
  }, [receiptItems, receiptDate, receiptId, addToHistory])

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
        </div>
      </header>

      {/* Receipt Scan Section */}
      <div className="px-4 pt-3">
        {receiptPhotos.length === 0 ? (
          /* Initial button — no photos yet */
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={receiptParsing}
            className="w-full bg-white rounded-2xl py-3 px-4 card-shadow flex items-center justify-center gap-2 text-green-700 font-semibold disabled:opacity-60"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>סרוק קבלה</span>
          </button>
        ) : (
          /* Photo preview panel */
          <div className="bg-white rounded-2xl p-3 card-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {receiptPhotos.length} תמונות קבלה
              </span>
              <button
                onClick={handleClearPhotos}
                className="text-xs text-gray-400"
              >
                נקה הכל
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {receiptPhotoUrls.map((url, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img
                    src={url}
                    alt={`קבלה ${i + 1}`}
                    className="w-16 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add more button */}
              {receiptPhotos.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-20 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[10px] mt-0.5">הוסף</span>
                </button>
              )}
            </div>

            {/* Submit button */}
            {/* Action buttons */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleSubmitReceipt(false)}
                disabled={receiptParsing || receiptStoring}
                className="flex-1 bg-green-600 text-white rounded-xl py-2.5 font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {receiptParsing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>מנתח...</span>
                  </>
                ) : (
                  <span>נתח קבלה</span>
                )}
              </button>
              <button
                onClick={() => handleSubmitReceipt(true)}
                disabled={receiptParsing || receiptStoring}
                className="flex-[0.6] border-2 border-green-600 text-green-700 rounded-xl py-2.5 font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {receiptStoring ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>שומר...</span>
                  </>
                ) : (
                  <span>שמור בלבד</span>
                )}
              </button>
            </div>
            {receiptSaved && !showReceiptReview && (
              <p className="text-green-600 text-sm text-center mt-2 font-medium">הקבלה נשמרה בהצלחה!</p>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotosSelected}
          className="hidden"
        />
        {receiptError && (
          <p className="text-red-500 text-sm text-center mt-2">{receiptError}</p>
        )}
      </div>

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
                disabled={finishing}
                onClick={async () => {
                  await finishShopping()
                  setShowFinishConfirm(false)
                }}
                className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold disabled:opacity-50"
              >
                {finishing ? 'שומר...' : 'אישור'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Review Modal */}
      {showReceiptReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-h-[85vh] flex flex-col card-shadow">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">פריטים מהקבלה</h2>
              <button
                onClick={() => {
                  setShowReceiptReview(false)
                  setReceiptItems([])
                  setReceiptId(null)
                }}
                className="text-gray-400 p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Date Picker */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-600">תאריך קנייה:</label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
                dir="ltr"
              />
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {receiptSaved ? (
                <div className="flex flex-col items-center justify-center py-12 text-green-600">
                  <svg className="w-16 h-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-lg font-bold">נשמר להיסטוריה!</p>
                </div>
              ) : receiptItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-green-600">
                  <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="font-bold">כל הפריטים נשמרו</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-gray-400 mb-2">{receiptItems.length} פריטים זוהו</p>
                  {receiptItems.map((item, index) => (
                    <div
                      key={`${item.item_name}-${index}`}
                      className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-xl">{item.category_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{item.item_name}</p>
                        {item.receipt_name !== item.item_name && (
                          <p className="text-xs text-gray-400 truncate">{item.receipt_name}</p>
                        )}
                        <div className="flex gap-3 mt-0.5">
                          {item.quantity && (
                            <span className="text-xs text-green-600">{item.quantity}</span>
                          )}
                          {item.price && (
                            <span className="text-xs text-gray-500">₪{item.price}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcceptReceiptItem(index)}
                        className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0"
                        aria-label="שמור פריט"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveReceiptItem(index)}
                        className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center flex-shrink-0"
                        aria-label="הסר פריט"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            {!receiptSaved && receiptItems.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={handleSaveReceipt}
                  className="w-full bg-green-600 text-white rounded-xl py-3 font-bold text-lg"
                >
                  שמור הכל להיסטוריה ({receiptItems.length} פריטים)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
