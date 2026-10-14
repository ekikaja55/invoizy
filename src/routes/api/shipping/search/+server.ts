import { searchDestinations, ShippingError } from '$lib/server/shipping/client';
import { checkShippingRateLimit } from '$lib/server/ratelimit';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// Proxy autocomplete tujuan — key RajaOngkir tidak boleh ke client.
export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	try {
		const rl = await checkShippingRateLimit(getClientAddress());
		if (!rl.success) {
			return Response.json(
				{ error: 'Terlalu banyak percobaan. Coba lagi sebentar.' },
				{ status: 429 }
			);
		}
	} catch (err) {
		logger.error('shipping.search-ratelimit-failed', { error: err });
	}

	const q = url.searchParams.get('q') ?? '';

	try {
		const results = await searchDestinations(q, 10);
		return Response.json({ results });
	} catch (err) {
		if (err instanceof ShippingError) {
			if (err.status === 429) logger.warn('shipping.search-quota-route', { q });
			return Response.json({ error: err.message }, { status: 400 });
		}
		logger.error('shipping.search-failed', { error: err });
		return Response.json({ error: 'Gagal mencari tujuan.' }, { status: 500 });
	}
};
