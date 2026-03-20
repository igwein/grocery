import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { AISuggestion, ApiResponse } from '@/lib/types'
import { calculateFrequency } from '@/lib/frequency'
import { buildGenerateListPrompt, sanitizeLLMJson, parseLLMJson } from '@/lib/prompt-builder'

export async function POST(): Promise<NextResponse<ApiResponse<AISuggestion[]>>> {
  try {
    const supabase = createServerClient()

    // Get purchase frequency data
    const { data: history } = await supabase
      .from('purchase_history')
      .select('item_name, category_emoji, purchased_at')
      .order('purchased_at', { ascending: false })

    if (!history || history.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No purchase history found',
      })
    }

    const frequencyEntries = calculateFrequency(history)

    // Get current shopping list items
    const { data: currentList } = await supabase
      .from('shopping_list')
      .select('item_name')

    const currentItems = (currentList ?? []).map(i => i.item_name)
    const today = new Date().toISOString().split('T')[0]
    const prompt = buildGenerateListPrompt(frequencyEntries, currentItems, today)

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('Gemini API error:', result)
      return NextResponse.json({
        success: false,
        error: 'AI generation failed',
      })
    }

    // Extract text from the response - get the last text part (skip thinking parts)
    const parts = result.candidates?.[0]?.content?.parts ?? []
    // Filter to only text parts (not thought parts), take the last one which is the actual output
    const textParts = parts.filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
    const responseText = textParts.length > 0 ? textParts[textParts.length - 1].text : ''

    if (!responseText) {
      console.error('Empty Gemini response:', JSON.stringify(result, null, 2))
      return NextResponse.json({
        success: false,
        error: 'Empty AI response',
      })
    }

    // Parse JSON response
    const jsonStr = sanitizeLLMJson(responseText)
    console.log('Gemini raw response (first 500 chars):', jsonStr.substring(0, 500))
    const suggestions: AISuggestion[] = parseLLMJson(jsonStr)

    return NextResponse.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    console.error('Error generating list:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate list',
    })
  }
}
