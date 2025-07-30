interface CacheEntry {
  response: string;
  timestamp: number;
  model?: string;
  provider?: string;
}

export class AIResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxAge = 15 * 60 * 1000; // 15 minutes
  private readonly maxEntries = 100;

  private getCacheKey(prompt: string, action: string, model?: string, provider?: string): string {
    return `${action}:${model || 'default'}:${provider || 'default'}:${prompt}`;
  }

  get(prompt: string, action: string, model?: string, provider?: string): string | null {
    const key = this.getCacheKey(prompt, action, model, provider);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.response;
  }

  set(prompt: string, action: string, response: string, model?: string, provider?: string): void {
    const key = this.getCacheKey(prompt, action, model, provider);
    
    // Enforce max entries limit
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      // Remove oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      model,
      provider
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Get all responses for a specific prompt (useful for regeneration history)
  getHistory(prompt: string): Array<{ action: string; response: string; model?: string; provider?: string }> {
    const history: Array<{ action: string; response: string; model?: string; provider?: string }> = [];
    
    this.cache.forEach((entry, key) => {
      if (key.includes(prompt)) {
        const [action] = key.split(':');
        history.push({
          action,
          response: entry.response,
          model: entry.model,
          provider: entry.provider
        });
      }
    });
    
    return history;
  }
}

// Singleton instance
export const aiResponseCache = new AIResponseCache();