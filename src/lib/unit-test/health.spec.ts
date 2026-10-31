import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		HEALTH_CHECK_SECRET: 'test-secret-123',
		UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
		UPSTASH_REDIS_REST_TOKEN: 'mock-token'
	}
}));

const mockDbExecute = vi.fn();
vi.mock('$lib/server/db', () => ({
	db: {
		execute: (...args: unknown[]) => mockDbExecute(...args)
	}
}));

const mockRedisPing = vi.fn();
vi.mock('@upstash/redis', () => {
	class MockRedis {
		ping() {
			return mockRedisPing();
		}
	}
	return { Redis: MockRedis };
});

vi.mock('$lib/server/logger', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

// Import GET handler dan reset cache helper setelah mock terpasang
import { GET, _resetHealthCacheForTesting } from '../../routes/api/health/+server';

type HealthRequestEvent = Parameters<typeof GET>[0];

describe('Health Check API (+server.ts)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		_resetHealthCacheForTesting();
	});

	it('mengembalikan 401 Unauthorized jika secret tidak disertakan atau salah', async () => {
		const request = new Request('https://www.cholazey.store/api/health');
		const url = new URL('https://www.cholazey.store/api/health');

		const response = await GET({ request, url } as unknown as HealthRequestEvent);
		expect(response.status).toBe(401);

		const data = await response.json();
		expect(data).toEqual({ error: 'Unauthorized' });
		expect(mockDbExecute).not.toHaveBeenCalled();
	});

	it('menerima request jika header x-monitoring-secret valid dan mengembalikan status ok saat semua layanan sehat', async () => {
		mockDbExecute.mockResolvedValueOnce([{ '?column?': 1 }]);
		mockRedisPing.mockResolvedValueOnce('PONG');

		const request = new Request('https://www.cholazey.store/api/health', {
			headers: { 'x-monitoring-secret': 'test-secret-123' }
		});
		const url = new URL('https://www.cholazey.store/api/health');

		const response = await GET({ request, url } as unknown as HealthRequestEvent);
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.status).toBe('ok');
		expect(data.services.database.status).toBe('up');
		expect(typeof data.services.database.latency_ms).toBe('number');
		expect(data.services.redis.status).toBe('up');
		expect(typeof data.services.redis.latency_ms).toBe('number');
		expect(response.headers.get('Cache-Control')).toContain('no-store');
	});

	it('menerima request jika query param token valid', async () => {
		mockDbExecute.mockResolvedValueOnce([{ '?column?': 1 }]);
		mockRedisPing.mockResolvedValueOnce('PONG');

		const request = new Request('https://www.cholazey.store/api/health?token=test-secret-123');
		const url = new URL('https://www.cholazey.store/api/health?token=test-secret-123');

		const response = await GET({ request, url } as unknown as HealthRequestEvent);
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.status).toBe('ok');
	});

	it('mengembalikan status 503 degraded jika database query gagal', async () => {
		mockDbExecute.mockRejectedValueOnce(new Error('Connection lost to pooler'));
		mockRedisPing.mockResolvedValueOnce('PONG');

		const request = new Request('https://www.cholazey.store/api/health', {
			headers: { 'x-monitoring-secret': 'test-secret-123' }
		});
		const url = new URL('https://www.cholazey.store/api/health');

		const response = await GET({ request, url } as unknown as HealthRequestEvent);
		expect(response.status).toBe(503);

		const data = await response.json();
		expect(data.status).toBe('degraded');
		expect(data.services.database.status).toBe('down');
		expect(data.services.redis.status).toBe('up');
		// Pastikan detail error database tidak bocor ke client
		expect(JSON.stringify(data)).not.toContain('Connection lost to pooler');
	});

	it('mengembalikan status 503 degraded jika Upstash Redis gagal', async () => {
		mockDbExecute.mockResolvedValueOnce([{ '?column?': 1 }]);
		mockRedisPing.mockRejectedValueOnce(new Error('Redis cluster unreachable'));

		const request = new Request('https://www.cholazey.store/api/health', {
			headers: { 'x-monitoring-secret': 'test-secret-123' }
		});
		const url = new URL('https://www.cholazey.store/api/health');

		const response = await GET({ request, url } as unknown as HealthRequestEvent);
		expect(response.status).toBe(503);

		const data = await response.json();
		expect(data.status).toBe('degraded');
		expect(data.services.database.status).toBe('up');
		expect(data.services.redis.status).toBe('down');
		// Pastikan detail error redis tidak bocor ke client
		expect(JSON.stringify(data)).not.toContain('Redis cluster unreachable');
	});

	it('menggunakan cache in-memory untuk panggilan berulang dalam 30 detik', async () => {
		mockDbExecute.mockResolvedValueOnce([{ '?column?': 1 }]);
		mockRedisPing.mockResolvedValueOnce('PONG');

		const request1 = new Request('https://www.cholazey.store/api/health', {
			headers: { 'x-monitoring-secret': 'test-secret-123' }
		});
		const url1 = new URL('https://www.cholazey.store/api/health');

		const response1 = await GET({ request: request1, url: url1 } as unknown as HealthRequestEvent);
		expect(response1.status).toBe(200);
		expect(mockDbExecute).toHaveBeenCalledTimes(1);

		// Panggilan kedua segera setelah panggilan pertama (harus dilayani dari cache)
		const request2 = new Request('https://www.cholazey.store/api/health', {
			headers: { 'x-monitoring-secret': 'test-secret-123' }
		});
		const url2 = new URL('https://www.cholazey.store/api/health');

		const response2 = await GET({ request: request2, url: url2 } as unknown as HealthRequestEvent);
		expect(response2.status).toBe(200);
		// mockDbExecute tidak boleh dipanggil lagi karena terproteksi cache in-memory
		expect(mockDbExecute).toHaveBeenCalledTimes(1);
	});
});
