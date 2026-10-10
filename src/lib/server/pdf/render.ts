import { readFile } from 'node:fs/promises';
import satori from 'satori';
import { html as parseHtml } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import { PDFDocument } from 'pdf-lib';
import { formatRupiah } from '$lib/utils/currency';
import type { InvoiceData } from '$lib/components/invoice/index';

// Lebar kanvas PDF (px @96dpi ≈ lebar A4). PNG di-render 1.5x agar tajam.
const PDF_WIDTH = 794;
const PNG_WIDTH = 1191;

// Satori (Yoga) wajib display:flex eksplisit di tiap div yang punya >1 anak.
const COL = 'display:flex;flex-direction:column';
const ROW = 'display:flex;flex-direction:row';

interface PdfFont {
	name: string;
	data: ArrayBuffer;
	weight: 400 | 600 | 700;
	style: 'normal';
}

let fontsCache: PdfFont[] | null = null;

function toArrayBuffer(buf: Buffer): ArrayBuffer {
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

async function loadFonts(): Promise<PdfFont[]> {
	if (fontsCache) return fontsCache;

	// Font lokal (dibundel di repo) — tanpa fetch eksternal saat render.
	const dir = new URL('./fonts/', import.meta.url);
	const [regular, semiBold, bold] = await Promise.all([
		readFile(new URL('Inter-Regular.ttf', dir)),
		readFile(new URL('Inter-SemiBold.ttf', dir)),
		readFile(new URL('Inter-Bold.ttf', dir))
	]);

	fontsCache = [
		{ name: 'Inter', data: toArrayBuffer(regular), weight: 400, style: 'normal' },
		{ name: 'Inter', data: toArrayBuffer(semiBold), weight: 600, style: 'normal' },
		{ name: 'Inter', data: toArrayBuffer(bold), weight: 700, style: 'normal' }
	];
	return fontsCache;
}

function esc(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Template HTML khusus PDF — SEMUA styling inline.
 * Satori tidak mengeksekusi class Tailwind, jadi template ini disengaja
 * terpisah dari InvoiceDocument.svelte (web). Kontrak bersama = InvoiceData.
 */
export function buildInvoicePdfHtml(data: InvoiceData): string {
	const { order, settings, paymentMethods, qrisCodes } = data;
	const shippingDiff = order.total - order.subtotal;
	const createdLabel = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(order.createdAt));

	const font = "font-family:'Inter',sans-serif";

	const items = order.items
		.map(
			(i) => `
			<div style="${ROW};justify-content:space-between;padding:10px 0;border-bottom:1px solid #eeeeee;">
				<div style="${COL};">
					<div style="font-size:14px;font-weight:600;">${esc(i.nameSnapshot)}</div>
					<div style="font-size:12px;color:#737373;">${esc(i.categorySnapshot)} · ${i.qty} × ${esc(formatRupiah(i.priceSnapshot))}</div>
				</div>
				<div style="font-size:14px;font-weight:600;">${esc(formatRupiah(i.subtotal))}</div>
			</div>`
		)
		.join('');

	const methods = paymentMethods
		.map(
			(m) => `
			<div style="${COL};border:1px solid #e5e5e5;border-radius:12px;padding:12px;margin-top:12px;">
				<div style="font-size:14px;font-weight:600;">${esc(m.label)}</div>
				<div style="font-size:20px;font-weight:700;margin-top:2px;">${esc(m.accountNumber)}</div>
				<div style="font-size:12px;color:#737373;">a.n. ${esc(m.accountHolder)}</div>
				${m.note ? `<div style="font-size:12px;color:#737373;margin-top:4px;">${esc(m.note)}</div>` : ''}
			</div>`
		)
		.join('');

	const qris = qrisCodes
		.map(
			(q) => `
			<div style="${COL};border:1px solid #e5e5e5;border-radius:12px;padding:12px;margin-top:12px;">
				<div style="font-size:14px;font-weight:600;">${esc(q.label)}</div>
				<img src="${esc(q.imageUrl)}" width="240" height="240" style="width:240px;height:240px;margin-top:8px;" />
			</div>`
		)
		.join('');

	return `
		<div style="${COL};width:${PDF_WIDTH}px;padding:48px;background:#ffffff;color:#171717;${font}">
			<div style="${COL};border-bottom:1px solid #e5e5e5;padding-bottom:16px;">
				<div style="font-size:14px;color:#737373;">${esc(settings.storeName || 'Invoizy Store')}</div>
				<div style="font-size:28px;font-weight:700;margin-top:4px;">Invoice ${esc(order.orderId)}</div>
				<div style="font-size:13px;color:#737373;margin-top:4px;">${esc(createdLabel)}</div>
				<div style="${ROW};font-size:14px;margin-top:8px;"><span style="font-weight:600;">${esc(order.handle)}</span><span style="color:#737373;"> · ${esc(order.email)}</span></div>
				${order.note ? `<div style="font-size:13px;color:#737373;margin-top:4px;">Catatan: ${esc(order.note)}</div>` : ''}
			</div>
			<div style="${COL};margin-top:16px;">${items}</div>
			<div style="${COL};margin-top:12px;border-top:1px solid #e5e5e5;padding-top:12px;">
				<div style="${ROW};justify-content:space-between;font-size:14px;">
					<span style="color:#737373;">Subtotal</span><span>${esc(formatRupiah(order.subtotal))}</span>
				</div>
				${
					shippingDiff > 0
						? `<div style="${ROW};justify-content:space-between;font-size:14px;margin-top:4px;">
							<span style="color:#737373;">Ongkir</span><span>${esc(formatRupiah(shippingDiff))}</span>
						</div>`
						: ''
				}
				<div style="${ROW};justify-content:space-between;font-size:20px;font-weight:700;margin-top:8px;">
					<span>Total</span><span>${esc(formatRupiah(order.total))}</span>
				</div>
			</div>
			<div style="${COL};margin-top:24px;border-top:1px solid #e5e5e5;padding-top:16px;">
				<div style="font-size:12px;font-weight:600;letter-spacing:1px;color:#737373;">PEMBAYARAN</div>
				${methods}${qris}
				${
					paymentMethods.length === 0 && qrisCodes.length === 0
						? '<div style="font-size:14px;color:#737373;margin-top:8px;">Info pembayaran belum diatur toko. Tunggu konfirmasi admin.</div>'
						: ''
				}
				${settings.paymentNote ? `<div style="font-size:13px;color:#737373;margin-top:12px;">${esc(settings.paymentNote)}</div>` : ''}
			</div>
			<div style="font-size:11px;color:#a3a3a3;margin-top:24px;">Dibuat otomatis oleh ${esc(settings.storeName || 'Invoizy Store')}</div>
		</div>`;
}

function estimateHeight(data: InvoiceData): number {
	const h =
		640 +
		data.order.items.length * 64 +
		data.paymentMethods.length * 170 +
		data.qrisCodes.length * 360;
	// Estimasi murah hati (upper bound): kelebihan tinggi hanya membuat teks
	// sedikit mengecil saat fit ke A4, tapi tidak pernah terpotong.
	return Math.min(2400, Math.max(1000, h));
}

/** Pipeline PDF: HTML inline → Satori (SVG) → resvg (PNG) → pdf-lib (PDF A4 satu halaman). */
export async function renderInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
	const markup = buildInvoicePdfHtml(data);
	const fonts = await loadFonts();
	const height = estimateHeight(data);

	const svg = await satori(parseHtml(markup), { width: PDF_WIDTH, height, fonts });
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: PNG_WIDTH } })
		.render()
		.asPng();

	const pdf = await PDFDocument.create();
	const img = await pdf.embedPng(png);

	// A4 portrait dalam point, gambar di-fit (contain) ke tengah halaman.
	const page = pdf.addPage([595.28, 841.89]);
	const scale = Math.min(page.getWidth() / img.width, page.getHeight() / img.height);
	const w = img.width * scale;
	const h = img.height * scale;
	page.drawImage(img, {
		x: (page.getWidth() - w) / 2,
		y: (page.getHeight() - h) / 2,
		width: w,
		height: h
	});

	return pdf.save();
}
