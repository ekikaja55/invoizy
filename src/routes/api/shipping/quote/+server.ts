import { z } from 'zod';
import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { inArray } from 'drizzle-orm';
import { getSettings } from '$lib/server/db/queries/settings';
import { calculateCourier, ShippingError, type CourierQuote } from '$lib/server/shipping/client';
import { SHIPPING_COURIERS } from '$lib/server/shipping/couriers';
import { checkShippingRateLimit } from '$lib/server/ratelimit';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

const quoteSchema = z.object({
	destinationId: z.number().int().positive('Tujuan tidak valid'),
	items: z
		.array(
			z.object({
				productId: z.string().uuid(),
				qty: z.number().int().min(1).max(999)
			})
		)
		.min(1)
		.max(100)
});

// Kalkulasi ongkir: berat & harga selalu dari DB, bukan dari client.
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const rl = await checkShippingRateLimit(getClientAddress());
		if (!rl.success) {
			return Response.json(
				{ error: 'Terlalu banyak percobaan. Coba lagi sebentar.' },
				{ status: 429 }
			);
		}
	} catch (err) {
		logger.error('shipping.quote-ratelimit-failed', { error: err });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: 'Body tidak valid.' }, { status: 400 });
	}

	const parsed = quoteSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(
			{ error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' },
			{ status: 400 }
		);
	}

	const rows = await db.query.products.findMany({
		where: inArray(
			products.id,
			parsed.data.items.map((i) => i.productId)
		)
	});
	const byId = new Map(rows.map((p) => [p.id, p]));

	let weightGrams = 0;
	for (const item of parsed.data.items) {
		const product = byId.get(item.productId);
		if (!product || !product.active) {
			return Response.json({ error: 'Ada produk yang tidak tersedia.' }, { status: 400 });
		}
		if (!product.weightGrams || product.weightGrams <= 0) {
			return Response.json(
				{ error: `Produk "${product.name}" belum ada data berat.` },
				{ status: 400 }
			);
		}
		weightGrams += product.weightGrams * item.qty;
	}

	const settings = await getSettings();
	const emergencyRate = settings?.emergencyFlatRate ?? 0;

	logger.info('shipping.quote', {
		destId: parsed.data.destinationId,
		items: parsed.data.items.length,
		weightGrams
	});

	const settled = await Promise.allSettled(
		SHIPPING_COURIERS.map((c) => calculateCourier(c.code, parsed.data.destinationId, weightGrams))
	);

	const options: CourierQuote[] = [];
	for (const r of settled) {
		if (r.status === 'fulfilled' && r.value.options.length > 0) {
			options.push(r.value);
		} else if (r.status === 'rejected') {
			logger.warn('shipping.courier-failed', {
				error: r.reason,
				fallbackable: r.reason instanceof ShippingError ? r.reason.fallbackable : undefined
			});
		}
	}

	// Semua kurir gagal → flat darurat (bila aktif) atau tolak dengan jelas.
	const failed = settled.filter((r) => r.status === 'rejected').length;
	const cached = options.filter((o) => o.cached).length;
	logger.info('shipping.quote-done', {
		destId: parsed.data.destinationId,
		couriers: options.length,
		failed,
		cached
	});
	if (options.length === 0) {
		if (emergencyRate > 0) {
			logger.warn('shipping.fallback-used', {
				destId: parsed.data.destinationId,
				rate: emergencyRate
			});
			return Response.json({
				options: [],
				weightGrams,
				fallback: { rate: emergencyRate }
			});
		}
		logger.warn('shipping.all-failed', { destId: parsed.data.destinationId });
		return Response.json(
			{ error: 'Layanan cek ongkir gangguan dan flat darurat nonaktif. Coba lagi nanti.' },
			{ status: 503 }
		);
	}

	return Response.json({ options, weightGrams, fallback: null });
};
