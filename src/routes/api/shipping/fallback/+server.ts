import { getSettings } from '$lib/server/db/queries/settings';
import type { RequestHandler } from './$types';

// Tarif flat darurat untuk dipasang saat cek ongkir API gagal total.
// 0 = nonaktif (buyer harus menunggu API pulih).
export const GET: RequestHandler = async () => {
	const settings = await getSettings();
	return Response.json({ rate: settings?.emergencyFlatRate ?? 0 });
};
