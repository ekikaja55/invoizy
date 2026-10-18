import { getSettings } from '$lib/server/db/queries/settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const settings = await getSettings();

	return {
		contactInfo: {
			wa: settings?.proofContact || '',
			instagram: settings?.instagram || ''
		}
	};
};
