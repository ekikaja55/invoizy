import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import { inArray } from 'drizzle-orm';
import { checkVerifyHistoryRateLimit } from '$lib/server/ratelimit';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const rl = await checkVerifyHistoryRateLimit(getClientAddress());
		if (!rl.success) {
			return json(
				{ error: 'Terlalu banyak permintaan verifikasi riwayat. Coba lagi sebentar.' },
				{ status: 429 }
			);
		}
	} catch (err) {
		logger.error('orders.verify-history.ratelimit-failed', { error: err });
	}

	let body: { entries?: { orderId: string; token: string }[] };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Payload tidak valid' }, { status: 400 });
	}

	const entries = body.entries;
	if (!Array.isArray(entries) || entries.length === 0) {
		return json({ results: [] });
	}

	const cleanEntries = entries
		.filter((e) => typeof e?.orderId === 'string' && typeof e?.token === 'string')
		.slice(0, 30);

	if (cleanEntries.length === 0) {
		return json({ results: [] });
	}

	const orderIds = cleanEntries.map((e) => e.orderId);
	const dbOrders = await db.query.orders.findMany({
		where: inArray(orders.orderId, orderIds),
		columns: {
			orderId: true,
			accessToken: true,
			paymentStatus: true,
			invoiceStatus: true,
			total: true,
			expiresAt: true,
			paymentProofUrl: true
		}
	});

	const dbMap = new Map(dbOrders.map((o) => [o.orderId, o]));

	const results = cleanEntries.map((entry) => {
		const match = dbMap.get(entry.orderId);
		if (!match) {
			return {
				orderId: entry.orderId,
				valid: false,
				reason: 'NOT_FOUND'
			};
		}

		if (match.accessToken !== entry.token) {
			return {
				orderId: entry.orderId,
				valid: false,
				reason: 'TOKEN_MISMATCH'
			};
		}

		const isExpired = Boolean(
			match.paymentStatus === 'EXPIRED' ||
				(match.expiresAt && new Date() > match.expiresAt && match.paymentStatus === 'PENDING')
		);

		return {
			orderId: entry.orderId,
			token: entry.token,
			valid: true,
			paymentStatus: match.paymentStatus,
			invoiceStatus: match.invoiceStatus,
			total: match.total,
			hasProof: Boolean(match.paymentProofUrl),
			isExpired
		};
	});

	return json({ results });
};
