import { Resend } from 'resend';
import { render } from 'svelte/server';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';
import InvoiceEmail from './templates/invoice-email.svelte';

export interface SendInvoiceEmailInput {
	to: string;
	orderId: string;
	storeName: string;
	handle: string;
	total: number;
	invoiceUrl: string;
	pdf: Uint8Array;
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
			invoiceUrl: input.invoiceUrl
		}
	});

	const { error } = await new Resend(apiKey).emails.send(
		{
			from,
			to: [input.to],
			subject: `Invoice ${input.orderId} — ${input.storeName}`,
			html: body,
			attachments: [{ filename: `invoice-${input.orderId}.pdf`, content: Buffer.from(input.pdf) }]
		},
		{ idempotencyKey: `invoice/${input.orderId}` }
	);

	if (error) {
		throw new Error(`Resend: ${error.message}`);
	}

	logger.info('invoice.email-sent', { orderId: input.orderId });
}
