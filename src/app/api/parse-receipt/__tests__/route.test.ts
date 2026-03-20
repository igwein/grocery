import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock } from '@/test/mocks/supabase'

const supabaseMock = createSupabaseMock()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => supabaseMock.client,
}))

const originalFetch = global.fetch

import { parseReceiptImages } from '../route'

describe('parseReceiptImages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-key'
    global.fetch = originalFetch
  })

  it('returns error when no images are provided', async () => {
    const result = await parseReceiptImages([])
    expect(result).toEqual({
      success: false,
      error: 'No images uploaded. Please upload at least one receipt image.',
    })
  })

  it('returns error when too many images are provided', async () => {
    const images = Array.from({ length: 6 }, (_, i) => ({
      data: 'base64data',
      mimeType: 'image/jpeg',
    }))
    const result = await parseReceiptImages(images)
    expect(result).toEqual({
      success: false,
      error: 'Too many images. Maximum 5 images allowed.',
    })
  })

  it('returns error when image has invalid mime type', async () => {
    const images = [{ data: 'base64data', mimeType: 'application/pdf' }]
    const result = await parseReceiptImages(images)
    expect(result).toEqual({
      success: false,
      error: 'Invalid file type: application/pdf. Only JPEG, PNG, and WebP images are allowed.',
    })
  })

  it('returns parsed items on successful Gemini response', async () => {
    supabaseMock.setResult('items_catalog', [
      { name: 'חלב', category_emoji: '🧀' },
      { name: 'לחם', category_emoji: '🥖' },
    ])

    const receiptItems = [
      { receipt_name: 'חלב תנובה 3%', item_name: 'חלב', category_emoji: '🧀', quantity: '2', price: '12.90' },
      { receipt_name: 'לחם אחיד', item_name: 'לחם', category_emoji: '🥖', quantity: null, price: '8.50' },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ text: JSON.stringify(receiptItems) }],
          },
        }],
      }),
    })

    const images = [{ data: 'base64-image-data', mimeType: 'image/jpeg' }]
    const result = await parseReceiptImages(images)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(receiptItems)
  })

  it('returns error when Gemini API fails', async () => {
    supabaseMock.setResult('items_catalog', [])

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'API error' }),
    })

    const images = [{ data: 'base64data', mimeType: 'image/jpeg' }]
    const result = await parseReceiptImages(images)

    expect(result).toEqual({ success: false, error: 'Receipt parsing failed' })
  })

  it('returns error when Gemini returns empty response', async () => {
    supabaseMock.setResult('items_catalog', [])

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [] } }],
      }),
    })

    const images = [{ data: 'base64data', mimeType: 'image/jpeg' }]
    const result = await parseReceiptImages(images)

    expect(result).toEqual({ success: false, error: 'Empty AI response' })
  })

  it('sends images as inlineData parts to Gemini', async () => {
    supabaseMock.setResult('items_catalog', [])

    const receiptItems = [
      { receipt_name: 'test', item_name: 'test', category_emoji: '🧀', quantity: null, price: null },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: { parts: [{ text: JSON.stringify(receiptItems) }] },
        }],
      }),
    })

    const images = [
      { data: 'image-data-1', mimeType: 'image/jpeg' },
      { data: 'image-data-2', mimeType: 'image/png' },
    ]
    await parseReceiptImages(images)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(callArgs[1].body)

    const parts = body.contents[0].parts
    expect(parts).toHaveLength(3) // 2 images + 1 text prompt
    expect(parts[0]).toHaveProperty('inlineData')
    expect(parts[0].inlineData.mimeType).toBe('image/jpeg')
    expect(parts[1]).toHaveProperty('inlineData')
    expect(parts[1].inlineData.mimeType).toBe('image/png')
    expect(parts[2]).toHaveProperty('text')
  })

  it('handles markdown-fenced Gemini response', async () => {
    supabaseMock.setResult('items_catalog', [])

    const receiptItems = [
      { receipt_name: 'חלב', item_name: 'חלב', category_emoji: '🧀', quantity: null, price: '12.90' },
    ]
    const fencedJson = '```json\n' + JSON.stringify(receiptItems) + '\n```'

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: fencedJson }] } }],
      }),
    })

    const images = [{ data: 'base64data', mimeType: 'image/jpeg' }]
    const result = await parseReceiptImages(images)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(receiptItems)
  })
})
