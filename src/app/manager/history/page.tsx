'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { PurchaseRecord } from '@/lib/types'
import { getCategoryName, getCategoryOrder } from '@/lib/categories'

interface ItemFrequency {
  item_name: string
  category_emoji: string
  count: number
  last_purchased: string
}

function TimelineDateGroup({ date, items }: { date: string; items: PurchaseRecord[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100"
      >
        <div>
          <span className="font-bold text-gray-700">{date}</span>
          <span className="text-sm text-gray-400 mr-2">({items.length} פריטים)</span>
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
      {isOpen && items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">{item.category_emoji}</span>
          </div>
          <span className="font-medium text-gray-700">{item.item_name}</span>
        </div>
      ))}
    </div>
  )
}

export default function HistoryPage() {
  const [records, setRecords] = useState<PurchaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'frequency' | 'timeline'>('frequency')

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('purchase_history')
        .select('*')
        .order('purchased_at', { ascending: false })

      setRecords(data ?? [])
      setLoading(false)
    }
    fetch()
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
    const grouped = new Map<string, PurchaseRecord[]>()

    for (const r of records) {
      if (!grouped.has(r.purchased_at)) {
        grouped.set(r.purchased_at, [])
      }
      grouped.get(r.purchased_at)!.push(r)
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) =>
          getCategoryOrder(a.category_emoji) - getCategoryOrder(b.category_emoji)
        ),
      }))
  }, [records])

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
          {timelineData.map(({ date, items }) => (
            <TimelineDateGroup key={date} date={date} items={items} />
          ))}
        </div>
      )}
    </div>
  )
}
