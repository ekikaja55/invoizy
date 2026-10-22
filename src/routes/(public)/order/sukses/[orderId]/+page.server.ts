import { env as privateEnv } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { getSettings } from '$lib/server/db/queries/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const token = url.searchParams.get('token');
	let customerEmail: string | null = null;

	if (token) {
		const order = await db.query.orders.findFirst({
			where: and(eq(orders.orderId, params.orderId), eq(orders.accessToken, token)),
			columns: {
				email: true
			}
		});
		customerEmail = order?.email ?? null;
	}

	const settings = await getSettings();
	return {
		orderId: params.orderId,
		token,
		customerEmail,
		contact: settings?.proofContact || settings?.instagram || '',
		emailEnabled: privateEnv.EMAIL_ENABLED !== 'false'
	};
};
