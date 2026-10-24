import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOrderByToken, submitPaymentProof } from '$lib/server/db/queries/order';
import { uploadPaymentProof } from '$lib/server/storage/supabase';
import { processNewInvoice } from '$lib/server/invoice/process';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const token = url.searchParams.get('token');
	if (!token) {
		throw error(404, 'Tautan akses tidak valid. Silakan periksa kembali tautan pesanan Anda.');
	}

	const result = await getOrderByToken(params.orderId, token);
	if (!result) {
		throw error(404, 'Pesanan tidak ditemukan.');
	}

	const { order, settings, paymentMethods: activeMethods, qrisCodes: activeQris } = result;

	const isReupload =
		url.searchParams.get('reupload') === 'true' ||
		Boolean(order.pdfFilePath) ||
		Boolean(order.invoiceUrl) ||
		Boolean(order.paymentProofUploadedAt);

	// Jika pembeli sudah mengunggah bukti dan statusnya sudah menunggu verifikasi atau terverifikasi,
	// langsung alihkan ke halaman sukses agar tidak mengunggah dua kali.
	if (order.paymentStatus === 'CONFIRMED' || order.paymentStatus === 'WAITING_VERIFICATION') {
		const redirectUrl = isReupload
			? `/order/sukses/${order.orderId}?token=${token}&reupload=true`
			: `/order/sukses/${order.orderId}?token=${token}`;
		throw redirect(303, redirectUrl);
	}

	return {
		order: {
			orderId: order.orderId,
			accessToken: order.accessToken,
			handle: order.handle,
			email: order.email,
			total: order.total,
			subtotal: order.subtotal,
			discountTotal: order.discountTotal,
			shippingType: order.shippingType,
			shippingLabel: order.shippingLabel,
			expiresAt: order.expiresAt ? order.expiresAt.toISOString() : null,
			paymentStatus: order.paymentStatus,
			items: order.items
		},
		paymentMethods: activeMethods,
		qrisCodes: activeQris,
		contact: settings?.proofContact || settings?.instagram || '',
		isReupload
	};
};

export const actions: Actions = {
	uploadProof: async ({ params, request, url }) => {
		const formData = await request.formData();
		const token = (formData.get('token') as string) || url.searchParams.get('token');
		if (!token) {
			logger.warn('order.payment-proof.unauthorized', {
				orderId: params.orderId,
				reason: 'Token akses kosong di form maupun URL'
			});
			return fail(400, { error: 'Otorisasi token tidak sah. Pastikan Anda membuka tautan yang benar.' });
		}

		const file = formData.get('proof');
		const paymentMethod = (formData.get('paymentMethod') as string) || 'QRIS / Transfer Bank';

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Silakan pilih file foto bukti pembayaran terlebih dahulu.' });
		}

		if (file.size > 5 * 1024 * 1024) {
			return fail(400, { error: 'Ukuran file foto bukti maksimal 5MB.' });
		}

		logger.info('order.payment-proof.received', {
			orderId: params.orderId,
			paymentMethod,
			fileSize: file.size,
			fileName: file.name
		});

		// Cek batas kedaluwarsa pesanan di server
		const existingOrder = await db.query.orders.findFirst({
			where: and(eq(orders.orderId, params.orderId), eq(orders.accessToken, token))
		});

		if (!existingOrder) {
			logger.warn('order.payment-proof.not-found', { orderId: params.orderId });
			return fail(404, { error: 'Pesanan tidak ditemukan.' });
		}

		const isReupload =
			formData.get('isReupload') === 'true' ||
			url.searchParams.get('reupload') === 'true' ||
			Boolean(existingOrder.pdfFilePath) ||
			Boolean(existingOrder.invoiceUrl) ||
			Boolean(existingOrder.paymentProofUploadedAt);

		if (
			existingOrder.paymentStatus === 'EXPIRED' ||
			(existingOrder.expiresAt && new Date() > existingOrder.expiresAt && existingOrder.paymentStatus === 'PENDING')
		) {
			return fail(400, {
				error: 'Batas waktu pembayaran pesanan ini telah habis. Silakan buat pesanan baru di katalog.'
			});
		}

		try {
			// Unggah foto ke storage
			const uploadRes = await uploadPaymentProof(params.orderId, file);

			// Rekam status ke database
			await submitPaymentProof(params.orderId, token, {
				proofUrl: uploadRes.url,
				proofPath: uploadRes.path,
				paymentMethod
			});

			logger.info('order.payment-proof.submitted', {
				orderId: params.orderId,
				proofUrl: uploadRes.url
			});

			// Generate invoice PDF & kirim email resmi sekarang
			try {
				await processNewInvoice(params.orderId, token);
			} catch (err) {
				logger.error('order.payment-proof.invoice-failed', {
					orderId: params.orderId,
					error: err
				});
			}
		} catch (err) {
			logger.error('order.payment-proof.upload-failed', {
				orderId: params.orderId,
				error: err
			});
			return fail(500, {
				error: err instanceof Error ? err.message : 'Gagal mengunggah bukti pembayaran.'
			});
		}

		const redirectTarget = isReupload
			? `/order/sukses/${params.orderId}?token=${token}&reupload=true`
			: `/order/sukses/${params.orderId}?token=${token}`;
		throw redirect(303, redirectTarget);
	}
};
