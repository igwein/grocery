'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { PurchaseRecord } from '@/lib/types'
import { getCategoryName, getCategoryOrder } from '@/lib/categories'

interface ItemFrequency {
  item_name: string
  category_emoji: string
  count: number
  last_purchased: string
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
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <Link href="/manager" className="text-green-100 hover:text-white">
            &rarr; חזרה
          </Link>
          <h1 className="text-xl font-bold">היסטוריית קניות</h1>
          <span className="text-sm text-green-200">{records.length} רשומות</span>
        </div>
      </header>

      {/* View Toggle */}
      <div className="flex gap-2 p-4">
        <button
          onClick={() => setView('frequency')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'frequency'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          לפי תדירות
        </button>
        <button
          onClick={() => setView('timeline')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'timeline'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          לפי תאריך
        </button>
      </div>

      {/* Frequency View */}
      {view === 'frequency' && (
        <div className="bg-white mx-4 rounded-xl overflow-hidden">
          {frequencyData.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <span className="text-xl">{item.category_emoji}</span>
              <span className="flex-1">{item.item_name}</span>
              <div className="text-left">
                <span className="text-sm font-semibold text-green-600">{item.count}x</span>
                <p className="text-xs text-gray-400">{item.last_purchased}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="px-4 space-y-4">
          {timelineData.map(({ date, items }) => (
            <div key={date} className="bg-white rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <span className="font-semibold text-gray-700">{date}</span>
                <span className="text-sm text-gray-400 mr-2">({items.length} פריטים)</span>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 border-b border-gray-50">
                  <span>{item.category_emoji}</span>
                  <span className="text-sm">{item.item_name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
