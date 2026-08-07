/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RateLimitCategory = 'ai_data' | 'auth' | 'public_data';

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitStatus {
  category: RateLimitCategory;
  requestsCount: number;
  maxRequests: number;
  windowSeconds: number;
  resetTimeMs: number;
  isBlocked: boolean;
  violationsCount: number;
}

// Default rate limiting configurations
const DEFAULT_CONFIGS: Record<RateLimitCategory, RateLimitConfig> = {
  ai_data: { maxRequests: 20, windowSeconds: 60 },       // 20 requests per minute
  auth: { maxRequests: 10, windowSeconds: 60 },          // 10 requests per minute (brute-force protection)
  public_data: { maxRequests: 60, windowSeconds: 60 },   // 60 requests per minute (scraping protection)
};

// In-memory request tracking state per category
interface WindowRecord {
  timestamps: number[];
  violations: number;
  blockedUntil: number;
}

const stateStore: Record<RateLimitCategory, WindowRecord> = {
  ai_data: { timestamps: [], violations: 0, blockedUntil: 0 },
  auth: { timestamps: [], violations: 0, blockedUntil: 0 },
  public_data: { timestamps: [], violations: 0, blockedUntil: 0 },
};

/**
 * Check and enforce rate limits for a given category.
 * Throws an Error with details if rate limit is exceeded.
 */
export function enforceRateLimit(category: RateLimitCategory): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const config = DEFAULT_CONFIGS[category];
  const state = stateStore[category];
  const now = Date.now();

  // Check if currently temporarily blocked due to repeated violations
  if (state.blockedUntil > now) {
    const waitSeconds = Math.ceil((state.blockedUntil - now) / 1000);
    state.violations++;
    throw new Error(`Rate limit exceeded for [${category.toUpperCase()}]. Too many requests. Please wait ${waitSeconds}s before retrying.`);
  }

  // Purge timestamps outside the sliding window
  const windowMs = config.windowSeconds * 1000;
  state.timestamps = state.timestamps.filter(t => now - t < windowMs);

  if (state.timestamps.length >= config.maxRequests) {
    state.violations++;
    // Block for the remainder of the window or 30s minimum
    state.blockedUntil = now + Math.min(windowMs, 30000);
    const waitSeconds = Math.ceil((state.blockedUntil - now) / 1000);
    throw new Error(`Rate limit threshold reached for [${category.toUpperCase()}]. Limit: ${config.maxRequests} req / ${config.windowSeconds}s. Blocked for ${waitSeconds}s.`);
  }

  // Record current request timestamp
  state.timestamps.push(now);

  const remaining = config.maxRequests - state.timestamps.length;
  const oldestTimestamp = state.timestamps[0] || now;
  const resetInSeconds = Math.max(1, Math.ceil((windowMs - (now - oldestTimestamp)) / 1000));

  return {
    allowed: true,
    remaining,
    resetInSeconds,
  };
}

/**
 * Get current rate limit status and metrics for all categories.
 */
export function getRateLimitStatuses(): RateLimitStatus[] {
  const now = Date.now();
  return (['ai_data', 'auth', 'public_data'] as RateLimitCategory[]).map(category => {
    const config = DEFAULT_CONFIGS[category];
    const state = stateStore[category];
    const windowMs = config.windowSeconds * 1000;
    
    // Clean old timestamps
    state.timestamps = state.timestamps.filter(t => now - t < windowMs);
    const isBlocked = state.blockedUntil > now;
    const oldest = state.timestamps[0] || now;
    const resetTimeMs = isBlocked ? state.blockedUntil : oldest + windowMs;

    return {
      category,
      requestsCount: state.timestamps.length,
      maxRequests: config.maxRequests,
      windowSeconds: config.windowSeconds,
      resetTimeMs,
      isBlocked,
      violationsCount: state.violations,
    };
  });
}

/**
 * Reset rate limit counters for testing or administrative purposes.
 */
export function resetRateLimitStore(category?: RateLimitCategory): void {
  if (category) {
    stateStore[category] = { timestamps: [], violations: 0, blockedUntil: 0 };
  } else {
    for (const cat of ['ai_data', 'auth', 'public_data'] as RateLimitCategory[]) {
      stateStore[cat] = { timestamps: [], violations: 0, blockedUntil: 0 };
    }
  }
}
