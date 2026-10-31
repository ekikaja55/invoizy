import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		TELEGRAM_WEBHOOK_SECRET: 'mock-webhook-secret-xyz',
		TELEGRAM_BOT_TOKEN: 'mock-bot-token-12345',
		TELEGRAM_ALERT_CHAT_ID: '-1004470133375'
	}
}));

vi.mock('$lib/server/logger', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

const mockGetHealthStatus = vi.fn();
vi.mock('$lib/server/health', () => ({
	getHealthStatus: () => mockGetHealthStatus()
}));

import { POST } from '../../routes/api/telegram-webhook/+server';

type WebhookRequestEvent = Parameters<typeof POST>[0];

describe('Telegram Webhook API (+server.ts)', () => {
	const validSecretHeader = { 'x-telegram-bot-api-secret-token': 'mock-webhook-secret-xyz' };

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	it('mengembalikan 401 jika secret token salah atau tidak disertakan', async () => {
		const request = new Request('https://www.cholazey.store/api/telegram-webhook', {
			method: 'POST',
			headers: { 'x-telegram-bot-api-secret-token': 'wrong-secret' },
			body: JSON.stringify({ message: { text: '/status' } })
		});

		const res = await POST({ request } as unknown as WebhookRequestEvent);
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data).toEqual({ error: 'Unauthorized' });
	});

	it('mengembalikan 400 jika JSON payload rusak', async () => {
		const request = new Request('https://www.cholazey.store/api/telegram-webhook', {
			method: 'POST',
			headers: validSecretHeader,
			body: 'invalid-json{'
		});

		const res = await POST({ request } as unknown as WebhookRequestEvent);
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toBe('Invalid JSON payload');
	});

	it('mengabaikan secara senyap jika tidak ada teks pesan', async () => {
		const request = new Request('https://www.cholazey.store/api/telegram-webhook', {
			method: 'POST',
			headers: validSecretHeader,
			body: JSON.stringify({ update_id: 1 })
		});

		const res = await POST({ request } as unknown as WebhookRequestEvent);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.ignored).toBe('no_text_message');
	});

	it('mengabaikan secara senyap jika chat_id bukan grup resmi', async () => {
		const request = new Request('https://www.cholazey.store/api/telegram-webhook', {
			method: 'POST',
			headers: validSecretHeader,
			body: JSON.stringify({
				message: {
					message_id: 10,
					chat: { id: 999999999 },
					text: '/status'
				}
			})
		});

		const res = await POST({ request } as unknown as WebhookRequestEvent);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.ignored).toBe('unauthorized_chat');
		expect(mockGetHealthStatus).not.toHaveBeenCalled();
	});

	it('mengabaikan jika perintah bukan /status (misal teks biasa atau /check)', async () => {
		const request = new Request('https://www.cholazey.store/api/telegram-webhook', {
			method: 'POST',
			headers: validSecretHeader,
			body: JSON.stringify({
				message: {
					message_id: 10,
					chat: { id: -1004470133375 },
					text: 'halo kawan'
				}
			})
		});

		const res = await POST({ request } as unknown as WebhookRequestEvent);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.ignored).toBe('non_status_command');
		expect(mockGetHealthStatus).not.toHaveBeenCalled();
	});

	it('berhasil memproses /status dan membalas ke Telegram via sendMessage', async () => {
		mockGetHealthStatus.mockResolvedValueOnce({
			httpStatus: 200,
			payload: {
				status: 'ok',
				timestamp: '2026-11-01T04:30:00.000Z',
				uptime_s: 3665,
				services: {
					database: { status: 'up', latency_ms: 15 },
					redis: { status: 'up', latency_ms: 8 }
				}
			}
		});

		vi.mocked(global.fetch).mockResolvedValueOnce(
			new Response(JSON.stringify({ ok: true }), { status: 200 })
		);

		const request = new Request('https://www.cholazey.store/api/telegram-webhook', {
			method: 'POST',
			headers: validSecretHeader,
			body: JSON.stringify({
				message: {
					message_id: 101,
					chat: { id: -1004470133375 },
					text: '/status@cholazey_bot'
				}
			})
		});

		const res = await POST({ request } as unknown as WebhookRequestEvent);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toEqual({ ok: true, dispatched: true });

		expect(global.fetch).toHaveBeenCalledWith(
			'https://api.telegram.org/botmock-bot-token-12345/sendMessage',
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: expect.stringContaining('[CHOLAZEY.STORE STATUS INFORMATION]')
			})
		);

		// Verifikasi parameter kirim
		const callBody = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string);
		expect(callBody.chat_id).toBe(-1004470133375);
		expect(callBody.reply_to_message_id).toBe(101);
		expect(callBody.text).toContain('Database (Supabase): UP (15ms)');
		expect(callBody.text).toContain('Cache & KV (Upstash): UP (8ms)');
		expect(callBody.text).toContain('Server Uptime: 1h 1m 5s');
	});

	it('mengembalikan 502 jika API Telegram mengembalikan error', async () => {
		mockGetHealthStatus.mockResolvedValueOnce({
			httpStatus: 200,
			payload: {
				status: 'ok',
				timestamp: '2026-11-01T04:30:00.000Z',
				uptime_s: 10,
				services: {
					database: { status: 'up' },
					redis: { status: 'not_configured' }
				}
			}
		});

		vi.mocked(global.fetch).mockResolvedValueOnce(
			new Response(JSON.stringify({ ok: false, description: 'Forbidden' }), { status: 403 })
		);

		const request = new Request('https://www.cholazey.store/api/telegram-webhook', {
			method: 'POST',
			headers: validSecretHeader,
			body: JSON.stringify({
				message: {
					message_id: 102,
					chat: { id: -1004470133375 },
					text: '/status'
				}
			})
		});

		const res = await POST({ request } as unknown as WebhookRequestEvent);
		expect(res.status).toBe(502);
		const data = await res.json();
		expect(data.error).toBe('Telegram dispatch failed');
	});
});
