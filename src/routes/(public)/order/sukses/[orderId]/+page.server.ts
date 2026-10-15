import { env as privateEnv } from '$env/dynamic/private';
import { getSettings } from '$lib/server/db/queries/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const settings = await getSettings();
	return {
		orderId: params.orderId,
		token: url.searchParams.get('token'),
		contact: settings?.proofContact || settings?.instagram || '',
		emailEnabled: privateEnv.EMAIL_ENABLED !== 'false'
	};
};
