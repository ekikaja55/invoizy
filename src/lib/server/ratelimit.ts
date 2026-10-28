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

// Ephemeral cache in-memory untuk memblokir IP spam langsung di RAM server
// tanpa melakukan HTTP round-trip ke Redis berulang kali saat IP sudah terblokir.
const ephemeralCache = new Map<string, number>();

let limiter: Ratelimit | null = null;
let shippingLimiter: Ratelimit | null = null;
let paymentProofLimiter: Ratelimit | null = null;
let verifyHistoryLimiter: Ratelimit | null = null;
let loginLimiter: Ratelimit | null = null;

if (url && token) {
	const redis = new Redis({ url, token });
	limiter = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(REQUEST_LIMIT, WINDOW),
		prefix: 'invoizy:order-submit',
		ephemeralCache,
		timeout: 2000
	});
	// Endpoint ongkir publik (search/quote) — dibatasi terpisah agar
	// iseng autocomplete tidak memakan jatah submit order.
	shippingLimiter = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(30, '1 m'),
		prefix: 'invoizy:shipping',
		ephemeralCache,
		timeout: 2000
	});
	// Proteksi upload bukti bayar — cegah spam multi-megabyte ke Supabase Storage.
	paymentProofLimiter = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(5, '10 m'),
		prefix: 'invoizy:payment-proof',
		ephemeralCache,
		timeout: 2000
	});
	// Proteksi verifikasi riwayat pesanan — cegah brute-force scraping order ID.
	verifyHistoryLimiter = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(20, '1 m'),
		prefix: 'invoizy:verify-history',
		ephemeralCache,
		timeout: 2000
	});
	// Proteksi brute-force login admin (5 request / 15 menit per IP)
	loginLimiter = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(5, '15 m'),
		prefix: 'invoizy:login',
		ephemeralCache,
		timeout: 2000
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

export async function checkPaymentProofRateLimit(identifier: string): Promise<RateLimitResult> {
	// Fail open — tanpa Upstash, jangan halangi pembeli mengirim bukti bayar.
	if (!paymentProofLimiter) {
		return { success: true, limit: 5, remaining: 5, reset: 0 };
	}

	const result = await paymentProofLimiter.limit(identifier);
	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset
	};
}

export async function checkVerifyHistoryRateLimit(identifier: string): Promise<RateLimitResult> {
	// Fail open — tanpa Upstash, jangan blokir pengecekan riwayat.
	if (!verifyHistoryLimiter) {
		return { success: true, limit: 20, remaining: 20, reset: 0 };
	}

	const result = await verifyHistoryLimiter.limit(identifier);
	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset
	};
}

export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
	// Fail open — tanpa Upstash, jangan halangi login sah.
	if (!loginLimiter) {
		return { success: true, limit: 5, remaining: 5, reset: 0 };
	}

	const result = await loginLimiter.limit(identifier);
	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset
	};
}
