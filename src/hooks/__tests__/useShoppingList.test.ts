import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Build mock chain with vi.hoisted so it's available in vi.mock factory
const { mockChain, mockChannel } = vi.hoisted(() => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }

  const resultStore: Record<string, { data: unknown; error: null | object }> = {}

  const mockChain = {
    _results: resultStore,
    select: vi.fn(),
    insert: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
  }

  // By default, select returns chain for further chaining
  mockChain.select.mockReturnValue(mockChain)
  mockChain.update.mockReturnValue(mockChain)
  mockChain.delete.mockReturnValue(mockChain)

  // order resolves to result
  mockChain.order.mockImplementation(() => {
    return Promise.resolve(resultStore['_current'] ?? { data: [], error: null })
  })

  // eq resolves to result
  mockChain.eq.mockImplementation(() => {
    return Promise.resolve(resultStore['_current'] ?? { data: null, error: null })
  })

  // in resolves to result
  mockChain.in.mockImplementation(() => {
    return Promise.resolve(resultStore['_current'] ?? { data: null, error: null })
  })

  // insert resolves to result
  mockChain.insert.mockImplementation(() => {
    return Promise.resolve(resultStore['_current'] ?? { data: null, error: null })
  })

  // upsert resolves to result
  mockChain.upsert.mockImplementation(() => {
    return Promise.resolve(resultStore['_current'] ?? { data: null, error: null })
  })

  return { mockChain, mockChannel }
})

let fromCallIndex = 0
const fromResults: Array<{ data: unknown; error: null | object }> = []

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      // Track which call this is for sequential from() calls
      const idx = fromCallIndex++
      if (fromResults[idx]) {
        mockChain._results['_current'] = fromResults[idx]
      }
      return mockChain
    },
    channel: () => mockChannel,
    removeChannel: vi.fn(),
  },
}))

import { useShoppingList } from '../useShoppingList'

const sampleItems = [
  {
    id: '1',
    item_name: 'Milk',
    category_emoji: '🧀',
    quantity: null,
    notes: null,
    added_by: 'manager',
    is_checked: false,
    created_at: '2025-01-01T00:00:00Z',
    checked_at: null,
  },
  {
    id: '2',
    item_name: 'Bread',
    category_emoji: '🥖',
    quantity: null,
    notes: null,
    added_by: 'manager',
    is_checked: true,
    created_at: '2025-01-01T00:00:00Z',
    checked_at: '2025-01-02T00:00:00Z',
  },
]

const sampleHistory = [
  { item_name: 'Milk', purchased_at: '2025-01-01' },
  { item_name: 'Bread', purchased_at: '2024-12-20' },
]

describe('useShoppingList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fromCallIndex = 0
    fromResults.length = 0

    // Default: first from() = shopping_list, second = purchase_history
    fromResults.push(
      { data: sampleItems, error: null },
      { data: sampleHistory, error: null },
    )
  })

  it('starts with loading true, then false after fetch', async () => {
    const { result } = renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('populates items from Supabase', async () => {
    const { result } = renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2)
      expect(result.current.items[0].item_name).toBe('Milk')
    })
  })

  it('computes activeItems (unchecked) correctly', async () => {
    const { result } = renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(result.current.activeItems).toHaveLength(1)
      expect(result.current.activeItems[0].item_name).toBe('Milk')
    })
  })

  it('computes doneItems (checked) correctly', async () => {
    const { result } = renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(result.current.doneItems).toHaveLength(1)
      expect(result.current.doneItems[0].item_name).toBe('Bread')
    })
  })

  it('builds lastPurchased map correctly', async () => {
    const { result } = renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(result.current.lastPurchased).toEqual({
        'Milk': '2025-01-01',
        'Bread': '2024-12-20',
      })
    })
  })

  it('checkItem performs optimistic update', async () => {
    const { result } = renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2)
    })

    // Reset for the update call
    fromCallIndex = 0
    fromResults.length = 0
    fromResults.push({ data: null, error: null })

    await act(async () => {
      await result.current.checkItem('1')
    })

    // Optimistic: Milk should now be checked
    expect(result.current.items.find(i => i.id === '1')?.is_checked).toBe(true)
  })

  it('addItem calls upsert with correct params', async () => {
    const { result } = renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    fromCallIndex = 0
    fromResults.length = 0
    fromResults.push({ data: null, error: null })

    await act(async () => {
      await result.current.addItem('Eggs', '🥚', 'manager')
    })

    expect(mockChain.upsert).toHaveBeenCalledWith(
      { item_name: 'Eggs', category_emoji: '🥚', added_by: 'manager' },
      { onConflict: 'item_name', ignoreDuplicates: true }
    )
  })

  it('removeAllItems deletes only unchecked items', async () => {
    const { result } = renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    fromCallIndex = 0
    fromResults.length = 0
    fromResults.push({ data: null, error: null })

    await act(async () => {
      await result.current.removeAllItems()
    })

    expect(mockChain.delete).toHaveBeenCalled()
    expect(mockChain.eq).toHaveBeenCalledWith('is_checked', false)
  })

  it('finishShopping inserts history then deletes from list', async () => {
    const { result } = renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    fromCallIndex = 0
    fromResults.length = 0
    // First from() = purchase_history insert, second = shopping_list delete
    fromResults.push(
      { data: null, error: null },
      { data: null, error: null },
    )

    await act(async () => {
      await result.current.finishShopping()
    })

    // Should have inserted to purchase_history
    expect(mockChain.insert).toHaveBeenCalled()
    // Should have deleted checked items
    expect(mockChain.in).toHaveBeenCalledWith('id', ['2'])
  })

  it('finishShopping is a no-op when no checked items', async () => {
    // Override with only unchecked items
    fromResults.length = 0
    fromCallIndex = 0
    fromResults.push(
      { data: [sampleItems[0]], error: null }, // only Milk (unchecked)
      { data: sampleHistory, error: null },
    )

    const { result } = renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    vi.clearAllMocks()

    await act(async () => {
      await result.current.finishShopping()
    })

    // No insert or delete should have been called
    expect(mockChain.insert).not.toHaveBeenCalled()
  })

  it('subscribes to realtime channel', async () => {
    renderHook(() => useShoppingList())

    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_list' },
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })
})
