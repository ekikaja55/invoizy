import { getSettings } from '$lib/server/db/queries/settings';
import { getActivePromoRules } from '$lib/server/db/queries/order';
import { isMaintenanceMode } from '$lib/server/maintenance';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	const [settings, promoRules] = await Promise.all([getSettings(), getActivePromoRules()]);
	const isAdmin = Boolean(locals.user);

	depends('app:maintenance');

	const isMaintenanceActive = isAdmin ? await isMaintenanceMode() : false;

	return {
		contactInfo: {
			wa: settings?.proofContact || '',
			instagram: settings?.instagram || ''
		},
		promoRules,
		isMaintenanceActive
	};
};
