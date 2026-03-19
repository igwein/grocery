import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { AISuggestion, ApiResponse } from '@/lib/types'

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

    // Calculate frequency per item
    const freq = new Map<string, {
      category_emoji: string
      count: number
      first: string
      last: string
      dates: string[]
    }>()

    for (const row of history) {
      const existing = freq.get(row.item_name)
      if (existing) {
        existing.count++
        if (row.purchased_at < existing.first) existing.first = row.purchased_at
        if (row.purchased_at > existing.last) existing.last = row.purchased_at
        existing.dates.push(row.purchased_at)
      } else {
        freq.set(row.item_name, {
          category_emoji: row.category_emoji,
          count: 1,
          first: row.purchased_at,
          last: row.purchased_at,
          dates: [row.purchased_at],
        })
      }
    }

    // Build frequency table for the prompt
    const frequencyLines = Array.from(freq.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([name, data]) => {
        const daySpan = Math.max(1,
          (new Date(data.last).getTime() - new Date(data.first).getTime()) / (1000 * 60 * 60 * 24)
        )
        const avgInterval = data.count > 1 ? Math.round(daySpan / (data.count - 1)) : null
        return `${data.category_emoji} ${name} | bought ${data.count}x | last: ${data.last} | avg interval: ${avgInterval ?? 'N/A'} days`
      })
      .join('\n')

    // Get current shopping list items
    const { data: currentList } = await supabase
      .from('shopping_list')
      .select('item_name')

    const currentItems = (currentList ?? []).map(i => i.item_name)
    const currentListStr = currentItems.length > 0
      ? currentItems.join(', ')
      : 'empty'

    const today = new Date().toISOString().split('T')[0]

    const prompt = `You are a grocery shopping assistant for a family in Israel.
Your task is to suggest a weekly shopping list based on purchase history patterns.

Today's date: ${today}

## Purchase frequency data (category, item, times bought, last purchase, avg days between purchases):
${frequencyLines}

## Items already on the current shopping list:
${currentListStr}

## Instructions:
1. Suggest items that are likely needed this week based on their purchase frequency and when they were last bought.
2. Always include staples that are bought nearly every trip (items bought 8+ times in the data).
3. For less frequent items, only suggest them if they appear overdue based on their average interval.
4. Do NOT suggest items already on the current list.
5. Return ONLY a valid JSON array with objects: {"item_name": "...", "category_emoji": "...", "confidence": "high"|"medium"|"low"}
6. confidence = "high" for weekly staples, "medium" for bi-weekly items that seem due, "low" for less certain suggestions.
7. Keep the list practical - typically 15-30 items for a weekly shop.
8. Return ONLY the JSON array, no markdown, no explanation.`

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
    let jsonStr = responseText.trim()
    // Strip markdown code fences if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/, '').replace(/\n?```$/, '')
    }
    // Fix trailing commas (common LLM JSON issue)
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1')

    console.log('Gemini raw response (first 500 chars):', jsonStr.substring(0, 500))

    let suggestions: AISuggestion[]
    try {
      suggestions = JSON.parse(jsonStr)
    } catch {
      // If JSON is truncated, try to salvage by closing the array
      const lastClosingBrace = jsonStr.lastIndexOf('}')
      if (lastClosingBrace > 0) {
        const salvaged = jsonStr.substring(0, lastClosingBrace + 1) + ']'
        console.log('Attempting to salvage truncated JSON')
        suggestions = JSON.parse(salvaged)
      } else {
        throw new Error('Could not parse AI response as JSON')
      }
    }

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
