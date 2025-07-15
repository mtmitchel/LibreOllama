/**
 * Request throttler to prevent Gmail API rate limiting (429 errors)
 * Implements exponential backoff and concurrent request limiting
 */
export class RequestThrottler {
  private queue: Array<{
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private activeRequests = 0;
  private readonly maxConcurrent = 5; // Limit to 5 concurrent requests
  private readonly delayBetweenBatches = 100; // 100ms between batches
  
  /**
   * Throttle a request through the queue
   */
  async throttle<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }
  
  /**
   * Process queued requests with rate limiting
   */
  private async processQueue() {
    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) continue;
      
      this.activeRequests++;
      this.executeWithRetry(item.request)
        .then(result => {
          item.resolve(result);
        })
        .catch(error => {
          item.reject(error);
        })
        .finally(() => {
          this.activeRequests--;
          // Add small delay before processing next request
          setTimeout(() => this.processQueue(), this.delayBetweenBatches);
        });
    }
  }
  
  /**
   * Execute request with exponential backoff retry for 429 errors
   */
  private async executeWithRetry<T>(
    request: () => Promise<T>,
    attempt = 1,
    maxAttempts = 5
  ): Promise<T> {
    try {
      return await request();
    } catch (error: any) {
      const isRateLimitError = 
        error.message?.includes('429') ||
        error.message?.includes('rateLimitExceeded') ||
        error.message?.includes('userRateLimitExceeded');
      
      if (isRateLimitError && attempt < maxAttempts) {
        // Exponential backoff: 2^attempt seconds (2s, 4s, 8s, 16s, 32s)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ [THROTTLE] Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(request, attempt + 1, maxAttempts);
      }
      
      throw error;
    }
  }
}

// Singleton instance
export const gmailThrottler = new RequestThrottler(); 
