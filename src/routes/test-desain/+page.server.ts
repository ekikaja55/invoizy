import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
	// Guard: Hanya pengguna yang sudah terotentikasi (login) yang dapat mengakses lab desain ini.
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		throw redirect(303, '/login');
	}

	return {
		user: session.user
	};
};
