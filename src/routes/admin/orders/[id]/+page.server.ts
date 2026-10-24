import { error, fail } from '@sveltejs/kit';
import { getOrderById } from '$lib/server/db/queries/order';
import { getSettings } from '$lib/server/db/queries/settings';
import {
	regenerateInvoicePdf,
	resendInvoiceEmail,
	markInvoiceSent,
	setPaymentStatus
} from '$lib/server/invoice/process';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [order, settings] = await Promise.all([
		getOrderById(params.id),
		getSettings()
	]);

	if (!order) {
		throw error(404, 'Order tidak ditemukan.');
	}

	return {
		storeSettings: {
			storeName: settings?.storeName ?? '',
			shopeeCheckoutUrl: settings?.shopeeCheckoutUrl ?? ''
		},
		order: {
			orderId: order.orderId,
			accessToken: order.accessToken,
			handle: order.handle,
			email: order.email,
			note: order.note,
			address: order.address,
			phone: order.phone,
			subtotal: order.subtotal,
			discountTotal: order.discountTotal ?? 0,
			total: order.total,
			shippingType: order.shippingType ?? 'MAIL_ORDER',
			shippingLabel: order.shippingLabel,
			invoiceStatus: order.invoiceStatus,
			paymentStatus: order.paymentStatus,
			paymentProofUrl: order.paymentProofUrl,
			paymentProofPath: order.paymentProofPath,
			paymentProofUploadedAt: order.paymentProofUploadedAt ? order.paymentProofUploadedAt.toISOString() : null,
			paymentMethod: order.paymentMethod,
			expiresAt: order.expiresAt ? order.expiresAt.toISOString() : null,
			invoiceUrl: order.invoiceUrl,
			pdfFilePath: order.pdfFilePath,
			error: order.error,
			createdAt: order.createdAt.toISOString(),
			updatedAt: order.updatedAt.toISOString(),
			items: order.items.map((i) => ({
				nameSnapshot: i.nameSnapshot,
				variantNameSnapshot: i.variantNameSnapshot,
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

	markSent: async ({ params }) => {
		try {
			await markInvoiceSent(params.id);
			return { success: true };
		} catch (err) {
			logger.error('admin.invoice-marksent-failed', { orderId: params.id, error: err });
			return fail(500, {
				error: err instanceof Error ? err.message : 'Gagal menandai terkirim.'
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

			// Otomatis regenerasi PDF di storage agar stempel status langsung terbarukan.
			// Dibungkus safe try-catch agar jika koneksi storage ada kendala sesaat,
			// update status di database tetap sukses dan tidak membingungkan admin.
			let pdfRegenerated = false;
			try {
				await regenerateInvoicePdf(params.id);
				pdfRegenerated = true;
			} catch (pdfErr) {
				logger.warn('admin.payment-status.pdf-regen-deferred', { orderId: params.id, error: pdfErr });
			}

			return { success: true, pdfRegenerated, paymentStatus: status };
		} catch (err) {
			logger.error('admin.payment-status-failed', { orderId: params.id, error: err });
			const invalid = err instanceof Error && err.message === 'Status pembayaran tidak valid.';
			return fail(invalid ? 400 : 500, {
				error: err instanceof Error ? err.message : 'Gagal mengubah status pembayaran.'
			});
		}
	}
};
