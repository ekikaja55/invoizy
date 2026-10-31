import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setMaintenanceMode, isMaintenanceMode } from '$lib/server/maintenance';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.email !== env.ADMIN_EMAIL) {
		throw error(403, 'Akses ditolak: Hanya admin yang diizinkan mengubah status pemeliharaan.');
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body.active !== 'boolean') {
		throw error(400, 'Payload tidak valid: properti "active" (boolean) wajib disertakan.');
	}

	const success = await setMaintenanceMode(body.active);
	if (!success) {
		logger.error('admin.toggle-maintenance-failed', { active: body.active });
		throw error(500, 'Gagal memperbarui status mode pemeliharaan di sistem penyimpanan.');
	}

	logger.info('admin.toggle-maintenance-success', {
		adminEmail: locals.user.email,
		active: body.active
	});

	return json({ success: true, active: body.active });
};

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || locals.user.email !== env.ADMIN_EMAIL) {
		throw error(403, 'Akses ditolak.');
	}

	const active = await isMaintenanceMode();
	return json({ active });
};
