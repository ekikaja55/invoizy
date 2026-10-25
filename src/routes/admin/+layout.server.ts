import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.email !== env.ADMIN_EMAIL) {
		throw redirect(303, '/login');
	}

	return { user: locals.user };
};
