'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { PurchaseRecord, Receipt } from '@/lib/types'
import { getCategoryName, getCategoryOrder } from '@/lib/categories'

interface ItemFrequency {
  item_name: string
  category_emoji: string
  count: number
  last_purchased: string
}

function TimelineDateGroup({
  date,
  items,
  receiptIds,
  onViewReceipt,
}: {
  date: string
  items: PurchaseRecord[]
  receiptIds: string[]
  onViewReceipt: (receiptId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700">{date}</span>
          <span className="text-sm text-gray-400">({items.length} פריטים)</span>
          {receiptIds.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              קבלה
            </span>
          )}
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
      {isOpen && (
        <>
          {receiptIds.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-50">
              {receiptIds.map((id) => (
                <button
                  key={id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewReceipt(id)
                  }}
                  className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 font-medium hover:bg-green-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>צפה בקבלה</span>
                </button>
              ))}
            </div>
          )}
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">{item.category_emoji}</span>
              </div>
              <span className="font-medium text-gray-700">{item.item_name}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const [records, setRecords] = useState<PurchaseRecord[]>([])
  const [receipts, setReceipts] = useState<Map<string, Receipt>>(new Map())
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'frequency' | 'timeline'>('frequency')
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null)
  const [receiptImageUrls, setReceiptImageUrls] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      const [historyResult, receiptsResult] = await Promise.all([
        supabase
          .from('purchase_history')
          .select('*')
          .order('purchased_at', { ascending: false }),
        supabase
          .from('receipts')
          .select('*')
          .order('created_at', { ascending: false }),
      ])

      setRecords(historyResult.data ?? [])

      const receiptMap = new Map<string, Receipt>()
      for (const r of (receiptsResult.data ?? [])) {
        receiptMap.set(r.id, r)
      }
      setReceipts(receiptMap)
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleViewReceipt = useCallback(async (receiptId: string) => {
    const receipt = receipts.get(receiptId)
    if (!receipt) return

    setViewingReceipt(receipt)

    // Generate signed URLs for the images
    const urls: string[] = []
    for (const path of receipt.image_urls) {
      const { data } = await supabase.storage
        .from('receipts')
        .createSignedUrl(path, 3600) // 1 hour expiry

      if (data?.signedUrl) {
        urls.push(data.signedUrl)
      }
    }
    setReceiptImageUrls(urls)
  }, [receipts])

  const handleCloseReceipt = useCallback(() => {
    setViewingReceipt(null)
    setReceiptImageUrls([])
  }, [])

  const frequencyData = useMemo(() => {
    const freq = new Map<string, ItemFrequency>()

    for (const r of records) {
      const existing = freq.get(r.item_name)
      if (existing) {
        existing.count++
        if (r.purchased_at > existing.last_purchased) {
          existing.last_purchased = r.purchased_at
        }
      } else {
        freq.set(r.item_name, {
          item_name: r.item_name,
          category_emoji: r.category_emoji,
          count: 1,
          last_purchased: r.purchased_at,
        })
      }
    }

    return Array.from(freq.values()).sort((a, b) => b.count - a.count)
  }, [records])

  const timelineData = useMemo(() => {
    const grouped = new Map<string, { items: PurchaseRecord[]; receiptIds: Set<string> }>()

    // Group purchase history by date
    for (const r of records) {
      if (!grouped.has(r.purchased_at)) {
        grouped.set(r.purchased_at, { items: [], receiptIds: new Set() })
      }
      const group = grouped.get(r.purchased_at)!
      group.items.push(r)
      if (r.receipt_id) group.receiptIds.add(r.receipt_id)
    }

    // Also include standalone receipts (not linked to any purchase_history rows)
    const linkedReceiptIds = new Set<string>()
    for (const r of records) {
      if (r.receipt_id) linkedReceiptIds.add(r.receipt_id)
    }
    for (const [id, receipt] of receipts) {
      if (!linkedReceiptIds.has(id)) {
        const date = receipt.purchased_at
        if (!grouped.has(date)) {
          grouped.set(date, { items: [], receiptIds: new Set() })
        }
        grouped.get(date)!.receiptIds.add(id)
      }
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, { items, receiptIds }]) => ({
        date,
        items: items.sort((a, b) =>
          getCategoryOrder(a.category_emoji) - getCategoryOrder(b.category_emoji)
        ),
        receiptIds: Array.from(receiptIds),
      }))
  }, [records, receipts])

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
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-400">{records.length} רשומות</span>
          <h1 className="text-xl font-bold text-gray-800">היסטוריית קניות</h1>
        </div>
      </div>

      {/* Pill toggle */}
      <div className="px-4 mb-4">
        <div className="flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setView('frequency')}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              view === 'frequency'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-500'
            }`}
          >
            לפי תדירות
          </button>
          <button
            onClick={() => setView('timeline')}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              view === 'timeline'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-500'
            }`}
          >
            לפי תאריך
          </button>
        </div>
      </div>

      {/* Frequency View */}
      {view === 'frequency' && (
        <div className="mx-4 bg-white rounded-2xl overflow-hidden card-shadow">
          {frequencyData.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-gray-50 last:border-0">
              {/* Category emoji in circle */}
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{item.category_emoji}</span>
              </div>

              {/* Name + category */}
              <div className="flex-1 min-w-0">
                <span className="font-bold text-gray-800 block">{item.item_name}</span>
                <span className="text-sm text-gray-400">{getCategoryName(item.category_emoji)}</span>
              </div>

              {/* Count + date */}
              <div className="text-left flex-shrink-0">
                <span className="text-xl font-bold text-green-600 block">{item.count}x</span>
                <span className="text-xs text-gray-400">{item.last_purchased}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="px-4 space-y-4">
          {timelineData.map(({ date, items, receiptIds }) => (
            <TimelineDateGroup
              key={date}
              date={date}
              items={items}
              receiptIds={receiptIds}
              onViewReceipt={handleViewReceipt}
            />
          ))}
        </div>
      )}

      {/* Receipt Image Viewer Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/50">
            <h2 className="text-white font-bold">
              קבלה — {viewingReceipt.purchased_at}
            </h2>
            <button
              onClick={handleCloseReceipt}
              className="text-white p-1"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Images */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {receiptImageUrls.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <svg className="animate-spin w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              receiptImageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`קבלה תמונה ${i + 1}`}
                  className="w-full rounded-lg"
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
