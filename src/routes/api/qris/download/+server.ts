import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const targetUrl = url.searchParams.get('url');
	if (!targetUrl) {
		throw error(400, 'Parameter URL QRIS diperlukan.');
	}

	try {
		// Fetch file gambar via server internal (bypass CORS client-side)
		const response = await fetch(targetUrl);
		if (!response.ok) {
			throw error(response.status, 'Gagal mengambil gambar QRIS dari server penyimpanan.');
		}

		const contentType = response.headers.get('content-type') || 'image/png';
		const arrayBuffer = await response.arrayBuffer();

		return new Response(arrayBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': 'attachment; filename="cholazey-qris.png"',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch {
		throw error(500, 'Terjadi kesalahan saat memproses unduhan QRIS.');
	}
};
