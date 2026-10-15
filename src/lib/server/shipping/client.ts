import { env } from '$env/dynamic/private';
import { Redis } from '@upstash/redis';
import { SHIPPING_COURIERS } from './couriers';
import {
	calcResponseSchema,
	destinationListSchema,
	type CostOption,
	type Destination
} from '$lib/schemas/shipping';
import { logger } from '$lib/server/logger';

// Semua rahasia (key, origin) dari env — tidak ada default diam-diam.
// Kalau belum dikonfigurasi → error keras (bukan fallback), agar salah deploy ketahuan.
function baseUrl(): string {
	const v = env.RAJA_ONGKIR_BASE_URL;
	if (!v) throw new ShippingError('RAJA_ONGKIR_BASE_URL belum dikonfigurasi.', false);
	return v.replace(/\/$/, '');
}

function apiKey(): string {
	const v = env.RAJA_ONGKIR_API_KEY;
	if (!v) throw new ShippingError('RAJA_ONGKIR_API_KEY belum dikonfigurasi.', false);
	return v;
}

function originId(): string {
	const v = env.RAJA_ONGKIR_ORIGIN_ID;
	if (!v) throw new ShippingError('RAJA_ONGKIR_ORIGIN_ID belum dikonfigurasi.', false);
	return v;
}

// Error ongkir: fallbackable = boleh diganti flat darurat;
// false = salah konfigurasi / input — harus diperbaiki, jangan disamarkan.
// status = kode HTTP asal (untuk log server; TIDAK ditampilkan ke buyer).
export class ShippingError extends Error {
	readonly fallbackable: boolean;
	readonly status?: number;
	constructor(message: string, fallbackable = true, status?: number) {
		super(message);
		this.fallbackable = fallbackable;
		this.status = status;
	}
}

// Cache hasil kalkulasi (key origin–dest–weight–kurir, TTL jam-an).
// Upstash opsional — tanpa env, jatuh ke memory proses (fail-open seperti ratelimit).
const COST_TTL_SEC = 6 * 3600;
const redis =
	env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
		? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
		: null;
const memory = new Map<string, { exp: number; value: unknown }>();

async function cacheGet<T>(key: string): Promise<T | null> {
	const hit = memory.get(key);
	if (hit && hit.exp > Date.now()) return hit.value as T;
	if (hit) memory.delete(key);
	if (!redis) return null;
	try {
		const val = await redis.get<T>(key);
		return val ?? null;
	} catch {
		return null;
	}
}

async function cacheSet(key: string, value: unknown, ttlSec: number): Promise<void> {
	memory.set(key, { exp: Date.now() + ttlSec * 1000, value });
	if (!redis) return;
	try {
		await redis.set(key, value, { ex: ttlSec });
	} catch {
		// cache gagal bukan alasan gagalkan checkout
	}
}

export async function searchDestinations(query: string, limit = 10): Promise<Destination[]> {
	const q = query.trim();
	if (q.length < 3) {
		throw new ShippingError('Ketik minimal 3 huruf untuk mencari tujuan.', false);
	}

	let res: Response;
	try {
		res = await fetch(
			`${baseUrl()}/destination/domestic-destination?search=${encodeURIComponent(q)}&limit=${limit}&offset=0`,
			{ headers: { accept: 'application/json', key: apiKey() } }
		);
	} catch {
		throw new ShippingError('Layanan cek ongkir tidak dapat dihubungi.', true);
	}

	if (!res.ok) {
		if (res.status === 404) {
			throw new ShippingError(
				'Kecamatan tujuan tidak ditemukan, coba kata kunci lain.',
				false,
				404
			);
		}
		if (res.status === 401) {
			// Key salah/cabut = salah konfigurasi, BUKAN gangguan.
			// Non-fallbackable + error level agar ketahuan dalam hitungan menit.
			logger.error('shipping.search-unauthorized', {});
			throw new ShippingError('Layanan cek ongkir sedang gangguan, coba lagi sebentar.', false, 401);
		}
		if (res.status === 429) {
			logger.warn('shipping.search-quota', { q });
			throw new ShippingError('Batas cek ongkir habis. Coba lagi nanti.', true, 429);
		}
		throw new ShippingError(
			'Layanan cek ongkir sedang gangguan, coba lagi sebentar.',
			true,
			res.status
		);
	}

	const parsed = destinationListSchema.safeParse(await res.json());
	if (!parsed.success || parsed.data.meta.status !== 'success' || !parsed.data.data) {
		throw new ShippingError('Respons layanan ongkir tidak valid.', true);
	}
	logger.info('shipping.search', { q, results: parsed.data.data.length });
	return parsed.data.data;
}

export interface CourierQuote {
	courier: string;
	courierLabel: string;
	options: CostOption[];
	cached: boolean;
}

export async function calculateCourier(
	courier: string,
	destId: number,
	weightGrams: number
): Promise<CourierQuote> {
	if (!Number.isInteger(weightGrams) || weightGrams <= 0) {
		throw new ShippingError('Berat paket tidak valid.', false);
	}

	const key = `ro:cost:${originId()}:${destId}:${weightGrams}:${courier}`;
	const hit = await cacheGet<CostOption[]>(key);
	if (hit) {
		// Cache hit = 0 req kuota. Rasio hit vs fresh di log = metrik kesehatan kuota.
		logger.info('shipping.calc-cache-hit', { courier, destId });
		return { courier, courierLabel: labelOf(courier), options: hit, cached: true };
	}

	const body = new URLSearchParams({
		origin: originId(),
		destination: String(destId),
		weight: String(weightGrams),
		courier
	});

	let res: Response;
	try {
		res = await fetch(`${baseUrl()}/calculate/domestic-cost`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded', key: apiKey() },
			body
		});
	} catch {
		throw new ShippingError(`Kurir ${courier} tidak dapat dihubungi.`, true);
	}

	if (!res.ok) {
		if (res.status === 401) {
			logger.error('shipping.calc-unauthorized', { courier });
			throw new ShippingError('Layanan cek ongkir sedang gangguan, coba lagi sebentar.', false, 401);
		}
		if (res.status === 429) {
			logger.warn('shipping.calc-quota', { courier, destId });
			throw new ShippingError('Batas cek ongkir habis. Coba lagi nanti.', true, 429);
		}
		throw new ShippingError(
			'Layanan cek ongkir sedang gangguan, coba lagi sebentar.',
			true,
			res.status
		);
	}

	const parsed = calcResponseSchema.safeParse(await res.json());
	if (!parsed.success || parsed.data.meta.status !== 'success' || !parsed.data.data) {
		throw new ShippingError('Respons layanan ongkir tidak valid.', true);
	}

	let options = parsed.data.data;
	const cfg = SHIPPING_COURIERS.find((c) => c.code === courier);
	if (cfg && cfg.services.length > 0) {
		const filtered = options.filter((o) => cfg.services.includes(o.service));
		if (filtered.length > 0) {
			options = filtered;
		} else {
			logger.warn('shipping.allowlist-empty', { courier });
		}
	}

	options = [...options].sort((a, b) => a.cost - b.cost);
	await cacheSet(key, options, COST_TTL_SEC);
	logger.info('shipping.calc-fresh', { courier, destId, weightGrams, options: options.length });
	return { courier, courierLabel: labelOf(courier), options, cached: false };
}

function labelOf(courier: string): string {
	return SHIPPING_COURIERS.find((c) => c.code === courier)?.label ?? courier.toUpperCase();
}
