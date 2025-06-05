/**
 * Enhanced fuzzy search with typo tolerance and ranking
 * Optimized for <200ms response time
 */

export interface FuzzyMatch {
  item: any
  score: number
  matches: Array<{
    indices: [number, number]
    key: string
  }>
}

export interface FuzzySearchOptions {
  keys: string[]
  threshold: number
  maxResults: number
  includeScore: boolean
  includeMatches: boolean
  minMatchCharLength: number
  typoTolerance: boolean
}

const DEFAULT_OPTIONS: FuzzySearchOptions = {
  keys: ['title', 'description', 'keywords'],
  threshold: 0.3,
  maxResults: 50,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
  typoTolerance: true
}

export class FuzzySearchEngine {
  private options: FuzzySearchOptions

  constructor(options: Partial<FuzzySearchOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Perform fuzzy search with typo tolerance
   */
  search(items: any[], query: string): FuzzyMatch[] {
    if (!query || query.length < this.options.minMatchCharLength) {
      return items.slice(0, this.options.maxResults).map(item => ({
        item,
        score: 1,
        matches: []
      }))
    }

    const normalizedQuery = this.normalizeString(query)
    const results: FuzzyMatch[] = []

    // Process items efficiently
    for (const item of items) {
      const match = this.matchItem(item, normalizedQuery)
      if (match && match.score >= this.options.threshold) {
        results.push(match)
      }
    }

    // Sort by score (higher is better) and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, this.options.maxResults)
  }

  private matchItem(item: any, query: string): FuzzyMatch | null {
    let bestScore = 0
    const matches: Array<{ indices: [number, number], key: string }> = []

    for (const key of this.options.keys) {
      const value = this.getNestedValue(item, key)
      if (!value) continue

      const normalizedValue = this.normalizeString(String(value))
      const match = this.fuzzyMatch(normalizedValue, query)

      if (match) {
        bestScore = Math.max(bestScore, match.score)
        if (this.options.includeMatches && match.indices.length > 0) {
          matches.push({
            indices: [match.indices[0], match.indices[match.indices.length - 1]],
            key
          })
        }
      }
    }

    if (bestScore >= this.options.threshold) {
      return {
        item,
        score: bestScore,
        matches: this.options.includeMatches ? matches : []
      }
    }

    return null
  }

  private fuzzyMatch(text: string, pattern: string): { score: number, indices: number[] } | null {
    const textLen = text.length
    const patternLen = pattern.length

    if (patternLen === 0) return { score: 1, indices: [] }
    if (patternLen > textLen) return null

    // Exact match gets highest score
    const exactIndex = text.indexOf(pattern)
    if (exactIndex !== -1) {
      return {
        score: 0.95 - (exactIndex / textLen) * 0.1, // Earlier matches score higher
        indices: Array.from({ length: patternLen }, (_, i) => exactIndex + i)
      }
    }

    // Fuzzy matching with dynamic programming
    const matchIndices: number[] = []
    let patternIndex = 0
    let score = 0
    let consecutiveMatches = 0
    let previousMatchIndex = -1

    for (let textIndex = 0; textIndex < textLen && patternIndex < patternLen; textIndex++) {
      const textChar = text[textIndex]
      const patternChar = pattern[patternIndex]

      if (textChar === patternChar) {
        matchIndices.push(textIndex)
        
        // Bonus for consecutive matches
        if (textIndex === previousMatchIndex + 1) {
          consecutiveMatches++
          score += 0.1 * consecutiveMatches
        } else {
          consecutiveMatches = 1
        }
        
        // Bonus for matches at word boundaries
        if (textIndex === 0 || text[textIndex - 1] === ' ') {
          score += 0.2
        }
        
        score += 0.1
        previousMatchIndex = textIndex
        patternIndex++
      } else if (this.options.typoTolerance && this.isTypoMatch(textChar, patternChar)) {
        // Handle common typos with reduced score
        matchIndices.push(textIndex)
        score += 0.05
        patternIndex++
        previousMatchIndex = textIndex
      }
    }

    // Check if all pattern characters were matched
    if (patternIndex !== patternLen) {
      return null
    }

    // Calculate final score based on match density and position
    const matchDensity = patternLen / textLen
    const positionScore = 1 - (matchIndices[0] / textLen)
    const finalScore = (score + matchDensity * 0.3 + positionScore * 0.2) / (1 + patternLen * 0.1)

    return {
      score: Math.min(0.94, finalScore), // Cap below exact match score
      indices: matchIndices
    }
  }

  private isTypoMatch(char1: string, char2: string): boolean {
    // Common typo patterns
    const typoMap: Record<string, string[]> = {
      'a': ['s', 'q', 'w'],
      's': ['a', 'd', 'w', 'x'],
      'd': ['s', 'f', 'e', 'x', 'c'],
      'f': ['d', 'g', 'r', 'c', 'v'],
      'g': ['f', 'h', 't', 'v', 'b'],
      'h': ['g', 'j', 'y', 'b', 'n'],
      'j': ['h', 'k', 'u', 'n', 'm'],
      'k': ['j', 'l', 'i', 'm'],
      'l': ['k', 'o', 'p'],
      'q': ['w', 'a'],
      'w': ['q', 'e', 'a', 's'],
      'e': ['w', 'r', 's', 'd'],
      'r': ['e', 't', 'd', 'f'],
      't': ['r', 'y', 'f', 'g'],
      'y': ['t', 'u', 'g', 'h'],
      'u': ['y', 'i', 'h', 'j'],
      'i': ['u', 'o', 'j', 'k'],
      'o': ['i', 'p', 'k', 'l'],
      'p': ['o', 'l'],
      'z': ['x'],
      'x': ['z', 'c', 's', 'd'],
      'c': ['x', 'v', 'd', 'f'],
      'v': ['c', 'b', 'f', 'g'],
      'b': ['v', 'n', 'g', 'h'],
      'n': ['b', 'm', 'h', 'j'],
      'm': ['n', 'j', 'k']
    }

    const neighbors = typoMap[char1.toLowerCase()]
    return neighbors ? neighbors.includes(char2.toLowerCase()) : false
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        return current[key]
      }
      return undefined
    }, obj)
  }

  /**
   * Update search options
   */
  updateOptions(options: Partial<FuzzySearchOptions>): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * Create search suggestions based on partial input
   */
  getSuggestions(items: any[], query: string, maxSuggestions = 5): string[] {
    if (query.length < 2) return []

    const suggestions = new Set<string>()
    const normalizedQuery = this.normalizeString(query)

    for (const item of items) {
      for (const key of this.options.keys) {
        const value = this.getNestedValue(item, key)
        if (!value) continue

        const normalizedValue = this.normalizeString(String(value))
        const words = normalizedValue.split(' ')

        for (const word of words) {
          if (word.startsWith(normalizedQuery) && word.length > normalizedQuery.length) {
            suggestions.add(word)
            if (suggestions.size >= maxSuggestions) break
          }
        }

        if (suggestions.size >= maxSuggestions) break
      }
      if (suggestions.size >= maxSuggestions) break
    }

    return Array.from(suggestions).slice(0, maxSuggestions)
  }
}

// Export singleton instance for performance
export const fuzzySearchEngine = new FuzzySearchEngine()

// Utility function for quick searches
export function quickFuzzySearch<T>(
  items: T[], 
  query: string, 
  keys: string[] = ['title', 'name']
): FuzzyMatch[] {
  const engine = new FuzzySearchEngine({ keys, maxResults: 20 })
  return engine.search(items, query)
}