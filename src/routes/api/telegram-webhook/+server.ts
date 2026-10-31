import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';
import { getHealthStatus } from '$lib/server/health';

function formatUptime(uptimeS: number): string {
	const hours = Math.floor(uptimeS / 3600);
	const minutes = Math.floor((uptimeS % 3600) / 60);
	const seconds = uptimeS % 60;
	if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
	if (minutes > 0) return `${minutes}m ${seconds}s`;
	return `${seconds}s`;
}

export const POST: RequestHandler = async ({ request }) => {
	// 1. Verifikasi header rahasia Telegram Webhook jika dikonfigurasi
	const configuredWebhookSecret = env.TELEGRAM_WEBHOOK_SECRET;
	if (configuredWebhookSecret) {
		const headerSecret = request.headers.get('x-telegram-bot-api-secret-token');
		if (headerSecret !== configuredWebhookSecret) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
	}

	// 2. Parse JSON payload dari Telegram
	let body: Record<string, unknown>;
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 });
	}

	// 3. Ekstrak pesan dan chat
	const message = (body.message || body.channel_post) as
		| {
				message_id?: number;
				chat?: { id?: number | string };
				text?: string;
		  }
		| undefined;

	if (!message || !message.text) {
		return json({ ok: true, ignored: 'no_text_message' });
	}

	// 4. Filter otorisasi Chat ID (hanya izinkan grup resmi)
	const alertChatId = env.TELEGRAM_ALERT_CHAT_ID || '-1004470133375';
	if (String(message.chat?.id) !== String(alertChatId)) {
		return json({ ok: true, ignored: 'unauthorized_chat' });
	}

	// 5. Periksa trigger perintah (hanya merespons perintah /status)
	const normalizedText = message.text.trim().toLowerCase();
	if (!normalizedText.startsWith('/status')) {
		return json({ ok: true, ignored: 'non_status_command' });
	}

	// 6. Jalankan probe kesehatan internal
	const { payload, httpStatus } = await getHealthStatus();

	const dbStatus = payload.services.database.status.toUpperCase();
	const dbLatency =
		payload.services.database.latency_ms !== undefined
			? ` (${payload.services.database.latency_ms}ms)`
			: '';

	const redisStatus = payload.services.redis.status.toUpperCase();
	const redisLatency =
		payload.services.redis.latency_ms !== undefined
			? ` (${payload.services.redis.latency_ms}ms)`
			: '';

	// 7. Format teks balasan (murni teks tanpa karakter emoticon/emoji)
	const replyText = [
		'[CHOLAZEY.STORE STATUS INFORMATION]',
		'Target: https://www.cholazey.store',
		`Overall Status: ${payload.status.toUpperCase()} (HTTP ${httpStatus})`,
		`Database (Supabase): ${dbStatus}${dbLatency}`,
		`Cache & KV (Upstash): ${redisStatus}${redisLatency}`,
		`Server Uptime: ${formatUptime(payload.uptime_s)}`,
		`Timestamp: ${payload.timestamp}`
	].join('\n');

	// 8. Kirim balasan ke grup Telegram
	const botToken = env.TELEGRAM_BOT_TOKEN;
	if (!botToken) {
		logger.error('telegram-webhook.bot-token-missing');
		return json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
	}

	const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
	try {
		const res = await fetch(telegramApiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: message.chat?.id,
				reply_to_message_id: message.message_id,
				text: replyText
			})
		});

		if (!res.ok) {
			const errText = await res.text();
			logger.error('telegram-webhook.send-message-failed', {
				status: res.status,
				error: errText
			});
			return json({ ok: false, error: 'Telegram dispatch failed' }, { status: 502 });
		}
	} catch (err) {
		logger.error('telegram-webhook.network-error', {
			error: err instanceof Error ? err.message : String(err)
		});
		return json({ ok: false, error: 'Network error calling Telegram API' }, { status: 502 });
	}

	return json({ ok: true, dispatched: true });
};
