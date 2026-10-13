import { redirect } from '@sveltejs/kit';
import { listOrders, countOrders, ORDER_PER_PAGE } from '$lib/server/db/queries/order';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const filters = {
		invoice: url.searchParams.get('invoice') ?? '',
		payment: url.searchParams.get('payment') ?? '',
		q: url.searchParams.get('q') ?? '',
		from: url.searchParams.get('from') ?? '',
		to: url.searchParams.get('to') ?? ''
	};

	const rawPage = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
	const total = await countOrders(filters);
	const totalPages = Math.max(1, Math.ceil(total / ORDER_PER_PAGE));
	const page = Math.min(Math.max(Number.isFinite(rawPage) ? rawPage : 1, 1), totalPages);

	// URL basi (bookmark ?page=5 padahal tinggal 2 halaman) → kanonikalkan.
	if (String(page) !== (url.searchParams.get('page') ?? '1')) {
		const next = new URL(url);
		next.searchParams.set('page', String(page));
		throw redirect(303, `${next.pathname}?${next.searchParams.toString()}`);
	}

	const rows = await listOrders(filters, page);

	return {
		orders: rows.map((o) => ({
			orderId: o.orderId,
			handle: o.handle,
			email: o.email,
			total: o.total,
			invoiceStatus: o.invoiceStatus,
			paymentStatus: o.paymentStatus,
			createdAt: o.createdAt.toISOString(),
			itemQty: o.items.reduce((n, i) => n + i.qty, 0)
		})),
		total,
		page,
		totalPages,
		perPage: ORDER_PER_PAGE,
		filters
	};
};
