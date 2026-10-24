import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatRupiah } from '$lib/utils/currency';
import { logger } from '$lib/server/logger';
import type { InvoiceData } from '$lib/components/invoice/index';

// Dimensi A4 pt standar
const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const LM = 46; // margin simetris kiri-kanan
const RM = 46;
const CONTENT_W = PAGE_W - LM - RM;

// Palet warna resmi profesional & bersih (putih formal untuk lampiran email serverless)
const WHITE = rgb(1.0, 1.0, 1.0);
const BLACK = rgb(0.08, 0.08, 0.08); // teks & border utama
const GRAY_DARK = rgb(0.35, 0.35, 0.35); // teks sekunder
const GRAY_LIGHT = rgb(0.94, 0.94, 0.94); // latar header tabel
const BORDER_LIGHT = rgb(0.85, 0.85, 0.85); // garis pemisah tabel
const GREEN_PAID = rgb(0.12, 0.52, 0.22); // stempel lunas
const RED_VOID = rgb(0.72, 0.12, 0.12); // stempel batal

interface Ctx {
	pdf: PDFDocument;
	page: PDFPage;
	regular: PDFFont;
	bold: PDFFont;
	y: number;
}

function newPage(ctx: Ctx) {
	ctx.page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
	ctx.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: WHITE });
	ctx.y = PAGE_H - 46;
}

function ensure(ctx: Ctx, h: number) {
	if (ctx.y - h < 46) newPage(ctx);
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
	const size = opts?.size ?? 10;
	const font = opts?.bold ? ctx.bold : ctx.regular;
	const color = opts?.color ?? BLACK;
	const x = opts?.x ?? LM;
	const maxWidth = opts?.maxWidth ?? CONTENT_W;
	for (const line of wrap(text, font, size, maxWidth)) {
		const h = size + 4;
		ensure(ctx, h);
		ctx.page.drawText(line, { x, y: ctx.y - size, font, size, color });
		ctx.y -= h;
	}
}

function rule(ctx: Ctx, thickness = 1, color = BLACK) {
	ensure(ctx, 10);
	ctx.page.drawRectangle({ x: LM, y: ctx.y - 4, width: CONTENT_W, height: thickness, color });
	ctx.y -= 10;
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
	const { order, settings, paymentMethods, qrisCodes } = data;
	const shippingDiff = order.total - order.subtotal;

	const pdf = await PDFDocument.create();
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const ctx: Ctx = { pdf, page: pdf.addPage([PAGE_W, PAGE_H]), regular, bold, y: PAGE_H - 46 };

	// Latar halaman putih bersih
	ctx.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: WHITE });

	const createdLabel = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(order.createdAt));

	// ── 1. Kop Surat Profesional ──
	{
		ensure(ctx, 60);
		const top = ctx.y;

		// Sisi Kiri: Nama Toko
		const store = settings.storeName || 'CHO.LAZEY - CHIBICONXI CATALOGUE';
		ctx.page.drawText(store, {
			x: LM,
			y: top - 18,
			font: bold,
			size: 18,
			color: BLACK
		});
		ctx.page.drawText('BUKTI TRANSAKSI & INVOICE RESMI', {
			x: LM,
			y: top - 32,
			font: regular,
			size: 8,
			color: GRAY_DARK
		});

		// Sisi Kanan: Nomor Invoice & Tanggal
		const invTitle = `INVOICE #${order.orderId}`;
		const invW = bold.widthOfTextAtSize(invTitle, 14);
		ctx.page.drawText(invTitle, {
			x: PAGE_W - RM - invW,
			y: top - 16,
			font: bold,
			size: 14,
			color: BLACK
		});

		const dateText = `Tanggal: ${createdLabel}`;
		const dateW = regular.widthOfTextAtSize(dateText, 9);
		ctx.page.drawText(dateText, {
			x: PAGE_W - RM - dateW,
			y: top - 30,
			font: regular,
			size: 9,
			color: GRAY_DARK
		});

		// Stempel Status Pembayaran Formal
		const status = order.paymentStatus;
		const stampText =
			status === 'CONFIRMED'
				? 'STATUS: LUNAS / PAID'
				: status === 'CANCELLED'
					? 'STATUS: DIBATALKAN / VOID'
					: 'STATUS: MENUNGGU PEMBAYARAN';
		const stampColor =
			status === 'CONFIRMED' ? GREEN_PAID : status === 'CANCELLED' ? RED_VOID : GRAY_DARK;
		const stampW = bold.widthOfTextAtSize(stampText, 8) + 12;

		ctx.page.drawRectangle({
			x: PAGE_W - RM - stampW,
			y: top - 48,
			width: stampW,
			height: 14,
			color: WHITE,
			borderColor: stampColor,
			borderWidth: 1
		});
		ctx.page.drawText(stampText, {
			x: PAGE_W - RM - stampW + 6,
			y: top - 44,
			font: bold,
			size: 8,
			color: stampColor
		});

		ctx.y = top - 56;
		rule(ctx, 1.5, BLACK);
	}

	// ── 2. Data Pembeli & Tujuan Pengiriman ──
	{
		ensure(ctx, 50);
		para(ctx, 'INFORMASI PEMESAN & PENGIRIMAN', { size: 9, bold: true, color: GRAY_DARK });
		para(ctx, order.handle, { size: 12, bold: true, color: BLACK });
		if (order.email) para(ctx, `Email: ${order.email}`, { size: 9, color: GRAY_DARK });
		if (order.phone) para(ctx, `WhatsApp: ${order.phone}`, { size: 9, color: GRAY_DARK });
		if (order.shippingLabel) para(ctx, `Metode: ${order.shippingLabel}`, { size: 9, bold: true, color: BLACK });
		if (order.address && order.address.trim() !== '') para(ctx, `Alamat: ${order.address}`, { size: 9, color: BLACK, maxWidth: CONTENT_W - 60 });
		if (order.note) para(ctx, `Catatan: ${order.note}`, { size: 9, color: GRAY_DARK });
		ctx.y -= 10;
	}

	// ── 3. Tabel Rincian Barang ──
	const colQty = LM + 290;
	const colPrice = LM + 375;
	{
		ensure(ctx, 24);
		const top = ctx.y;
		// Background header abu-abu tipis
		ctx.page.drawRectangle({ x: LM, y: top - 20, width: CONTENT_W, height: 20, color: GRAY_LIGHT });
		ctx.page.drawRectangle({ x: LM, y: top - 20, width: CONTENT_W, height: 1, color: BLACK });

		ctx.page.drawText('ITEM & SPESIFIKASI', { x: LM + 8, y: top - 14, font: bold, size: 8, color: BLACK });
		const qh = 'QTY';
		ctx.page.drawText(qh, { x: colQty - bold.widthOfTextAtSize(qh, 8) / 2, y: top - 14, font: bold, size: 8, color: BLACK });
		const ph = 'HARGA SATUAN';
		ctx.page.drawText(ph, { x: colPrice - bold.widthOfTextAtSize(ph, 8) / 2, y: top - 14, font: bold, size: 8, color: BLACK });
		const th = 'TOTAL';
		ctx.page.drawText(th, { x: PAGE_W - RM - bold.widthOfTextAtSize(th, 8) - 8, y: top - 14, font: bold, size: 8, color: BLACK });

		ctx.y = top - 20 - 4;
	}

	for (const item of order.items) {
		ensure(ctx, 32);
		const itemName = item.variantNameSnapshot ? `${item.nameSnapshot} (${item.variantNameSnapshot})` : item.nameSnapshot;
		para(ctx, itemName, { size: 9, bold: true, maxWidth: 240, x: LM + 8 });
		para(ctx, item.categorySnapshot, { size: 8, color: GRAY_DARK, maxWidth: 240, x: LM + 8 });

		const qty = String(item.qty);
		ctx.page.drawText(qty, {
			x: colQty - regular.widthOfTextAtSize(qty, 9) / 2,
			y: ctx.y + 14,
			font: regular,
			size: 9,
			color: BLACK
		});

		const price = formatRupiah(item.priceSnapshot);
		ctx.page.drawText(price, {
			x: colPrice - regular.widthOfTextAtSize(price, 9) / 2,
			y: ctx.y + 14,
			font: regular,
			size: 9,
			color: BLACK
		});

		const subtotal = formatRupiah(item.subtotal);
		const sw = bold.widthOfTextAtSize(subtotal, 9);
		ctx.page.drawText(subtotal, {
			x: PAGE_W - RM - sw - 8,
			y: ctx.y + 14,
			font: bold,
			size: 9,
			color: BLACK
		});

		ctx.y -= 4;
		// Garis pemisah antar item tipis
		ctx.page.drawRectangle({ x: LM, y: ctx.y, width: CONTENT_W, height: 0.5, color: BORDER_LIGHT });
		ctx.y -= 4;
	}

	// ── 4. Subtotal, Ongkir & Total Pembayaran ──
	{
		ensure(ctx, 50);
		ctx.y -= 4;
		const rows: [string, string][] = [[`Subtotal Produk`, formatRupiah(order.subtotal)]];
		if ((order.discountTotal ?? 0) > 0) {
			rows.push([`Potongan Diskon Promo`, `-${formatRupiah(order.discountTotal ?? 0)}`]);
		}
		if (order.shippingLabel) {
			rows.push([`Metode: ${order.shippingLabel}`, shippingDiff > 0 ? formatRupiah(shippingDiff) : 'Rp 0']);
		} else if (shippingDiff > 0) {
			rows.push([`Biaya Pengiriman`, formatRupiah(shippingDiff)]);
		}

		for (const [label, val] of rows) {
			ensure(ctx, 14);
			const sw = regular.widthOfTextAtSize(val, 9);
			ctx.page.drawText(val, { x: PAGE_W - RM - sw - 8, y: ctx.y - 9, font: regular, size: 9, color: BLACK });
			const lw = regular.widthOfTextAtSize(label, 9);
			ctx.page.drawText(label, { x: PAGE_W - RM - sw - lw - 32, y: ctx.y - 9, font: regular, size: 9, color: GRAY_DARK });
			ctx.y -= 14;
		}

		// Kotak Total Hitam Elegan
		ensure(ctx, 28);
		const tVal = formatRupiah(order.total);
		const tValW = bold.widthOfTextAtSize(tVal, 11);
		const tLabel = 'TOTAL PEMBAYARAN:';
		const tLabelW = bold.widthOfTextAtSize(tLabel, 10);
		const totalBoxW = tValW + tLabelW + 36;
		const totalBoxX = PAGE_W - RM - totalBoxW;
		const top = ctx.y;

		ctx.page.drawRectangle({
			x: totalBoxX,
			y: top - 24,
			width: totalBoxW,
			height: 24,
			color: BLACK
		});
		ctx.page.drawText(tLabel, {
			x: totalBoxX + 12,
			y: top - 16,
			font: bold,
			size: 10,
			color: WHITE
		});
		ctx.page.drawText(tVal, {
			x: totalBoxX + 12 + tLabelW + 12,
			y: top - 16,
			font: bold,
			size: 11,
			color: WHITE
		});

		ctx.y = top - 34;
	}

	// ── 5. Instruksi Pembayaran & Rekening ──
	if (paymentMethods.length > 0 || qrisCodes.length > 0 || settings.proofContact || settings.paymentNote) {
		ensure(ctx, 30);
		para(ctx, 'INFORMASI PEMBAYARAN', { size: 9, bold: true, color: GRAY_DARK });
		rule(ctx, 0.5, BORDER_LIGHT);

		for (const m of paymentMethods) {
			ensure(ctx, 16);
			para(ctx, `${m.label}: ${m.accountNumber} — a.n. ${m.accountHolder}${m.note ? ` (${m.note})` : ''}`, {
				size: 9,
				bold: true,
				color: BLACK
			});
		}

		for (const q of qrisCodes) {
			ensure(ctx, 16);
			para(ctx, `QRIS: ${q.label}`, { size: 9, bold: true, color: BLACK });
			try {
				const res = await fetch(q.imageUrl, { signal: AbortSignal.timeout(6000) });
				const type = res.headers.get('content-type') ?? '';
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const bytes = new Uint8Array(await res.arrayBuffer());
				const img =
					type.includes('jpeg') || type.includes('jpg')
						? await pdf.embedJpg(bytes)
						: await pdf.embedPng(bytes);
				const max = 130;
				const scale = Math.min(max / img.width, max / img.height);
				const w = img.width * scale;
				const h = img.height * scale;
				ensure(ctx, h + 8);
				ctx.page.drawImage(img, { x: LM + 8, y: ctx.y - h, width: w, height: h });
				ctx.y -= h + 8;
			} catch (err) {
				logger.warn('invoice.qris-skipped', { label: q.label, error: err });
			}
		}

		if (settings.paymentNote) {
			ensure(ctx, 14);
			para(ctx, settings.paymentNote, { size: 8, color: GRAY_DARK });
		}
	}

	// ── 6. Footer Penutup ──
	{
		ensure(ctx, 35);
		ctx.y -= 12;
		rule(ctx, 0.5, BORDER_LIGHT);
		const closing = `Terima kasih atas pesanan Anda di ${settings.storeName || 'toko kami'}!`;
		const cw = regular.widthOfTextAtSize(closing, 9);
		ctx.page.drawText(closing, {
			x: LM + (CONTENT_W - cw) / 2,
			y: ctx.y - 10,
			font: regular,
			size: 9,
			color: GRAY_DARK
		});

		let yOffset = 20;
		if (settings.proofContact || settings.instagram) {
			const support = `Bantuan Pesanan: ${settings.proofContact || ''}${settings.proofContact && settings.instagram ? ' | ' : ''}${settings.instagram ? `Instagram: @${settings.instagram.replace(/^@/, '')}` : ''}`;
			const sw = regular.widthOfTextAtSize(support, 8);
			ctx.page.drawText(support, {
				x: LM + (CONTENT_W - sw) / 2,
				y: ctx.y - yOffset,
				font: regular,
				size: 8,
				color: GRAY_DARK
			});
			yOffset += 10;
		}

		const autoNote = 'Dokumen ini dibuat otomatis oleh cho.lazey - CHIBICONXI CATALOGUE';
		const aw = regular.widthOfTextAtSize(autoNote, 7);
		ctx.page.drawText(autoNote, {
			x: LM + (CONTENT_W - aw) / 2,
			y: ctx.y - yOffset,
			font: regular,
			size: 7,
			color: BORDER_LIGHT
		});
	}

	return pdf.save();
}
