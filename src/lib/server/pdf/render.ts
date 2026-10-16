import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatRupiah } from '$lib/utils/currency';
import { logger } from '$lib/server/logger';
import type { InvoiceData } from '$lib/components/invoice/index';

// NEO-BRUTALIST sample: border hitam tebal, hard shadow offset, flat color.
// Semua primitif pdf-lib murni (font standar PDF) — aman di serverless/Vercel.
const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
const CONTENT_X = MARGIN;

const INK = rgb(0.05, 0.05, 0.05);
const PAPER = rgb(1, 1, 1);
const ACCENT = rgb(1, 0.8, 0.09); // kuning brutalist
const GRAY = rgb(0.32, 0.32, 0.32);
const FAINT = rgb(0.55, 0.55, 0.55);

interface Ctx {
	pdf: PDFDocument;
	page: PDFPage;
	regular: PDFFont;
	bold: PDFFont;
	y: number;
}

function newPage(ctx: Ctx) {
	ctx.page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
	ctx.y = PAGE_H - MARGIN;
}

function ensure(ctx: Ctx, h: number) {
	if (ctx.y - h < MARGIN) newPage(ctx);
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let cur = '';
	for (const w of words) {
		const next = cur ? `${cur} ${w}` : w;
		if (font.widthOfTextAtSize(next, size) <= maxWidth || !cur) {
			cur = next;
		} else {
			lines.push(cur);
			cur = w;
		}
	}
	if (cur) lines.push(cur);
	return lines.length > 0 ? lines : [''];
}

function para(
	ctx: Ctx,
	text: string,
	opts?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; maxWidth?: number }
) {
	const size = opts?.size ?? 11;
	const font = opts?.bold ? ctx.bold : ctx.regular;
	const color = opts?.color ?? INK;
	const x = opts?.x ?? CONTENT_X;
	const maxWidth = opts?.maxWidth ?? CONTENT_W;
	for (const line of wrap(text, font, size, maxWidth)) {
		const h = size + 5;
		ensure(ctx, h);
		ctx.page.drawText(line, { x, y: ctx.y - size, font, size, color });
		ctx.y -= h;
	}
}

function amountOnFirstLine(ctx: Ctx, amount: string, size = 11, color = INK) {
	const font = ctx.bold;
	const w = font.widthOfTextAtSize(amount, size);
	ctx.page.drawText(amount, { x: PAGE_W - MARGIN - w, y: ctx.y - size, font, size, color });
}

// Kartu brutalist: fill + border tebal + hard shadow offset.
function card(ctx: Ctx, h: number, opts?: { fill?: ReturnType<typeof rgb>; border?: number }) {
	ensure(ctx, h + 12);
	const top = ctx.y;
	const fill = opts?.fill ?? PAPER;
	const bw = opts?.border ?? 2.5;
	ctx.page.drawRectangle({ x: CONTENT_X + 5, y: top - h - 5, width: CONTENT_W, height: h, color: INK });
	ctx.page.drawRectangle({ x: CONTENT_X, y: top - h, width: CONTENT_W, height: h, color: fill });
	ctx.page.drawRectangle({
		x: CONTENT_X,
		y: top - h,
		width: CONTENT_W,
		height: h,
		borderColor: INK,
		borderWidth: bw
	});
	return top; // детям menggambar relatif ke top
}

function thickRule(ctx: Ctx) {
	ensure(ctx, 16);
	ctx.page.drawRectangle({ x: CONTENT_X, y: ctx.y - 8, width: CONTENT_W, height: 3, color: INK });
	ctx.y -= 16;
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
	const { order, settings, paymentMethods, qrisCodes } = data;
	const shippingDiff = order.total - order.subtotal;

	const pdf = await PDFDocument.create();
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const ctx: Ctx = { pdf, page: pdf.addPage([PAGE_W, PAGE_H]), regular, bold, y: PAGE_H - MARGIN };

	// ── Full-bleed header band ──
	const bandH = 148;
	ctx.page.drawRectangle({ x: 0, y: ctx.y - bandH, width: PAGE_W, height: bandH, color: ACCENT });
	ctx.page.drawRectangle({ x: 0, y: ctx.y - bandH, width: PAGE_W, height: 5, color: INK });
	{
		const tx = MARGIN;
		let ty = ctx.y - 20;
		ctx.page.drawText(settings.storeName || 'INVOIZY STORE', {
			x: tx,
			y: ty - 11,
			font: bold,
			size: 11,
			color: INK
		});
		ty -= 34;
		ctx.page.drawText(`INVOICE ${order.orderId}`, { x: tx, y: ty - 26, font: bold, size: 26, color: INK });
		ty -= 30;
		const createdLabel = new Intl.DateTimeFormat('id-ID', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(order.createdAt));
		ctx.page.drawText(createdLabel, { x: tx, y: ty - 11, font: regular, size: 11, color: INK });
		ctx.y -= bandH + 20;
	}

	// ── Buyer card ──
	{
		const lines = [`${order.handle} · ${order.email}`];
		if (order.phone) lines.push(order.phone);
		if (order.address) lines.push(order.address);
		if (order.note) lines.push(`Catatan: ${order.note}`);
		const wrapped = lines.flatMap((t) => wrap(t, regular, 11, CONTENT_W - 24));
		const h = wrapped.length * 16 + 20;
		const top = card(ctx, h);
		let ly = top - 10;
		wrapped.forEach((ln, i) => {
			ctx.page.drawText(ln, {
				x: CONTENT_X + 12,
				y: ly - 11,
				font: i === 0 ? bold : regular,
				size: 11,
				color: INK
			});
			ly -= 16;
		});
		ctx.y = top - h - 12;
	}

	// ── Items: header bar hitam ──
	{
		ensure(ctx, 30);
		const top = ctx.y;
		ctx.page.drawRectangle({ x: CONTENT_X, y: top - 24, width: CONTENT_W, height: 24, color: INK });
		ctx.page.drawText('ITEM', { x: CONTENT_X + 10, y: top - 17, font: bold, size: 11, color: PAPER });
		const hw = bold.widthOfTextAtSize('TOTAL', 11);
		ctx.page.drawText('TOTAL', { x: PAGE_W - MARGIN - 10 - hw, y: top - 17, font: bold, size: 11, color: PAPER });
		ctx.y = top - 24 - 6;
	}
	for (const item of order.items) {
		ensure(ctx, 52);
		const amount = formatRupiah(item.subtotal);
		amountOnFirstLine(ctx, amount);
		para(ctx, item.nameSnapshot, { size: 11, bold: true, maxWidth: CONTENT_W - 130 });
		para(ctx, `${item.categorySnapshot} · ${item.qty} × ${formatRupiah(item.priceSnapshot)}`, {
			size: 10,
			color: GRAY
		});
		ctx.page.drawRectangle({ x: CONTENT_X, y: ctx.y - 3, width: CONTENT_W, height: 1.5, color: INK });
		ctx.y -= 9;
	}

	// ── Totals ──
	{
		ensure(ctx, 24);
		amountOnFirstLine(ctx, formatRupiah(order.subtotal));
		para(ctx, 'Subtotal', { color: GRAY });
		if (shippingDiff > 0) {
			ensure(ctx, 24);
			amountOnFirstLine(ctx, formatRupiah(shippingDiff));
			para(ctx, `Ongkir${order.shippingLabel ? ` · ${order.shippingLabel}` : ''}`, {
				color: GRAY,
				maxWidth: CONTENT_W - 150
			});
		}
		// Total band inverted
		ensure(ctx, 40);
		const top = ctx.y;
		ctx.page.drawRectangle({ x: CONTENT_X, y: top - 32, width: CONTENT_W, height: 32, color: INK });
		ctx.page.drawText('TOTAL', { x: CONTENT_X + 10, y: top - 22, font: bold, size: 13, color: PAPER });
		const t = formatRupiah(order.total);
		const tw = bold.widthOfTextAtSize(t, 13);
		ctx.page.drawText(t, { x: PAGE_W - MARGIN - 10 - tw, y: top - 22, font: bold, size: 13, color: PAPER });
		ctx.y = top - 32 - 12;
	}
	thickRule(ctx);

	// ── Pembayaran ──
	para(ctx, 'PEMBAYARAN', { size: 12, bold: true });
	ctx.y -= 2;

	if (paymentMethods.length === 0 && qrisCodes.length === 0) {
		para(ctx, 'Info pembayaran belum diatur toko. Tunggu konfirmasi admin.', { color: GRAY });
	}

	for (const m of paymentMethods) {
		const inner: string[] = [m.label, m.accountNumber, `a.n. ${m.accountHolder}`];
		if (m.note) inner.push(m.note);
		const wrapped = inner.flatMap((t, i) =>
			wrap(t, i < 2 ? bold : regular, i === 1 ? 15 : 11, CONTENT_W - 24)
		);
		const h = wrapped.length * 17 + 18;
		const top = card(ctx, h, { fill: PAPER });
		let ly = top - 9;
		inner.forEach((t, i) => {
			const size = i === 1 ? 15 : 11;
			const font = i < 2 ? bold : regular;
			for (const ln of wrap(t, font, size, CONTENT_W - 24)) {
				ctx.page.drawText(ln, { x: CONTENT_X + 12, y: ly - size, font, size, color: INK });
				ly -= size + 6;
			}
		});
		ctx.y = top - h - 12;
	}

	for (const q of qrisCodes) {
		para(ctx, q.label, { bold: true });
		try {
			const res = await fetch(q.imageUrl, { signal: AbortSignal.timeout(8000) });
			const type = res.headers.get('content-type') ?? '';
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const bytes = new Uint8Array(await res.arrayBuffer());
			const img =
				type.includes('jpeg') || type.includes('jpg')
					? await pdf.embedJpg(bytes)
					: await pdf.embedPng(bytes);
			const max = 170;
			const scale = Math.min(max / img.width, max / img.height);
			const w = img.width * scale;
			const h = img.height * scale;
			const bh = h + 16; // box = gambar + padding 8px
			ensure(ctx, bh + 10);
			const top = ctx.y;
			ctx.page.drawRectangle({
				x: CONTENT_X + 5,
				y: top - bh - 5,
				width: w + 16,
				height: bh,
				color: INK
			});
			ctx.page.drawRectangle({
				x: CONTENT_X,
				y: top - bh,
				width: w + 16,
				height: bh,
				color: PAPER,
				borderColor: INK,
				borderWidth: 2.5
			});
			ctx.page.drawImage(img, { x: CONTENT_X + 8, y: top - bh + 8, width: w, height: h });
			ctx.y = top - bh - 10;
		} catch (err) {
			logger.warn('invoice.qris-skipped', { label: q.label, error: err });
			para(ctx, '(QRIS tidak dapat dimuat)', { size: 10, color: FAINT });
		}
	}

	if (settings.proofContact) {
		const rawLines = [`Sudah transfer? Kirim bukti ke ${settings.proofContact}`];
		if (settings.instagram) rawLines.push(`atau DM ${settings.instagram}`);
		const lines = rawLines.flatMap((t) => wrap(t, bold, 11, CONTENT_W - 24));
		const h = lines.length * 16 + 18;
		ensure(ctx, h + 12);
		const top = ctx.y;
		ctx.page.drawRectangle({ x: CONTENT_X + 5, y: top - h - 5, width: CONTENT_W, height: h, color: INK });
		ctx.page.drawRectangle({ x: CONTENT_X, y: top - h, width: CONTENT_W, height: h, color: INK });
		let ly = top - 9;
		for (const ln of lines) {
			ctx.page.drawText(ln, { x: CONTENT_X + 12, y: ly - 11, font: bold, size: 11, color: ACCENT });
			ly -= 16;
		}
		ctx.y = top - h - 12;
	}

	if (settings.paymentNote) para(ctx, settings.paymentNote, { color: GRAY });
	para(ctx, `Dibuat otomatis oleh ${settings.storeName || 'Invoizy Store'}`, { size: 9, color: FAINT });

	return pdf.save();
}
