import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock } from '@/test/mocks/supabase'

const supabaseMock = createSupabaseMock()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => supabaseMock.client,
}))

// Save original fetch
const originalFetch = global.fetch

import { POST } from '../route'

describe('POST /api/generate-list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-key'
    // Reset fetch
    global.fetch = originalFetch
  })

  it('returns error when purchase history is empty', async () => {
    supabaseMock.setResult('purchase_history', [])

    const response = await POST()
    const data = await response.json()

    expect(data).toEqual({
      success: false,
      error: 'No purchase history found',
    })
  })

  it('returns error when purchase history is null', async () => {
    supabaseMock.setResult('purchase_history', null)

    const response = await POST()
    const data = await response.json()

    expect(data).toEqual({
      success: false,
      error: 'No purchase history found',
    })
  })

  it('returns suggestions on successful Gemini response', async () => {
    const history = [
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-01' },
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-08' },
    ]
    supabaseMock.setResult('purchase_history', history)
    supabaseMock.setResult('shopping_list', [])

    const suggestions = [
      { item_name: 'milk', category_emoji: '🧀', confidence: 'high' },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ text: JSON.stringify(suggestions) }],
          },
        }],
      }),
    })

    const response = await POST()
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toEqual(suggestions)
  })

  it('returns error when Gemini API fails', async () => {
    supabaseMock.setResult('purchase_history', [
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-01' },
    ])
    supabaseMock.setResult('shopping_list', [])

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'API error' }),
    })

    const response = await POST()
    const data = await response.json()

    expect(data).toEqual({ success: false, error: 'AI generation failed' })
  })

  it('returns error when Gemini returns empty response', async () => {
    supabaseMock.setResult('purchase_history', [
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-01' },
    ])
    supabaseMock.setResult('shopping_list', [])

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [] } }],
      }),
    })

    const response = await POST()
    const data = await response.json()

    expect(data).toEqual({ success: false, error: 'Empty AI response' })
  })

  it('handles Gemini response with markdown fences', async () => {
    supabaseMock.setResult('purchase_history', [
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-01' },
    ])
    supabaseMock.setResult('shopping_list', [])

    const suggestions = [{ item_name: 'milk', category_emoji: '🧀', confidence: 'high' }]
    const fencedJson = '```json\n' + JSON.stringify(suggestions) + '\n```'

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: fencedJson }] } }],
      }),
    })

    const response = await POST()
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toEqual(suggestions)
  })

  it('filters out thought parts from Gemini response', async () => {
    supabaseMock.setResult('purchase_history', [
      { item_name: 'milk', category_emoji: '🧀', purchased_at: '2025-01-01' },
    ])
    supabaseMock.setResult('shopping_list', [])

    const suggestions = [{ item_name: 'milk', category_emoji: '🧀', confidence: 'high' }]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [
              { text: 'Let me think about this...', thought: true },
              { text: JSON.stringify(suggestions) },
            ],
          },
        }],
      }),
    })

    const response = await POST()
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toEqual(suggestions)
  })
})
