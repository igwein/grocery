import { FrequencyEntry, formatFrequencyLines } from './frequency'

/**
 * Build the Gemini API prompt for weekly list generation.
 */
export function buildGenerateListPrompt(
  frequencyEntries: FrequencyEntry[],
  currentItems: string[],
  today: string,
): string {
  const frequencyLines = formatFrequencyLines(frequencyEntries)
  const currentListStr = currentItems.length > 0
    ? currentItems.join(', ')
    : 'empty'

  return `You are a grocery shopping assistant for a family in Israel.
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
}

/**
 * Parse and sanitize LLM JSON response text into a clean JSON string.
 * Handles markdown fences, trailing commas, and truncated responses.
 */
export function sanitizeLLMJson(responseText: string): string {
  let jsonStr = responseText.trim()

  // Strip markdown code fences if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  // Fix trailing commas (common LLM JSON issue)
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1')

  return jsonStr
}

/**
 * Attempt to parse JSON, with fallback for truncated arrays.
 */
export function parseLLMJson<T>(jsonStr: string): T {
  try {
    return JSON.parse(jsonStr)
  } catch {
    // If JSON is truncated, try to salvage by closing the array
    const lastClosingBrace = jsonStr.lastIndexOf('}')
    if (lastClosingBrace > 0) {
      const salvaged = jsonStr.substring(0, lastClosingBrace + 1) + ']'
      return JSON.parse(salvaged)
    }
    throw new Error('Could not parse AI response as JSON')
  }
}
