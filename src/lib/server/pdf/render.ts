import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatRupiah } from '$lib/utils/currency';
import { logger } from '$lib/server/logger';
import type { InvoiceData } from '$lib/components/invoice/index';

// Replika desain client: kertas krem, strip geometri kiri, aksen peach,
// teks outline, tabel header peach, penekanan total. pdf-lib murni — aman serverless.
const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const LM = 78; // margin kiri dilebarkan untuk strip dekorasi
const RM = 46;
const CONTENT_W = PAGE_W - LM - RM;
const STRIP_W = 44;

const INK = rgb(0.12, 0.1, 0.09);
const PAPER = rgb(0.98, 0.965, 0.937); // krem kertas
const PEACH = rgb(0.961, 0.725, 0.541);
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(0.42, 0.4, 0.38);
const TEAL = rgb(0.498, 0.784, 0.737);
const ORANGE = rgb(0.961, 0.616, 0.424);
const LAVENDER = rgb(0.725, 0.655, 0.902);

interface Ctx {
	pdf: PDFDocument;
	page: PDFPage;
	regular: PDFFont;
	bold: PDFFont;
	serif: PDFFont;
	serifBold: PDFFont;
	y: number;
}

// Strip geometri kiri: pita miring bergantian + garis hitam tebal.
function drawSidebar(ctx: Ctx) {
	const bands = [TEAL, ORANGE, LAVENDER, TEAL, ORANGE, LAVENDER, TEAL];
	const slant = 22;
	let y = PAGE_H;
	let i = 0;
	ctx.page.drawRectangle({ x: 0, y: 0, width: STRIP_W, height: PAGE_H, color: bands[0] });
	while (y > -20) {
		const h = 110;
		const color = bands[i % bands.length];
		const yTop = y;
		const yBot = Math.max(0, y - h);
		ctx.page.drawRectangle({ x: 0, y: yBot, width: STRIP_W, height: yTop - yBot, color });
		// garis diagonal hitam di batas bawah pita
		ctx.page.drawLine({
			start: { x: 0, y: yBot },
			end: { x: STRIP_W, y: yBot - slant },
			thickness: 3,
			color: INK
		});
		y = yBot - 26;
		i++;
	}
	// garis tepi kanan strip
	ctx.page.drawRectangle({ x: STRIP_W - 2, y: 0, width: 2, height: PAGE_H, color: INK });
}

function newPage(ctx: Ctx, withSidebar = true) {
	ctx.page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
	ctx.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PAPER });
	if (withSidebar) drawSidebar(ctx);
	ctx.y = PAGE_H - 56;
}

function ensure(ctx: Ctx, h: number) {
	if (ctx.y - h < 50) newPage(ctx);
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

// Teks outline ala stiker: jiplakan hitam di 4 arah + isi warna di tengah.
function outlineText(
	ctx: Ctx,
	text: string,
	x: number,
	y: number,
	size: number,
	font: PDFFont,
	fill: ReturnType<typeof rgb>
) {
	const o = Math.max(1, size / 16);
	for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o]] as const) {
		ctx.page.drawText(text, { x: x + dx, y: y + dy, font, size, color: INK });
	}
	ctx.page.drawText(text, { x, y, font, size, color: fill });
}

function para(
	ctx: Ctx,
	text: string,
	opts?: { size?: number; bold?: boolean; serif?: boolean; color?: ReturnType<typeof rgb>; x?: number; maxWidth?: number }
) {
	const size = opts?.size ?? 11;
	const font = opts?.serif ? (opts?.bold ? ctx.serifBold : ctx.serif) : opts?.bold ? ctx.bold : ctx.regular;
	const color = opts?.color ?? INK;
	const x = opts?.x ?? LM;
	const maxWidth = opts?.maxWidth ?? CONTENT_W;
	for (const line of wrap(text, font, size, maxWidth)) {
		const h = size + 5;
		ensure(ctx, h);
		ctx.page.drawText(line, { x, y: ctx.y - size, font, size, color });
		ctx.y -= h;
	}
}

function rightText(ctx: Ctx, text: string, size: number, font: PDFFont, color = INK) {
	const w = font.widthOfTextAtSize(text, size);
	ctx.page.drawText(text, { x: PAGE_W - RM - w, y: ctx.y - size, font, size, color });
}

function blackRule(ctx: Ctx, thickness = 2) {
	ensure(ctx, 14);
	ctx.page.drawRectangle({ x: LM, y: ctx.y - 6, width: CONTENT_W, height: thickness, color: INK });
	ctx.y -= 14;
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
	const { order, settings, paymentMethods, qrisCodes } = data;
	const shippingDiff = order.total - order.subtotal;

	const pdf = await PDFDocument.create();
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const serif = await pdf.embedFont(StandardFonts.TimesRoman);
	const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
	const ctx: Ctx = { pdf, page: pdf.addPage([PAGE_W, PAGE_H]), regular, bold, serif, serifBold, y: 0 };
	ctx.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PAPER });
	drawSidebar(ctx);
	ctx.y = PAGE_H - 56;

	// ── Kop: Invoice + nomor + nama toko kanan ──
	{
		ensure(ctx, 70);
		outlineText(ctx, 'Invoice', LM, ctx.y - 34, 34, serifBold, PEACH);
		const store = settings.storeName || 'INVOIZY STORE';
		const sw = bold.widthOfTextAtSize(store.toUpperCase(), 11);
		ctx.page.drawText(store.toUpperCase(), {
			x: PAGE_W - RM - sw,
			y: ctx.y - 20,
			font: bold,
			size: 11,
			color: INK
		});
		ctx.y -= 44;
		para(ctx, `Invoice No. ${order.orderId}`, { size: 9, color: GRAY });
		ctx.y -= 2;
		blackRule(ctx, 2);
	}

	// ── Invoice To + Total kanan ──
	{
		ensure(ctx, 64);
		para(ctx, 'Invoice To:', { size: 10, color: GRAY });
		para(ctx, order.handle, { size: 17, serif: true, bold: true });
		const t = formatRupiah(order.total);
		const tw = serifBold.widthOfTextAtSize(t, 17);
		ctx.page.drawText(t, { x: PAGE_W - RM - tw, y: ctx.y + 30, font: serifBold, size: 17, color: INK });
		para(ctx, 'TOTAL:', { size: 10, color: GRAY });
		if (order.phone) para(ctx, order.phone, { size: 11, color: GRAY });
		if (order.address) para(ctx, order.address, { size: 11, color: GRAY, maxWidth: CONTENT_W - 170 });
		if (order.note) para(ctx, `Catatan: ${order.note}`, { size: 11, color: GRAY });
		ctx.y -= 6;
	}

	// ── Tabel item: header peach, teks outline putih ──
	const colQty = LM + 300;
	const colPrice = LM + 395;
	{
		ensure(ctx, 30);
		const top = ctx.y;
		ctx.page.drawRectangle({ x: LM, y: top - 24, width: CONTENT_W, height: 24, color: PEACH });
		outlineText(ctx, 'ITEM', LM + 14, top - 18, 10, bold, WHITE);
		const qh = 'QTY';
		ctx.page.drawText(qh, { x: colQty - bold.widthOfTextAtSize(qh, 10) / 2, y: top - 18, font: bold, size: 10, color: WHITE });
		const ph = 'PRICE';
		ctx.page.drawText(ph, { x: colPrice - bold.widthOfTextAtSize(ph, 10) / 2, y: top - 18, font: bold, size: 10, color: WHITE });
		outlineText(ctx, 'TOTAL', PAGE_W - RM - bold.widthOfTextAtSize('TOTAL', 10), top - 18, 10, bold, WHITE);
		ctx.y = top - 24 - 4;
	}
	for (const item of order.items) {
		ensure(ctx, 40);
		para(ctx, item.nameSnapshot, { size: 11, maxWidth: 250 });
		const qty = String(item.qty);
		ctx.page.drawText(qty, {
			x: colQty - regular.widthOfTextAtSize(qty, 11) / 2,
			y: ctx.y + 16,
			font: regular,
			size: 11,
			color: INK
		});
		const price = formatRupiah(item.priceSnapshot);
		ctx.page.drawText(price, {
			x: colPrice - regular.widthOfTextAtSize(price, 11) / 2,
			y: ctx.y + 16,
			font: regular,
			size: 11,
			color: INK
		});
		rightText(ctx, formatRupiah(item.subtotal), 11, regular);
		ctx.y -= 16;
	}
	blackRule(ctx, 2.5);

	// ── Ringkasan kanan + bar peach total ──
	{
		const rows: [string, string][] = [[`Sub-total :`, formatRupiah(order.subtotal)]];
		if (shippingDiff > 0) {
			rows.push([`Ongkir${order.shippingLabel ? ` · ${order.shippingLabel}` : ''} :`, formatRupiah(shippingDiff)]);
		}
		for (const [label, val] of rows) {
			ensure(ctx, 20);
			const wrapped = wrap(label, regular, 11, 250);
			rightText(ctx, val, 11, regular);
			para(ctx, wrapped[wrapped.length - 1], { size: 11, color: INK, x: LM, maxWidth: 250 });
			for (let i = wrapped.length - 2; i >= 0; i--) para(ctx, wrapped[i], { size: 11, color: INK, x: LM, maxWidth: 250 });
			ctx.y -= 2;
		}
		ensure(ctx, 40);
		const t = `Total :   ${formatRupiah(order.total)}`;
		const tw = bold.widthOfTextAtSize(t, 12);
		const bw = tw + 36;
		const bx = PAGE_W - RM - bw;
		const top = ctx.y;
		ctx.page.drawRectangle({ x: bx, y: top - 28, width: bw, height: 28, color: PEACH });
		outlineText(ctx, t, bx + 18, top - 21, 12, bold, WHITE);
		ctx.y = top - 28 - 14;
	}

	// ── Payment ──
	{
		ensure(ctx, 26);
		para(ctx, 'Payment Method :', { size: 12, bold: true });
		for (const m of paymentMethods) {
			para(ctx, `${m.label} — ${m.accountNumber} (a.n. ${m.accountHolder})`, { size: 11 });
			if (m.note) para(ctx, m.note, { size: 10, color: GRAY });
			ctx.y -= 2;
		}
		for (const q of qrisCodes) {
			para(ctx, q.label, { size: 11, bold: true });
			try {
				const res = await fetch(q.imageUrl, { signal: AbortSignal.timeout(8000) });
				const type = res.headers.get('content-type') ?? '';
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const bytes = new Uint8Array(await res.arrayBuffer());
				const img =
					type.includes('jpeg') || type.includes('jpg')
						? await pdf.embedJpg(bytes)
						: await pdf.embedPng(bytes);
				const max = 190;
				const scale = Math.min(max / img.width, max / img.height);
				const w = img.width * scale;
				const h = img.height * scale;
				ensure(ctx, h + 10);
				const cx = LM + (CONTENT_W - w) / 2;
				ctx.page.drawImage(img, { x: cx, y: ctx.y - h, width: w, height: h });
				ctx.y -= h + 10;
			} catch (err) {
				logger.warn('invoice.qris-skipped', { label: q.label, error: err });
				para(ctx, '(QRIS tidak dapat dimuat)', { size: 10, color: GRAY });
			}
		}
	}

	if (settings.proofContact) {
		ensure(ctx, 40);
		para(ctx, `Sudah transfer? Kirim bukti ke ${settings.proofContact}`, { size: 11, bold: true });
		if (settings.instagram) para(ctx, `atau DM ${settings.instagram}`, { size: 10, color: GRAY });
		ctx.y -= 4;
	}
	if (settings.paymentNote) para(ctx, settings.paymentNote, { size: 10, color: GRAY });

	// ── Penutup ala desain ──
	{
		ensure(ctx, 30);
		const t = 'Thank you for purchase!';
		const tw = serifBold.widthOfTextAtSize(t, 13);
		ctx.page.drawText(t, { x: LM + (CONTENT_W - tw) / 2, y: ctx.y - 13, font: serifBold, size: 13, color: INK });
		ctx.y -= 24;
		para(ctx, `Dibuat otomatis oleh ${settings.storeName || 'Invoizy Store'}`, { size: 9, color: GRAY });
	}

	return pdf.save();
}
