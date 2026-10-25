import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { logger } from '$lib/server/logger';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	try {
		const session = await auth.api.getSession({ headers: event.request.headers });

		if (session) {
			logger.debug('cek sesi', {
				userId: session.user.id,
				email: session.user.email,
				sessionId: session.session.id,
				expiresAt: session.session.expiresAt
			});
			event.locals.session = session.session;
			event.locals.user = session.user;
		} else {
			event.locals.session = undefined;
			event.locals.user = undefined;
		}
	} catch (err) {
		logger.warn('Gagal membaca sesi database di hooks (kemungkinan DB timeout sesaat)', {
			error: err instanceof Error ? err.message : String(err)
		});
		event.locals.session = undefined;
		event.locals.user = undefined;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
