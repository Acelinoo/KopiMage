// Sliding Window In-Memory Rate Limiter for Next.js API Routes

interface RateLimitRecord {
  count: number;
  firstRequestTime: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Cleanup expired IP records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now - record.firstRequestTime > 60 * 1000 * 5) {
      ipRequestMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if an IP has exceeded the allowed request limit within a time window.
 * @param ip Client IP address identifier
 * @param maxRequests Maximum allowed requests within the window (default: 12)
 * @param windowMs Window duration in milliseconds (default: 60,000 ms = 1 minute)
 * @returns { success: boolean; remaining: number; resetInMs: number }
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 12,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const cleanIp = ip || 'anonymous_client';

  const record = ipRequestMap.get(cleanIp);

  if (!record) {
    ipRequestMap.set(cleanIp, {
      count: 1,
      firstRequestTime: now,
    });
    return {
      success: true,
      remaining: maxRequests - 1,
      resetInMs: windowMs,
    };
  }

  // Window has expired, reset counter
  if (now - record.firstRequestTime > windowMs) {
    record.count = 1;
    record.firstRequestTime = now;
    return {
      success: true,
      remaining: maxRequests - 1,
      resetInMs: windowMs,
    };
  }

  // Window is active, increment counter
  record.count += 1;
  const remaining = Math.max(0, maxRequests - record.count);
  const resetInMs = Math.max(0, windowMs - (now - record.firstRequestTime));

  if (record.count > maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetInMs,
    };
  }

  return {
    success: true,
    remaining,
    resetInMs,
  };
}

/**
 * Extract client IP from Next.js request headers
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
