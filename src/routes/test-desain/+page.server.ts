import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Guard: Hanya aktif di local dev server. Di production otomatis 404.
	if (!dev) {
		throw error(404, 'Halaman ini hanya tersedia di lingkungan development.');
	}

	return {};
};
