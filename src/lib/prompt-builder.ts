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
 * Build the Gemini Vision API prompt for receipt image parsing.
 */
export function buildReceiptParsePrompt(
  catalogItems: string[],
  categories: { emoji: string; name: string }[],
): string {
  const categoryLines = categories.map(c => `${c.emoji} ${c.name}`).join('\n')
  const catalogSection = catalogItems.length > 0
    ? catalogItems.join(', ')
    : '(empty catalog)'

  return `You are a grocery receipt parser for a family in Israel.
Your task is to carefully extract ALL purchased grocery items from the receipt image(s).

IMPORTANT: The images may show different parts of the SAME long receipt. Read ALL images carefully and extract EVERY item from ALL parts. Do not skip any items. A typical grocery receipt has 20-40 items — make sure you capture all of them.

## Available categories (emoji + Hebrew name):
${categoryLines}

## Known catalog items (use these names when a receipt item matches):
${catalogSection}

## How to read Israeli grocery receipts:
- Items are listed in Hebrew, right-to-left
- Each item line typically has: item name (Hebrew), barcode number, price
- Weight-based items show: price per kg, weight in kg, total price
- Lines with negative numbers (e.g., -7.00) are discounts — SKIP these
- Lines with "הנחה" or "הנחת" are discounts — SKIP these
- Lines with "לתשלום", "ישראכרט", "עודף", "מפעיל הנחה" are payment info — SKIP these
- Barcodes (long numbers like 7290001234567) are NOT items — they are part of the item line

## Instructions:
1. Read ALL images thoroughly. Extract EVERY grocery item from every part of the receipt.
2. For each item provide:
   - receipt_name: the exact Hebrew name as printed on the receipt
   - item_name: a clean, common Hebrew grocery name (e.g., "פילה סלמון" not "פילה סלמון פרר 900957")
   - category_emoji: the best matching emoji from the categories above
   - quantity: weight or count if visible (e.g., "1.574 ק״ג", "4 יחידה"). null if not shown
   - price: the final price paid for this item as a string (e.g., "212.33"). null if not visible
3. If an item matches a known catalog item, use the catalog name as item_name.
4. If an item is NOT in the catalog, provide a clean, short Hebrew name.
5. Do NOT include: totals, subtotals, discounts, tax, payment method, store info, change.
6. Do NOT merge duplicate items — if an item appears twice on the receipt, list it twice.
7. Return ONLY a valid JSON array. No markdown, no explanation, no wrapping.
8. Format: [{"receipt_name": "...", "item_name": "...", "category_emoji": "...", "quantity": "..." | null, "price": "..." | null}]`
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
