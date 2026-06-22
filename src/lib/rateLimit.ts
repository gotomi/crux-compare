interface Bucket {
	count: number;
	resetAt: number;
}

interface RateLimitConfig {
	limit: number;
	windowMs: number;
}

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	retryAfterMs: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
	limit: 60,
	windowMs: 60_000,
};

const buckets = new Map<string, Bucket>();

export function rateLimit(
	identity: string,
	config: RateLimitConfig = DEFAULT_RATE_LIMIT,
): RateLimitResult {
	const now = Date.now();

	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) {
			buckets.delete(key);
		}
	}

	const existing = buckets.get(identity);
	if (!existing || existing.resetAt <= now) {
		buckets.set(identity, {
			count: 1,
			resetAt: now + config.windowMs,
		});
		return {
			allowed: true,
			remaining: config.limit - 1,
			retryAfterMs: 0,
		};
	}

	existing.count += 1;
	const allowed = existing.count <= config.limit;

	return {
		allowed,
		remaining: Math.max(0, config.limit - existing.count),
		retryAfterMs: allowed ? 0 : existing.resetAt - now,
	};
}
