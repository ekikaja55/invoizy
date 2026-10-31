import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';

const MAINTENANCE_KEY = 'invoizy:maintenance_mode';
const CACHE_TTL_MS = 10_000; // 10 detik cache in-memory

let redis: Redis | null = null;
const url = env.UPSTASH_REDIS_REST_URL;
const token = env.UPSTASH_REDIS_REST_TOKEN;

if (url && token) {
	redis = new Redis({ url, token });
}

// In-memory cache agar tidak membebani panggilan jaringan ke Upstash pada setiap request HTTP
let cachedStatus: { active: boolean; expiry: number } | null = null;

export async function isMaintenanceMode(): Promise<boolean> {
	const now = Date.now();
	if (cachedStatus && cachedStatus.expiry > now) {
		return cachedStatus.active;
	}

	if (!redis) {
		// Fail-open: jika kredensial Upstash belum ada, toko tetap bisa diakses normal
		return false;
	}

	try {
		const val = await redis.get<string | boolean | number>(MAINTENANCE_KEY);
		const active = val === 'true' || val === '1' || val === true || val === 1;
		cachedStatus = { active, expiry: now + CACHE_TTL_MS };
		return active;
	} catch (err) {
		logger.warn('Gagal membaca status maintenance dari Upstash Redis (fail-open)', {
			error: err instanceof Error ? err.message : String(err)
		});
		return false;
	}
}

export async function setMaintenanceMode(active: boolean): Promise<boolean> {
	cachedStatus = { active, expiry: Date.now() + CACHE_TTL_MS };

	if (!redis) {
		logger.warn('Upstash Redis tidak tersedia saat mengatur mode pemeliharaan');
		return false;
	}

	try {
		if (active) {
			await redis.set(MAINTENANCE_KEY, 'true');
			logger.info('Mode pemeliharaan toko diaktifkan');
		} else {
			await redis.del(MAINTENANCE_KEY);
			logger.info('Mode pemeliharaan toko dinonaktifkan');
		}
		return true;
	} catch (err) {
		logger.error('Gagal menulis status maintenance ke Upstash Redis', {
			error: err instanceof Error ? err.message : String(err)
		});
		return false;
	}
}
