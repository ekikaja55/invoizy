import { error } from '@sveltejs/kit';
import { getOrderByToken, updateOrderInvoiceResult } from '$lib/server/db/queries/order';
import { FILE_PREFIX } from '$lib/constants';
import { toInvoiceData, ensureInvoicePdf } from '$lib/server/invoice/process';
import { downloadInvoicePdf } from '$lib/server/storage/supabase';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// Render pdf-lib murni (font standar PDF, tanpa aset native) — aman di edge/node serverless.
export const GET: RequestHandler = async ({ params, url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		throw error(400, 'Link PDF tidak lengkap (token hilang). Buka lewat link dari email.');
	}

	const result = await getOrderByToken(params.orderId, token);

	if (!result) {
		throw error(404, 'Invoice tidak ditemukan. Cek kembali link dari email.');
	}

	try {
		let pdf: Uint8Array;

		if (result.order.pdfFilePath) {
			// Idempotency: file sudah ada → pakai ulang, jangan render dobel.
			try {
				pdf = await downloadInvoicePdf(result.order.pdfFilePath);
			} catch {
				// File hilang dari Storage (dihapus manual) → generate ulang.
				const ensured = await ensureInvoicePdf(params.orderId, token, toInvoiceData(result));
				pdf = ensured.pdf;
			}
		} else {
			await updateOrderInvoiceResult(params.orderId, { invoiceStatus: 'GENERATING', error: null });
			const ensured = await ensureInvoicePdf(params.orderId, token, toInvoiceData(result));
			pdf = ensured.pdf;
		}

		const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
		return new Response(new Blob([body], { type: 'application/pdf' }), {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `inline; filename="${FILE_PREFIX}-invoice-${params.orderId}.pdf"`,
				'Cache-Control': 'private, max-age=60'
			}
		});
	} catch (err) {
		logger.error('invoice.pdf-failed', { orderId: params.orderId, error: err });
		await updateOrderInvoiceResult(params.orderId, {
			invoiceStatus: 'FAILED',
			error: err instanceof Error ? err.message : 'Gagal membuat PDF.'
		});
		throw error(500, 'Gagal membuat PDF invoice. Silakan coba lagi.');
	}
};
