import { render } from 'svelte/server';
import InvoiceDocument from './InvoiceDocument.svelte';

export interface InvoiceData {
	order: {
		orderId: string;
		accessToken?: string;
		handle: string;
		email: string;
		note: string;
		address: string;
		phone: string;
		subtotal: number;
		discountTotal?: number;
		total: number;
		shippingType?: string;
		shippingLabel: string | null;
		createdAt: string | Date;
		paymentStatus?: 'PENDING' | 'WAITING_VERIFICATION' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
		items: {
			id?: string;
			nameSnapshot: string;
			variantNameSnapshot?: string | null;
			priceSnapshot: number;
			qty: number;
			subtotal: number;
			categorySnapshot: string;
		}[];
	};
	settings: {
		storeName: string;
		instagram: string;
		twitter: string;
		emailFromName: string;
		paymentNote: string | null;
		proofContact: string;
	};
	paymentMethods: {
		label: string;
		accountNumber: string;
		accountHolder: string;
		note: string | null;
		type: 'bank' | 'va' | 'other';
	}[];
	qrisCodes: {
		label: string;
		imageUrl: string;
	}[];
}

/**
 * Render InvoiceDocument ke HTML string untuk PDF generation (Satori)
 * Mode 'pdf' = tanpa tombol "Salin Nomor", styling fixed-width untuk A4
 */
export async function renderInvoiceHtml(data: InvoiceData): Promise<string> {
	const { body } = await render(InvoiceDocument, {
		props: { ...data, mode: 'pdf' }
	});
	return body;
}
