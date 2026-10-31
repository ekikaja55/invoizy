import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';

interface ServiceStatus {
	status: 'up' | 'down' | 'not_configured';
	latency_ms?: number;
}

interface HealthPayload {
	status: 'ok' | 'degraded';
	timestamp: string;
	uptime_s: number;
	services: {
		database: ServiceStatus;
		redis: ServiceStatus;
	};
}

interface CachedResult {
	payload: HealthPayload;
	httpStatus: number;
	expiresAt: number;
}

// In-memory throttle cache (30 detik) untuk melindungi pooler database dan kuota Upstash dari burst/spam
let cachedResult: CachedResult | null = null;
const CACHE_TTL_MS = 30_000;
const PROBE_TIMEOUT_MS = 3_000;

export function _resetHealthCacheForTesting() {
	cachedResult = null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, serviceName: string): Promise<T> {
	let timer: NodeJS.Timeout;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timer = setTimeout(
			() => reject(new Error(`${serviceName} probe timed out after ${timeoutMs}ms`)),
			timeoutMs
		);
	});

	return Promise.race([promise, timeoutPromise]).finally(() => {
		clearTimeout(timer);
	});
}

export const GET: RequestHandler = async ({ request, url }) => {
	const configuredSecret = env.HEALTH_CHECK_SECRET;

	// Proteksi token rahasia jika dikonfigurasi di environment
	if (configuredSecret) {
		const authHeader = request.headers.get('authorization');
		const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
		const headerSecret = request.headers.get('x-monitoring-secret');
		const querySecret = url.searchParams.get('token');

		const providedSecret = bearerToken || headerSecret || querySecret;

		if (providedSecret !== configuredSecret) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
	}

	const now = Date.now();

	// Kembalikan cache in-memory jika belum kadaluarsa
	if (cachedResult && cachedResult.expiresAt > now) {
		return json(cachedResult.payload, {
			status: cachedResult.httpStatus,
			headers: {
				'Cache-Control': 'no-store, no-cache, must-revalidate'
			}
		});
	}

	const services: HealthPayload['services'] = {
		database: { status: 'down' },
		redis: { status: 'not_configured' }
	};

	let isDegraded = false;

	// 1. Probe Supabase Postgres
	const dbStart = Date.now();
	try {
		await withTimeout(db.execute(sql`SELECT 1`), PROBE_TIMEOUT_MS, 'Supabase Postgres');
		services.database = {
			status: 'up',
			latency_ms: Date.now() - dbStart
		};
	} catch (err) {
		isDegraded = true;
		services.database = { status: 'down' };
		logger.error('health-check.database-probe-failed', {
			error: err instanceof Error ? err.message : String(err)
		});
	}

	// 2. Probe Upstash Redis
	const redisUrl = env.UPSTASH_REDIS_REST_URL;
	const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

	if (redisUrl && redisToken) {
		const redisStart = Date.now();
		try {
			const redisClient = new Redis({ url: redisUrl, token: redisToken });
			const pingRes = await withTimeout(redisClient.ping(), PROBE_TIMEOUT_MS, 'Upstash Redis');
			if (pingRes === 'PONG' || pingRes === 'pong' || pingRes) {
				services.redis = {
					status: 'up',
					latency_ms: Date.now() - redisStart
				};
			} else {
				throw new Error('Unexpected ping response from Redis');
			}
		} catch (err) {
			isDegraded = true;
			services.redis = { status: 'down' };
			logger.error('health-check.redis-probe-failed', {
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}

	const httpStatus = isDegraded ? 503 : 200;
	const payload: HealthPayload = {
		status: isDegraded ? 'degraded' : 'ok',
		timestamp: new Date().toISOString(),
		uptime_s: Math.floor(process.uptime()),
		services
	};

	// Simpan ke memory cache
	cachedResult = {
		payload,
		httpStatus,
		expiresAt: now + CACHE_TTL_MS
	};

	return json(payload, {
		status: httpStatus,
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate'
		}
	});
};
