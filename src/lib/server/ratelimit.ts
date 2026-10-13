import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

// Rate limit submit order per IP, memakai sliding window.
// Angka ini bisa disesuaikan; 10 request / 10 menit cukup longgar untuk
// manusia (beberapa order berturut), tapi menghambat spam/bot.
const REQUEST_LIMIT = 10;
const WINDOW = '10 m';

const url = env.UPSTASH_REDIS_REST_URL;
const token = env.UPSTASH_REDIS_REST_TOKEN;

let limiter: Ratelimit | null = null;
let shippingLimiter: Ratelimit | null = null;

if (url && token) {
	const redis = new Redis({ url, token });
	limiter = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(REQUEST_LIMIT, WINDOW),
		prefix: 'invoizy:order-submit'
	});
	// Endpoint ongkir publik (search/quote) — dibatasi terpisah agar
	// iseng autocomplete tidak memakan jatah submit order.
	shippingLimiter = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(30, '1 m'),
		prefix: 'invoizy:shipping'
	});
}

export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
}

export async function checkOrderSubmitRateLimit(identifier: string): Promise<RateLimitResult> {
	// Upstash belum dikonfigurasi (env kosong) → fail open, jangan blokir order.
	if (!limiter) {
		return { success: true, limit: REQUEST_LIMIT, remaining: REQUEST_LIMIT, reset: 0 };
	}

	const result = await limiter.limit(identifier);
	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset
	};
}

export async function checkShippingRateLimit(identifier: string): Promise<RateLimitResult> {
	// Fail open seperti di atas — tanpa Upstash, jangan blokir kalkulasi.
	if (!shippingLimiter) {
		return { success: true, limit: 30, remaining: 30, reset: 0 };
	}

	const result = await shippingLimiter.limit(identifier);
	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset
	};
}
