import { env as privateEnv } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { getActiveCatalog, createOrder, OrderError } from '$lib/server/db/queries/order';
import { getSettings } from '$lib/server/db/queries/settings';
import {
	checkoutSchema,
	checkoutItemsSchema,
	checkoutShippingSchema,
	type CheckoutItem,
	type CheckoutShipping
} from '$lib/schemas/order';
import { checkOrderSubmitRateLimit } from '$lib/server/ratelimit';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [catalog, settings] = await Promise.all([getActiveCatalog(), getSettings()]);

	return {
		productCategories: catalog,
		contact: settings?.proofContact || settings?.instagram || '',
		pickupEnabled: settings?.pickupCodeEnabled ?? false,
		emailEnabled: privateEnv.EMAIL_ENABLED !== 'false'
	};
};

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const formData = await request.formData();

		// Honeypot anti-bot: field tersembunyi yang cuma diisi bot. Manusia tidak mengisinya.
		const honeypot = formData.get('website');
		if (typeof honeypot === 'string' && honeypot.trim() !== '') {
			return { success: true }; // diam-diam tolak bot
		}

		// Rate limit per IP — cegah spam submit (honeypot lolos → ini lapis kedua).
		try {
			const rl = await checkOrderSubmitRateLimit(getClientAddress());
			if (!rl.success) {
				logger.warn('order.rate-limited', { remaining: rl.remaining });
				return fail(429, { error: 'Terlalu banyak percobaan. Silakan coba lagi beberapa menit.' });
			}
		} catch (err) {
			// Upstash bermasalah → jangan blokir order, tapi catat.
			logger.error('order.ratelimit-failed', { error: err });
		}

		const parsed = checkoutSchema.safeParse({
			handle: formData.get('handle'),
			email: formData.get('email'),
			note: formData.get('note'),
			address: (formData.get('address') as string) || '',
			phone: formData.get('phone')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
		}

		let items: CheckoutItem[];
		try {
			items = checkoutItemsSchema.parse(JSON.parse(String(formData.get('items') ?? '[]')));
		} catch {
			return fail(400, { error: 'Keranjang tidak valid. Silakan muat ulang halaman order.' });
		}

		let shipping: CheckoutShipping | null = null;
		const rawShipping = formData.get('shipping');
		if (typeof rawShipping === 'string' && rawShipping.trim() !== '') {
			try {
				shipping = checkoutShippingSchema.parse(JSON.parse(rawShipping));
			} catch {
				return fail(400, { error: 'Opsi pengiriman tidak valid. Silakan pilih ulang.' });
			}
		}

		logger.info('order.submit', { items: items.length, hasShipping: shipping !== null });

		try {
			const { orderId, accessToken, expiresAt } = await createOrder({
				handle: parsed.data.handle,
				email: parsed.data.email,
				note: parsed.data.note ?? '',
				address: parsed.data.address,
				phone: parsed.data.phone,
				items,
				shipping
			});

			return { success: true, orderId, accessToken, expiresAt };
		} catch (err) {
			if (err instanceof OrderError) {
				return fail(400, { error: err.message });
			}
			logger.error('order.create-failed', { error: err });
			return fail(500, { error: 'Gagal membuat pesanan. Silakan coba lagi.' });
		}
	}
};
