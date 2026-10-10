import { error } from '@sveltejs/kit';
import { getOrderByToken } from '$lib/server/db/queries/order';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		throw error(400, 'Link invoice tidak lengkap (token hilang). Buka lewat link dari email.');
	}

	const result = await getOrderByToken(params.orderId, token);

	if (!result) {
		throw error(404, 'Invoice tidak ditemukan. Cek kembali link dari email.');
	}

	// Serialisasi eksplisit: Date → ISO agar aman di-serialize ke client
	// dan bentuknya persis InvoiceData (dipakai web + render PDF nanti).
	return {
		order: {
			orderId: result.order.orderId,
			handle: result.order.handle,
			email: result.order.email,
			note: result.order.note,
			subtotal: result.order.subtotal,
			total: result.order.total,
			createdAt: result.order.createdAt.toISOString(),
			items: result.order.items.map((i) => ({
				nameSnapshot: i.nameSnapshot,
				priceSnapshot: i.priceSnapshot,
				qty: i.qty,
				subtotal: i.subtotal,
				categorySnapshot: i.categorySnapshot
			}))
		},
		settings: {
			storeName: result.settings.storeName,
			instagram: result.settings.instagram,
			twitter: result.settings.twitter,
			emailFromName: result.settings.emailFromName,
			paymentNote: result.settings.paymentNote
		},
		paymentMethods: result.paymentMethods.map((m) => ({
			label: m.label,
			accountNumber: m.accountNumber,
			accountHolder: m.accountHolder,
			note: m.note,
			type: m.type as 'bank' | 'va' | 'other'
		})),
		qrisCodes: result.qrisCodes.map((q) => ({
			label: q.label,
			imageUrl: q.imageUrl
		}))
	};
};
