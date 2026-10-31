import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getHealthStatus, _resetHealthCacheForTesting } from '$lib/server/health';

export { _resetHealthCacheForTesting };

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

	const { payload, httpStatus } = await getHealthStatus();

	return json(payload, {
		status: httpStatus,
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate'
		}
	});
};
