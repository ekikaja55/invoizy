import { mockInvoice } from '../mock-data';
import { renderTestInvoicePdf } from '../render-test-pdf';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Pastikan mock invoice memiliki data diskon dan metode shipping untuk evaluasi visual utuh
	const testData = {
		...mockInvoice,
		order: {
			...mockInvoice.order,
			discountTotal: 15000,
			shippingLabel: 'Pickup Day 1 (ChibiconXI Booth)',
			subtotal: 125000,
			total: 130000 // 125.000 - 15.000 (diskon) + 20.000 (ongkir/layanan) = 130.000
		}
	};

	const pdfBytes = await renderTestInvoicePdf(testData);
	const body = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;

	return new Response(new Blob([body], { type: 'application/pdf' }), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'inline; filename="INVOICE-EKSPERIMEN-CHOLAZEY.pdf"',
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};
