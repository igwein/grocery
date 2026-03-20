export interface FrequencyEntry {
  item_name: string
  category_emoji: string
  count: number
  first: string
  last: string
  dates: string[]
  avgInterval: number | null
}

export interface PurchaseRow {
  item_name: string
  category_emoji: string
  purchased_at: string
}

/**
 * Calculate purchase frequency data from history rows.
 * Returns entries sorted by count descending.
 */
export function calculateFrequency(history: PurchaseRow[]): FrequencyEntry[] {
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

  return Array.from(freq.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([name, data]) => {
      const daySpan = Math.max(1,
        (new Date(data.last).getTime() - new Date(data.first).getTime()) / (1000 * 60 * 60 * 24)
      )
      const avgInterval = data.count > 1 ? Math.round(daySpan / (data.count - 1)) : null
      return {
        item_name: name,
        category_emoji: data.category_emoji,
        count: data.count,
        first: data.first,
        last: data.last,
        dates: data.dates,
        avgInterval,
      }
    })
}

/**
 * Format frequency entries into lines for the AI prompt.
 */
export function formatFrequencyLines(entries: FrequencyEntry[]): string {
  return entries
    .map(e =>
      `${e.category_emoji} ${e.item_name} | bought ${e.count}x | last: ${e.last} | avg interval: ${e.avgInterval ?? 'N/A'} days`
    )
    .join('\n')
}
