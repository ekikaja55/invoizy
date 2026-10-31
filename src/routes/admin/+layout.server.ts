import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { isMaintenanceMode } from '$lib/server/maintenance';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	if (!locals.user || locals.user.email !== env.ADMIN_EMAIL) {
		throw redirect(303, '/login');
	}

	depends('app:maintenance');

	const isMaintenanceActive = await isMaintenanceMode();

	return {
		user: locals.user,
		isMaintenanceActive
	};
};
