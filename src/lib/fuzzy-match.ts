/**
 * Compute Levenshtein edit distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    let prev = i - 1
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = temp
    }
  }
  return dp[n]
}

/**
 * Fuzzy match a search string against a target.
 * Returns a score: 3 = exact substring, 2 = close Levenshtein, 1 = empty search, 0 = no match.
 */
export function fuzzyMatch(target: string, search: string): number {
  const s = search.trim()
  if (!s) return 1

  // Exact substring match gets highest score
  if (target.includes(s)) return 3

  // Check each word in the target for similarity
  const words = target.split(/\s+/)
  for (const word of words) {
    const dist = levenshtein(word, s)
    // Allow distance proportional to query length (roughly 1 per 3 chars, min 1)
    const maxDist = Math.max(1, Math.floor(s.length / 3))
    if (dist <= maxDist) return 2
  }

  return 0
}
