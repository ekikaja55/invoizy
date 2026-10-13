import { error, fail } from '@sveltejs/kit';
import { getOrderById } from '$lib/server/db/queries/order';
import {
	regenerateInvoicePdf,
	resendInvoiceEmail,
	setPaymentStatus
} from '$lib/server/invoice/process';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const order = await getOrderById(params.id);

	if (!order) {
		throw error(404, 'Order tidak ditemukan.');
	}

	return {
		order: {
			orderId: order.orderId,
			accessToken: order.accessToken,
			handle: order.handle,
			email: order.email,
			note: order.note,
			subtotal: order.subtotal,
			total: order.total,
			invoiceStatus: order.invoiceStatus,
			paymentStatus: order.paymentStatus,
			invoiceUrl: order.invoiceUrl,
			pdfFilePath: order.pdfFilePath,
			error: order.error,
			createdAt: order.createdAt.toISOString(),
			updatedAt: order.updatedAt.toISOString(),
			items: order.items.map((i) => ({
				nameSnapshot: i.nameSnapshot,
				priceSnapshot: i.priceSnapshot,
				qty: i.qty,
				subtotal: i.subtotal,
				categorySnapshot: i.categorySnapshot
			}))
		}
	};
};

export const actions: Actions = {
	regenerate: async ({ params }) => {
		try {
			await regenerateInvoicePdf(params.id);
			return { success: true };
		} catch (err) {
			logger.error('admin.invoice-regenerate-failed', { orderId: params.id, error: err });
			return fail(500, {
				error: err instanceof Error ? err.message : 'Gagal generate ulang PDF.'
			});
		}
	},

	resend: async ({ params }) => {
		try {
			await resendInvoiceEmail(params.id);
			return { success: true };
		} catch (err) {
			logger.error('admin.invoice-resend-failed', { orderId: params.id, error: err });
			return fail(500, {
				error: err instanceof Error ? err.message : 'Gagal mengirim ulang email.'
			});
		}
	},

	setPayment: async ({ params, request }) => {
		const formData = await request.formData();
		const status = formData.get('paymentStatus');

		if (typeof status !== 'string') {
			return fail(400, { error: 'Status pembayaran tidak valid.' });
		}

		try {
			await setPaymentStatus(params.id, status);
			return { success: true };
		} catch (err) {
			logger.error('admin.payment-status-failed', { orderId: params.id, error: err });
			const invalid = err instanceof Error && err.message === 'Status pembayaran tidak valid.';
			return fail(invalid ? 400 : 500, {
				error: err instanceof Error ? err.message : 'Gagal mengubah status pembayaran.'
			});
		}
	}
};
