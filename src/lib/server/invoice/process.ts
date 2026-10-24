import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import {
	getOrderById,
	getOrderByToken,
	updateOrderInvoiceResult,
	updateOrderPaymentStatus
} from '$lib/server/db/queries/order';
import { renderInvoicePdf } from '$lib/server/pdf/render';
import { uploadInvoicePdf, downloadInvoicePdf } from '$lib/server/storage/supabase';
import { sendInvoiceEmail } from '$lib/server/email/client';
import { logger } from '$lib/server/logger';
import type { InvoiceData } from '$lib/components/invoice/index';

export type OrderByToken = NonNullable<Awaited<ReturnType<typeof getOrderByToken>>>;

export function toInvoiceData(result: OrderByToken): InvoiceData {
	return {
		order: {
			orderId: result.order.orderId,
			handle: result.order.handle,
			email: result.order.email,
			note: result.order.note,
			address: result.order.address,
			phone: result.order.phone,
			subtotal: result.order.subtotal,
			discountTotal: result.order.discountTotal ?? 0,
			total: result.order.total,
			shippingType: result.order.shippingType ?? 'MAIL_ORDER',
			shippingLabel: result.order.shippingLabel,
			paymentStatus: result.order.paymentStatus as 'PENDING' | 'CONFIRMED' | 'CANCELLED',
			createdAt: result.order.createdAt.toISOString(),
			items: result.order.items.map((i) => ({
				id: i.id,
				nameSnapshot: i.nameSnapshot,
				variantNameSnapshot: i.variantNameSnapshot,
				priceSnapshot: i.priceSnapshot,
				qty: i.qty,
				subtotal: i.subtotal,
				categorySnapshot: i.categorySnapshot
			}))
		},
		settings: {
			storeName: result.settings.storeName,
			instagram: result.settings.instagram,
			twitter: result.settings.twitter,
			emailFromName: result.settings.emailFromName,
			paymentNote: result.settings.paymentNote,
			proofContact: result.settings.proofContact
		},
		paymentMethods: result.paymentMethods.map((m) => ({
			label: m.label,
			accountNumber: m.accountNumber,
			accountHolder: m.accountHolder,
			note: m.note,
			type: m.type as 'bank' | 'va' | 'other'
		})),
		qrisCodes: result.qrisCodes.map((q) => ({
			label: q.label,
			imageUrl: q.imageUrl
		}))
	};
}

function invoiceLink(orderId: string, token: string): string {
	const base = publicEnv.PUBLIC_APP_URL || '';
	return base ? `${base}/invoice/${orderId}?token=${token}` : '';
}

/** Email on kecuali EMAIL_ENABLED=false (mode manual WA). Default: on. */
export function isEmailEnabled(): boolean {
	return privateEnv.EMAIL_ENABLED !== 'false';
}

/**
 * Pastikan PDF ada (pakai ulang bila sudah tersimpan) lalu upload.
 * Status → GENERATING (artefak siap, pengiriman email = langkah terpisah).
 */
export async function ensureInvoicePdf(
	orderId: string,
	token: string,
	data: InvoiceData,
	opts?: { force?: boolean; knownPath?: string | null }
): Promise<{ pdf: Uint8Array; path: string }> {
	if (!opts?.force && opts?.knownPath) {
		try {
			const pdf = await downloadInvoicePdf(opts.knownPath);
			return { pdf, path: opts.knownPath };
		} catch {
			// File hilang dari Storage (dihapus manual) → generate ulang di bawah.
		}
	}

	const pdf = await renderInvoicePdf(data);
	const { url, path } = await uploadInvoicePdf(orderId, pdf);

	const link = invoiceLink(orderId, token);
	await updateOrderInvoiceResult(orderId, {
		invoiceStatus: 'GENERATING',
		invoiceUrl: link || url,
		pdfFilePath: path,
		error: null
	});

	return { pdf, path };
}

/**
 * Orkestrasi otomatis setelah order dibuat: PDF → email → SENT.
 * Idempotency: order yang sudah SENT (atau sedang GENERATING di request lain)
 * tidak diproses ulang. Gagal di langkah mana pun → FAILED + error tercatat,
 * tapi order-nya sendiri tetap valid (jangan hapus order gara-gara email gagal).
 */
export async function processNewInvoice(
	orderId: string,
	accessToken: string
): Promise<{ skipped: boolean; emailSkipped?: boolean }> {
	let result = await getOrderByToken(orderId, accessToken);

	// Antisipasi race condition read-after-write pada Supabase transaction pooler (port 6543)
	if (!result) {
		await new Promise((resolve) => setTimeout(resolve, 200));
		result = await getOrderByToken(orderId, accessToken);
	}

	if (!result) {
		throw new Error('Order tidak ditemukan.');
	}

	if (result.order.invoiceStatus === 'SENT' || result.order.invoiceStatus === 'GENERATING') {
		return { skipped: true };
	}

	const data = toInvoiceData(result);

	try {
		await updateOrderInvoiceResult(orderId, { invoiceStatus: 'GENERATING', error: null });

		const { pdf, path } = await ensureInvoicePdf(orderId, accessToken, data, {
			knownPath: result.order.pdfFilePath
		});

		const link = invoiceLink(orderId, accessToken);
		if (!isEmailEnabled()) {
			// Mode manual: PDF tetap dibuat (arsip), pengiriman lewat WA oleh admin.
			// Status kembali PENDING = menunggu dikirim manual (jujur, bukan SENT bohongan).
			logger.info('invoice.email-skipped', { orderId });
			await updateOrderInvoiceResult(orderId, { invoiceStatus: 'PENDING', error: null });
			return { skipped: false, emailSkipped: true };
		}
		await sendInvoiceEmail({
			to: data.order.email,
			orderId,
			storeName: data.settings.storeName || 'cho.lazey - CHIBICONXI CATALOGUE',
			handle: data.order.handle,
			total: data.order.total,
			invoiceUrl: link,
			proofContact: data.settings.proofContact,
			instagram: data.settings.instagram,
			pdf
		});

		await updateOrderInvoiceResult(orderId, {
			invoiceStatus: 'SENT',
			invoiceUrl: link || result.order.invoiceUrl || undefined,
			pdfFilePath: path,
			error: null
		});

		return { skipped: false };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Gagal memproses invoice.';
		logger.error('invoice.process-failed', { orderId, error: err });
		await updateOrderInvoiceResult(orderId, { invoiceStatus: 'FAILED', error: message });
		throw err instanceof Error ? err : new Error(message);
	}
}

/** Admin: generate ulang PDF dari snapshot (paksa, tanpa kirim email). */
export async function regenerateInvoicePdf(orderId: string): Promise<void> {
	const head = await getOrderById(orderId);
	if (!head) {
		throw new Error('Order tidak ditemukan.');
	}

	const result = await getOrderByToken(orderId, head.accessToken);
	if (!result) {
		throw new Error('Order tidak ditemukan.');
	}

	await ensureInvoicePdf(orderId, head.accessToken, toInvoiceData(result), { force: true });
}

/** Admin: kirim ulang email (pakai ulang PDF bila ada). Aksi eksplisit → selalu kirim. */
export async function resendInvoiceEmail(orderId: string): Promise<void> {
	const head = await getOrderById(orderId);
	if (!head) {
		throw new Error('Order tidak ditemukan.');
	}

	const result = await getOrderByToken(orderId, head.accessToken);
	if (!result) {
		throw new Error('Order tidak ditemukan.');
	}

	if (!isEmailEnabled()) {
		throw new Error('Pengiriman email nonaktif (EMAIL_ENABLED=false). Kirim manual via WA.');
	}

	const data = toInvoiceData(result);

	try {
		const { path } = await ensureInvoicePdf(orderId, head.accessToken, data, {
			knownPath: result.order.pdfFilePath
		});

		const link = invoiceLink(orderId, head.accessToken);
		const pdf = await downloadInvoicePdf(path);
		await sendInvoiceEmail({
			to: data.order.email,
			orderId,
			storeName: data.settings.storeName || 'cho.lazey - CHIBICONXI CATALOGUE',
			handle: data.order.handle,
			total: data.order.total,
			invoiceUrl: link,
			proofContact: data.settings.proofContact,
			instagram: data.settings.instagram,
			pdf
		});

		await updateOrderInvoiceResult(orderId, {
			invoiceStatus: 'SENT',
			invoiceUrl: link || result.order.invoiceUrl || undefined,
			pdfFilePath: path,
			error: null
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Gagal mengirim ulang email.';
		logger.error('invoice.resend-failed', { orderId, error: err });
		await updateOrderInvoiceResult(orderId, { invoiceStatus: 'FAILED', error: message });
		throw err instanceof Error ? err : new Error(message);
	}
}

/** Admin: tandai invoice sudah dikirim manual (mis. via WA). */
export async function markInvoiceSent(orderId: string): Promise<void> {
	const head = await getOrderById(orderId);
	if (!head) {
		throw new Error('Order tidak ditemukan.');
	}
	await updateOrderInvoiceResult(orderId, { invoiceStatus: 'SENT', error: null });
}

const PAYMENT_STATUSES = [
	'PENDING',
	'WAITING_VERIFICATION',
	'CONFIRMED',
	'CANCELLED',
	'EXPIRED'
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Admin: update status pembayaran manual. */
export async function setPaymentStatus(orderId: string, status: string): Promise<void> {
	if (!(PAYMENT_STATUSES as readonly string[]).includes(status)) {
		throw new Error('Status pembayaran tidak valid.');
	}

	await updateOrderPaymentStatus(orderId, status as PaymentStatus);
}
