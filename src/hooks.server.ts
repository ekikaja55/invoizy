import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { logger } from '$lib/server/logger';
import { checkLoginRateLimit } from '$lib/server/ratelimit';
import { isMaintenanceMode } from '$lib/server/maintenance';

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

const handleMaintenance: Handle = async ({ event, resolve }) => {
	const maintenanceActive = await isMaintenanceMode();
	const pathname = event.url.pathname;

	// Jika pemeliharaan TIDAK aktif, cegah user mengakses rute /maintenance secara manual
	if (!maintenanceActive) {
		if (pathname === '/maintenance' || pathname === '/maintenance/') {
			return new Response(null, {
				status: 302,
				headers: { Location: '/' }
			});
		}
		return resolve(event);
	}

	// Mode pemeliharaan AKTIF:
	// 1. Izinkan aset statis, font, gambar, dan bundle client
	if (
		pathname.startsWith('/_app/') ||
		pathname.startsWith('/favicon.') ||
		pathname.startsWith('/cholazey_') ||
		pathname.startsWith('/og.') ||
		pathname.endsWith('.png') ||
		pathname.endsWith('.jpg') ||
		pathname.endsWith('.jpeg') ||
		pathname.endsWith('.svg') ||
		pathname.endsWith('.ico') ||
		pathname.endsWith('.webmanifest')
	) {
		return resolve(event);
	}

	// 2. Izinkan akses portal admin, login, dan autentikasi
	const isAdmin = Boolean(event.locals.user);
	const isAdminRoute =
		pathname.startsWith('/admin') ||
		pathname.startsWith('/login') ||
		pathname.startsWith('/api/auth');

	if (isAdmin || isAdminRoute) {
		return resolve(event);
	}

	// 3. Izinkan akses sandbox perancang untuk keperluan inspeksi dev
	if (pathname.startsWith('/test-desain')) {
		return resolve(event);
	}

	// 4. Kembalikan 503 JSON untuk request API publik non-auth
	if (pathname.startsWith('/api/')) {
		return new Response(
			JSON.stringify({
				error: 'Service Unavailable',
				message: 'Toko sedang dalam pemeliharaan sistem. Silakan coba beberapa saat lagi.'
			}),
			{
				status: 503,
				headers: {
					'Content-Type': 'application/json',
					'Retry-After': '3600'
				}
			}
		);
	}

	// 5. Alihkan seluruh halaman publik ke /maintenance dengan status 307
	if (pathname !== '/maintenance') {
		return new Response(null, {
			status: 307,
			headers: {
				Location: '/maintenance',
				'Retry-After': '3600'
			}
		});
	}

	// 6. Pada halaman /maintenance, render halaman dengan status resmi HTTP 503 Service Unavailable
	const response = await resolve(event);
	return new Response(response.body, {
		status: 503,
		statusText: 'Service Unavailable',
		headers: {
			...Object.fromEntries(response.headers.entries()),
			'Retry-After': '3600'
		}
	});
};

export const handle: Handle = sequence(handleBetterAuth, handleMaintenance);
