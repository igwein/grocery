'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ShoppingListItem } from '@/lib/types'

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [lastPurchased, setLastPurchased] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    const [listResult, historyResult] = await Promise.all([
      supabase
        .from('shopping_list')
        .select('*')
        .order('created_at', { ascending: true }),
      supabase
        .from('purchase_history')
        .select('item_name, purchased_at')
        .order('purchased_at', { ascending: false }),
    ])

    if (listResult.error) {
      console.error('Error fetching shopping list:', listResult.error)
      setLoading(false)
      return
    }
    setItems(listResult.data ?? [])

    // Build last-purchased map (first occurrence per item is the latest due to desc order)
    if (historyResult.data) {
      const map: Record<string, string> = {}
      for (const row of historyResult.data) {
        if (!map[row.item_name]) {
          map[row.item_name] = row.purchased_at
        }
      }
      setLastPurchased(map)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    let ignore = false

    async function initialFetch() {
      const [listResult, historyResult] = await Promise.all([
        supabase
          .from('shopping_list')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('purchase_history')
          .select('item_name, purchased_at')
          .order('purchased_at', { ascending: false }),
      ])

      if (ignore) return

      if (listResult.error) {
        console.error('Error fetching shopping list:', listResult.error)
        setLoading(false)
        return
      }
      setItems(listResult.data ?? [])

      if (historyResult.data) {
        const map: Record<string, string> = {}
        for (const row of historyResult.data) {
          if (!map[row.item_name]) {
            map[row.item_name] = row.purchased_at
          }
        }
        setLastPurchased(map)
      }

      setLoading(false)
    }

    initialFetch()

    const channel = supabase
      .channel('shopping_list_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_list' },
        () => {
          fetchItems()
        }
      )
      .subscribe()

    return () => {
      ignore = true
      supabase.removeChannel(channel)
    }
  }, [fetchItems])

  const checkItem = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    const newChecked = !item.is_checked
    setItems(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, is_checked: newChecked, checked_at: newChecked ? new Date().toISOString() : null }
          : i
      )
    )

    await supabase
      .from('shopping_list')
      .update({
        is_checked: newChecked,
        checked_at: newChecked ? new Date().toISOString() : null,
      })
      .eq('id', id)
  }, [items])

  const addItem = useCallback(async (
    itemName: string,
    categoryEmoji: string,
    addedBy: string = 'shopper'
  ) => {
    const { error } = await supabase
      .from('shopping_list')
      .upsert(
        {
          item_name: itemName,
          category_emoji: categoryEmoji,
          added_by: addedBy,
        },
        { onConflict: 'item_name', ignoreDuplicates: true }
      )

    if (error) {
      console.error('Error adding item:', error)
    }
  }, [])

  const addItems = useCallback(async (
    itemsToAdd: { itemName: string; categoryEmoji: string; addedBy?: string }[]
  ) => {
    if (itemsToAdd.length === 0) return
    const rows = itemsToAdd.map(i => ({
      item_name: i.itemName,
      category_emoji: i.categoryEmoji,
      added_by: i.addedBy ?? 'manager',
    }))
    const { error } = await supabase
      .from('shopping_list')
      .upsert(rows, { onConflict: 'item_name', ignoreDuplicates: true })

    if (error) {
      console.error('Error adding items:', error)
    }
  }, [])

  const updateQuantity = useCallback(async (id: string, quantity: string | null) => {
    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity } : i)
    )

    const { error } = await supabase
      .from('shopping_list')
      .update({ quantity })
      .eq('id', id)

    if (error) {
      console.error('Error updating quantity:', error)
    }
  }, [])

  const removeItem = useCallback(async (id: string) => {
    await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id)
  }, [])

  const removeAllItems = useCallback(async () => {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('is_checked', false)

    if (error) {
      console.error('Error removing all items:', error)
    }
  }, [])

  const finishShopping = useCallback(async () => {
    const checkedItems = items.filter(i => i.is_checked)
    if (checkedItems.length === 0) return

    // Move checked items to purchase history
    const historyRows = checkedItems.map(item => ({
      item_name: item.item_name,
      category_emoji: item.category_emoji,
      purchased_at: new Date().toISOString().split('T')[0],
      source: 'app',
    }))

    const { error: historyError } = await supabase
      .from('purchase_history')
      .insert(historyRows)

    if (historyError) {
      console.error('Error saving to history:', historyError)
      return
    }

    // Remove checked items from shopping list
    const checkedIds = checkedItems.map(i => i.id)
    await supabase
      .from('shopping_list')
      .delete()
      .in('id', checkedIds)
  }, [items])

  const addToHistory = useCallback(async (
    entries: { item_name: string; category_emoji: string; purchased_at: string; source: string }[]
  ) => {
    if (entries.length === 0) return

    // Insert into purchase history
    const { error: historyError } = await supabase
      .from('purchase_history')
      .insert(entries)

    if (historyError) {
      console.error('Error saving to history:', historyError)
      return
    }

    // Upsert into items_catalog so new items appear in autocomplete
    const catalogRows = entries.map(e => ({
      name: e.item_name,
      category_emoji: e.category_emoji,
    }))
    await supabase
      .from('items_catalog')
      .upsert(catalogRows, { onConflict: 'name', ignoreDuplicates: true })
  }, [])

  const activeItems = items.filter(i => !i.is_checked)
  const doneItems = items.filter(i => i.is_checked)

  return {
    items,
    activeItems,
    doneItems,
    lastPurchased,
    loading,
    checkItem,
    addItem,
    addItems,
    updateQuantity,
    removeItem,
    removeAllItems,
    addToHistory,
    finishShopping,
    refetch: fetchItems,
  }
}
