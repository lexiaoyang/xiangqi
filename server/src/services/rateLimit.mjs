export class RateLimitService {
  constructor(redisLike) {
    this.redis = redisLike;
  }

  async check(key, { limit, windowMs }) {
    const count = await this.redis.incr(`rl:${key}`, windowMs);
    return count <= limit ? { ok: true, remaining: limit - count } : { ok: false, error: "rate_limited", retryAfterMs: windowMs };
  }
}

export function serverDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
