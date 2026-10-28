import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { logger } from '$lib/server/logger';
import { checkLoginRateLimit } from '$lib/server/ratelimit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	// Proteksi rate limit pada endpoint login / sign-in (5 percobaan / 15 menit per IP)
	if (event.request.method === 'POST' && event.url.pathname.startsWith('/api/auth/sign-in')) {
		const clientIp = event.getClientAddress();
		const rl = await checkLoginRateLimit(clientIp);
		if (!rl.success) {
			logger.warn('Rate limit login terlampaui', { ip: clientIp });
			return new Response(
				JSON.stringify({
					message: 'Terlalu banyak percobaan login. Silakan tunggu 15 menit.'
				}),
				{
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)))
					}
				}
			);
		}
	}
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
