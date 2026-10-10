import { env as publicEnv } from '$env/dynamic/public';
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
			subtotal: result.order.subtotal,
			total: result.order.total,
			createdAt: result.order.createdAt.toISOString(),
			items: result.order.items.map((i) => ({
				nameSnapshot: i.nameSnapshot,
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
			paymentNote: result.settings.paymentNote
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
): Promise<{ skipped: boolean }> {
	const result = await getOrderByToken(orderId, accessToken);

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
		await sendInvoiceEmail({
			to: data.order.email,
			orderId,
			storeName: data.settings.storeName || 'Invoizy Store',
			handle: data.order.handle,
			total: data.order.total,
			invoiceUrl: link,
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
			storeName: data.settings.storeName || 'Invoizy Store',
			handle: data.order.handle,
			total: data.order.total,
			invoiceUrl: link,
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

const PAYMENT_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Admin: update status pembayaran manual. */
export async function setPaymentStatus(orderId: string, status: string): Promise<void> {
	if (!(PAYMENT_STATUSES as readonly string[]).includes(status)) {
		throw new Error('Status pembayaran tidak valid.');
	}

	await updateOrderPaymentStatus(orderId, status as PaymentStatus);
}
