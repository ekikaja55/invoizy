import { Resend } from 'resend';
import { createHash } from 'node:crypto';
import { render } from 'svelte/server';
import { env } from '$env/dynamic/private';
import { FILE_PREFIX } from '$lib/constants';
import { logger } from '$lib/server/logger';
import InvoiceEmail from './templates/invoice-email.svelte';

export interface SendInvoiceEmailInput {
	to: string;
	orderId: string;
	storeName: string;
	handle: string;
	total: number;
	invoiceUrl: string;
	proofContact: string;
	instagram: string;
	pdf: Uint8Array;
	paymentStatus?: string;
	reuploadUrl?: string;
}

export async function sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<void> {
	const apiKey = env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error('RESEND_API_KEY belum dikonfigurasi.');
	}

	const from = env.EMAIL_FROM;
	if (!from) {
		throw new Error('EMAIL_FROM belum dikonfigurasi.');
	}

	const { body } = await render(InvoiceEmail, {
		props: {
			storeName: input.storeName,
			orderId: input.orderId,
			handle: input.handle,
			total: input.total,
			invoiceUrl: input.invoiceUrl,
			proofContact: input.proofContact,
			instagram: input.instagram,
			paymentStatus: input.paymentStatus,
			reuploadUrl: input.reuploadUrl
		}
	});

	let subject = `Faktur Pesanan #${input.orderId} — ${input.storeName}`;
	if (input.paymentStatus === 'CONFIRMED') {
		subject = `Pembayaran LUNAS: Pesanan #${input.orderId} — ${input.storeName}`;
	} else if (input.paymentStatus === 'PENDING') {
		subject = `PENTING: Unggah Ulang Bukti Pembayaran #${input.orderId} — ${input.storeName}`;
	}

	// Idempotency per ISI konten (bukan per order): kirim ulang PDF yang sama
	// ter-dedupe aman, tapi generate ulang (byte berubah) tetap terkirim.
	// Tanpa ini, tombol "kirim ulang" setelah regenerate selalu ditolak Resend.
	const contentHash = createHash('sha256').update(input.pdf).digest('hex').slice(0, 16);

	const { error } = await new Resend(apiKey).emails.send(
		{
			from,
			to: [input.to],
			subject,
			html: body,
			attachments: [
				{ filename: `${FILE_PREFIX}-invoice-${input.orderId}.pdf`, content: Buffer.from(input.pdf) }
			]
		},
		{ idempotencyKey: `invoice/${input.orderId}/${contentHash}` }
	);

	if (error) {
		throw new Error(`Resend: ${error.message}`);
	}

	logger.info('invoice.email-sent', { orderId: input.orderId });
}
