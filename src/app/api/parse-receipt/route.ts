import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ReceiptItem, ReceiptParseResult, ApiResponse } from '@/lib/types'
import { buildReceiptParsePrompt, sanitizeLLMJson, parseLLMJson } from '@/lib/prompt-builder'
import { CATEGORIES } from '@/lib/categories'

// Increase max duration for Gemini vision processing (default is 10s on Vercel)
export const maxDuration = 60

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGES = 5

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export interface ImageInput {
  data: string
  mimeType: string
}

/**
 * Core receipt parsing logic — exported for testability.
 */
export async function parseReceiptImages(
  images: ImageInput[],
): Promise<ApiResponse<ReceiptItem[]>> {
  if (images.length === 0) {
    return {
      success: false,
      error: 'No images uploaded. Please upload at least one receipt image.',
    }
  }

  if (images.length > MAX_IMAGES) {
    return {
      success: false,
      error: `Too many images. Maximum ${MAX_IMAGES} images allowed.`,
    }
  }

  for (const image of images) {
    if (!ALLOWED_MIME_TYPES.includes(image.mimeType)) {
      return {
        success: false,
        error: `Invalid file type: ${image.mimeType}. Only JPEG, PNG, and WebP images are allowed.`,
      }
    }
  }

  // Build Gemini inlineData parts
  const imageParts = images.map((img) => ({
    inlineData: {
      mimeType: img.mimeType,
      data: img.data,
    },
  }))

  // Fetch catalog items for matching context
  const supabase = createServerClient()
  const { data: catalog } = await supabase
    .from('items_catalog')
    .select('name, category_emoji')

  const catalogNames = (catalog ?? []).map((c: { name: string }) => c.name)
  const categories = CATEGORIES.map(c => ({ emoji: c.emoji, name: c.name }))
  const prompt = buildReceiptParsePrompt(catalogNames, categories)

  // Call Gemini Vision API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            ...imageParts,
            { text: prompt },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    console.error('Gemini API error:', JSON.stringify(result, null, 2))
    const detail = result?.error?.message ?? 'Receipt parsing failed'
    return { success: false, error: detail }
  }

  // Extract text from response (skip thinking parts)
  const parts = result.candidates?.[0]?.content?.parts ?? []
  const textParts = parts.filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
  const responseText = textParts.length > 0 ? textParts[textParts.length - 1].text : ''

  if (!responseText) {
    console.error('Empty Gemini response:', JSON.stringify(result, null, 2))
    return { success: false, error: 'Empty AI response' }
  }

  const jsonStr = sanitizeLLMJson(responseText)
  console.log('Receipt parse response (first 500 chars):', jsonStr.substring(0, 500))
  const items: ReceiptItem[] = parseLLMJson(jsonStr)

  return { success: true, data: items }
}

/**
 * Upload images to Supabase Storage and create a receipts row.
 * Shared by both parse and store-only flows.
 */
async function uploadAndCreateReceipt(files: File[]): Promise<{ receiptId: string; imageUrls: string[] }> {
  const supabase = createServerClient()
  const receiptId = crypto.randomUUID()
  const imageUrls: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const ext = MIME_TO_EXT[file.type] ?? 'jpg'
    const path = `${receiptId}/${i + 1}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
    } else {
      imageUrls.push(path)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const { error: insertError } = await supabase
    .from('receipts')
    .insert({
      id: receiptId,
      image_urls: imageUrls,
      purchased_at: today,
    })

  if (insertError) {
    console.error('Error creating receipt row:', insertError)
  }

  return { receiptId, imageUrls }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<ReceiptParseResult>>> {
  try {
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    const storeOnly = formData.get('storeOnly') === 'true'

    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images uploaded.',
      })
    }

    // Upload images and create receipt row (both flows need this)
    const { receiptId } = await uploadAndCreateReceipt(files)

    // Store-only: skip Gemini parsing, return receipt_id with empty items
    if (storeOnly) {
      return NextResponse.json({
        success: true,
        data: {
          receipt_id: receiptId,
          items: [],
        },
      })
    }

    // Parse with Gemini
    const images: ImageInput[] = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer()
        return {
          data: Buffer.from(buffer).toString('base64'),
          mimeType: file.type,
        }
      })
    )

    const parseResult = await parseReceiptImages(images)
    if (!parseResult.success || !parseResult.data) {
      // Parsing failed but receipt is already stored — return receipt_id with error
      return NextResponse.json({
        success: true,
        data: {
          receipt_id: receiptId,
          items: [],
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        receipt_id: receiptId,
        items: parseResult.data,
      },
    })
  } catch (error) {
    console.error('Error parsing receipt:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process receipt',
    })
  }
}
