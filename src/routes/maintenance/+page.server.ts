import { redirect } from '@sveltejs/kit';
import { isMaintenanceMode } from '$lib/server/maintenance';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const active = await isMaintenanceMode();
	if (!active) {
		throw redirect(302, '/');
	}
	return {};
};
