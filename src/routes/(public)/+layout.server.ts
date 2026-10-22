import { getSettings } from '$lib/server/db/queries/settings';
import { getActivePromoRules } from '$lib/server/db/queries/order';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const [settings, promoRules] = await Promise.all([
		getSettings(),
		getActivePromoRules()
	]);

	return {
		contactInfo: {
			wa: settings?.proofContact || '',
			instagram: settings?.instagram || ''
		},
		promoRules
	};
};
