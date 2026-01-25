/**
 * Rate limiting utility for API calls
 * Prevents quota exhaustion and abuse
 */

interface RateLimitState {
  count: number;
  windowStart: number;
}

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimitStates = new Map<string, RateLimitState>();

/**
 * Simple rate limiter for client-side API call throttling
 */
export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private key: string;

  constructor(key: string, config: RateLimiterConfig) {
    this.key = key;
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  /**
   * Check if a request is allowed under the rate limit
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(): boolean {
    const now = Date.now();
    let state = rateLimitStates.get(this.key);

    // Initialize or reset window
    if (!state || now - state.windowStart >= this.windowMs) {
      state = { count: 0, windowStart: now };
      rateLimitStates.set(this.key, state);
    }

    // Check if under limit
    if (state.count < this.maxRequests) {
      state.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(): number {
    const state = rateLimitStates.get(this.key);
    if (!state) return this.maxRequests;

    const now = Date.now();
    if (now - state.windowStart >= this.windowMs) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - state.count);
  }

  /**
   * Get time until rate limit resets (in ms)
   */
  getResetTime(): number {
    const state = rateLimitStates.get(this.key);
    if (!state) return 0;

    const now = Date.now();
    const elapsed = now - state.windowStart;

    if (elapsed >= this.windowMs) return 0;
    return this.windowMs - elapsed;
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    rateLimitStates.delete(this.key);
  }
}

// Pre-configured rate limiters for different API calls
export const geminiRateLimiter = new RateLimiter('gemini-api', {
  maxRequests: 30, // 30 requests per minute
  windowMs: 60 * 1000
});

export const chatRateLimiter = new RateLimiter('chat-api', {
  maxRequests: 10, // 10 chat messages per minute
  windowMs: 60 * 1000
});

export const receiptScanRateLimiter = new RateLimiter('receipt-scan', {
  maxRequests: 5, // 5 receipt scans per minute
  windowMs: 60 * 1000
});

/**
 * Debounce utility for preventing rapid-fire calls
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Throttle utility for limiting call frequency
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

/**
 * Rate limit error for throwing when limit exceeded
 */
export class RateLimitError extends Error {
  public resetInMs: number;

  constructor(resetInMs: number) {
    super(`Rate limit exceeded. Try again in ${Math.ceil(resetInMs / 1000)} seconds.`);
    this.name = 'RateLimitError';
    this.resetInMs = resetInMs;
  }
}
