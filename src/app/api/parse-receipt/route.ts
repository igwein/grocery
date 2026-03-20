import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ReceiptItem, ApiResponse } from '@/lib/types'
import { buildReceiptParsePrompt, sanitizeLLMJson, parseLLMJson } from '@/lib/prompt-builder'
import { CATEGORIES } from '@/lib/categories'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGES = 5

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

export async function POST(request: Request): Promise<NextResponse<ApiResponse<ReceiptItem[]>>> {
  try {
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    // Convert files to base64 ImageInput
    const images: ImageInput[] = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer()
        return {
          data: Buffer.from(buffer).toString('base64'),
          mimeType: file.type,
        }
      })
    )

    const result = await parseReceiptImages(images)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error parsing receipt:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to parse receipt',
    })
  }
}
