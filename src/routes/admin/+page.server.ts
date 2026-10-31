import { getDashboardStats, listOrders } from '$lib/server/db/queries/order';
import { isMaintenanceMode } from '$lib/server/maintenance';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [stats, recent, isMaintenanceActive] = await Promise.all([
		getDashboardStats(),
		listOrders({}, 1, 5),
		isMaintenanceMode()
	]);

	return {
		stats,
		isMaintenanceActive,
		recent: recent.map((o) => ({
			orderId: o.orderId,
			handle: o.handle,
			total: o.total,
			invoiceStatus: o.invoiceStatus,
			paymentStatus: o.paymentStatus,
			createdAt: o.createdAt.toISOString(),
			itemQty: o.items.reduce((n, i) => n + i.qty, 0)
		}))
	};
};
