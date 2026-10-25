import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatRupiah } from '$lib/utils/currency';
import type { InvoiceData } from '$lib/components/invoice';

// Dimensi A4 pt standar
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const LM = 44;
const RM = 44;
const CONTENT_W = PAGE_W - LM - RM;

// Palet warna Neo-Brutalist & Profesional Invoizy (Ramah cetak serverless)
const WHITE = rgb(1.0, 1.0, 1.0);
const BLACK = rgb(0.07, 0.09, 0.15); // Ink pekat modern
const BRANDY = rgb(0.47, 0.16, 0.06); // #78290f (Warna identitas toko)
const TANGERINE = rgb(1.0, 0.49, 0.0); // #ff7d00
const FOREST_GREEN = rgb(0.17, 0.58, 0.28); // #2b9348
const CRIMSON_RED = rgb(0.76, 0.07, 0.12); // #c1121f
const GRAY_DARK = rgb(0.35, 0.38, 0.43);
const GRAY_MUTED = rgb(0.55, 0.58, 0.62);
const GRAY_LIGHT = rgb(0.96, 0.97, 0.98);
const BORDER_COLOR = rgb(0.82, 0.84, 0.86);

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
	ctx.y = PAGE_H - 44;
}

function ensure(ctx: Ctx, h: number) {
	if (ctx.y - h < 44) newPage(ctx);
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

export function simplifyShippingMethod(label: string | null | undefined): string {
	if (!label) return 'Mail Order';
	const l = label.toLowerCase();
	if (l.includes('day 1') || l.includes('hari 1') || l.includes('pertama')) return 'Pickup Day 1';
	if (l.includes('day 2') || l.includes('hari 2') || l.includes('kedua')) return 'Pickup Day 2';
	if (l.includes('pickup') || l.includes('ambil')) return 'Pickup Event';
	return 'Mail Order';
}

export async function renderTestInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
	const { order, settings, paymentMethods, qrisCodes } = data;
	const shippingDiff = order.total - order.subtotal + (order.discountTotal ?? 0);

	const pdf = await PDFDocument.create();
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const ctx: Ctx = { pdf, page: pdf.addPage([PAGE_W, PAGE_H]), regular, bold, y: PAGE_H - 44 };

	// Latar halaman putih bersih
	ctx.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: WHITE });

	const createdLabel = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(order.createdAt));

	// ── 1. HEADER KOP SURAT BERSIH & FORMAL ──
	{
		ensure(ctx, 64);
		const top = ctx.y;

		// Kiri: Brand & Sub-label
		const store = settings.storeName || 'CHO.LAZEY - CHIBICONXI CATALOGUE';
		ctx.page.drawText(store.toUpperCase(), {
			x: LM,
			y: top - 18,
			font: bold,
			size: 16,
			color: BRANDY
		});
		ctx.page.drawText('BUKTI TRANSAKSI & INVOICE RESMI', {
			x: LM,
			y: top - 32,
			font: bold,
			size: 8,
			color: GRAY_MUTED
		});

		// Kanan: Nomor Invoice & Tanggal
		const invTitle = `INVOICE #${order.orderId}`;
		const invW = bold.widthOfTextAtSize(invTitle, 13);
		ctx.page.drawText(invTitle, {
			x: PAGE_W - RM - invW,
			y: top - 16,
			font: bold,
			size: 13,
			color: BLACK
		});

		const dateText = `Tanggal: ${createdLabel}`;
		const dateW = regular.widthOfTextAtSize(dateText, 8.5);
		ctx.page.drawText(dateText, {
			x: PAGE_W - RM - dateW,
			y: top - 30,
			font: regular,
			size: 8.5,
			color: GRAY_DARK
		});

		// Badge Status Pembayaran Berbingkai Rapi
		const status = order.paymentStatus;
		const stampText =
			status === 'CONFIRMED'
				? 'STATUS: LUNAS / PAID'
				: status === 'CANCELLED'
					? 'STATUS: DIBATALKAN / VOID'
					: 'STATUS: MENUNGGU PEMBAYARAN';
		const stampColor =
			status === 'CONFIRMED'
				? FOREST_GREEN
				: status === 'CANCELLED'
					? CRIMSON_RED
					: TANGERINE;
		const stampW = bold.widthOfTextAtSize(stampText, 7.5) + 14;

		ctx.page.drawRectangle({
			x: PAGE_W - RM - stampW,
			y: top - 48,
			width: stampW,
			height: 15,
			color: WHITE,
			borderColor: stampColor,
			borderWidth: 1.2
		});
		ctx.page.drawText(stampText, {
			x: PAGE_W - RM - stampW + 7,
			y: top - 44,
			font: bold,
			size: 7.5,
			color: stampColor
		});

		// Garis Aksen Brandy Pemisah Kop
		ctx.y = top - 56;
		ctx.page.drawRectangle({ x: LM, y: ctx.y - 2, width: CONTENT_W, height: 1.5, color: BRANDY });
		ctx.y -= 14;
	}

	// ── 2. DUA KOLOM: INFORMASI PEMESAN & PENGIRIMAN ──
	{
		ensure(ctx, 75);
		const top = ctx.y;
		const colW = (CONTENT_W - 24) / 2;
		const col2X = LM + colW + 24;

		// Background Panel Informasi
		ctx.page.drawRectangle({
			x: LM,
			y: top - 70,
			width: CONTENT_W,
			height: 70,
			color: GRAY_LIGHT,
			borderColor: BORDER_COLOR,
			borderWidth: 0.5
		});

		// Kolom Kiri: Pemesan
		ctx.page.drawText('PEMESAN (BILL TO)', { x: LM + 10, y: top - 15, font: bold, size: 7.5, color: GRAY_DARK });
		ctx.page.drawText(order.handle || '-', { x: LM + 10, y: top - 28, font: bold, size: 10, color: BLACK });
		if (order.email) {
			ctx.page.drawText(`Email: ${order.email}`, { x: LM + 10, y: top - 41, font: regular, size: 8, color: GRAY_DARK });
		}
		if (order.phone) {
			ctx.page.drawText(`WhatsApp: ${order.phone}`, { x: LM + 10, y: top - 53, font: regular, size: 8, color: GRAY_DARK });
		}

		// Kolom Kanan: Metode & Pengiriman
		const methodSimple = simplifyShippingMethod(order.shippingLabel);
		ctx.page.drawText('METODE PENGIRIMAN', { x: col2X, y: top - 15, font: bold, size: 7.5, color: GRAY_DARK });
		ctx.page.drawText(methodSimple, { x: col2X, y: top - 28, font: bold, size: 10, color: BRANDY });

		if (order.address && order.address.trim() !== '') {
			const addrLines = wrap(`Alamat: ${order.address}`, regular, 8, colW - 14);
			let addrY = top - 41;
			for (const l of addrLines.slice(0, 2)) {
				ctx.page.drawText(l, { x: col2X, y: addrY, font: regular, size: 8, color: GRAY_DARK });
				addrY -= 10;
			}
		} else {
			ctx.page.drawText('Ambil di venue event booth ChibiconXI', { x: col2X, y: top - 41, font: regular, size: 8, color: GRAY_MUTED });
		}

		ctx.y = top - 82;
	}

	// ── 3. TABEL ITEM PRODUK ──
	const colQty = LM + 285;
	const colPrice = LM + 375;
	{
		ensure(ctx, 22);
		const top = ctx.y;

		// Header Tabel
		ctx.page.drawRectangle({ x: LM, y: top - 18, width: CONTENT_W, height: 18, color: BRANDY });
		ctx.page.drawText('PRODUK & SPESIFIKASI', { x: LM + 8, y: top - 13, font: bold, size: 8, color: WHITE });

		const qh = 'QTY';
		ctx.page.drawText(qh, { x: colQty - bold.widthOfTextAtSize(qh, 8) / 2, y: top - 13, font: bold, size: 8, color: WHITE });

		const ph = 'HARGA';
		ctx.page.drawText(ph, { x: colPrice - bold.widthOfTextAtSize(ph, 8) / 2, y: top - 13, font: bold, size: 8, color: WHITE });

		const th = 'TOTAL';
		ctx.page.drawText(th, { x: PAGE_W - RM - bold.widthOfTextAtSize(th, 8) - 8, y: top - 13, font: bold, size: 8, color: WHITE });

		ctx.y = top - 20;
	}

	for (let i = 0; i < order.items.length; i++) {
		const item = order.items[i];
		ensure(ctx, 28);
		const top = ctx.y;

		const itemName = item.variantNameSnapshot ? `${item.nameSnapshot} — ${item.variantNameSnapshot}` : item.nameSnapshot;
		const nameLines = wrap(itemName, bold, 8.5, 235);

		let curY = top - 11;
		for (const l of nameLines) {
			ctx.page.drawText(l, { x: LM + 8, y: curY, font: bold, size: 8.5, color: BLACK });
			curY -= 10;
		}
		if (item.categorySnapshot) {
			ctx.page.drawText(item.categorySnapshot, { x: LM + 8, y: curY, font: regular, size: 7.5, color: GRAY_MUTED });
			curY -= 8;
		}

		const qty = String(item.qty);
		ctx.page.drawText(qty, {
			x: colQty - regular.widthOfTextAtSize(qty, 9) / 2,
			y: top - 12,
			font: regular,
			size: 9,
			color: BLACK
		});

		const price = formatRupiah(item.priceSnapshot);
		ctx.page.drawText(price, {
			x: colPrice - regular.widthOfTextAtSize(price, 8.5) / 2,
			y: top - 12,
			font: regular,
			size: 8.5,
			color: BLACK
		});

		const subtotal = formatRupiah(item.subtotal);
		const sw = bold.widthOfTextAtSize(subtotal, 8.5);
		ctx.page.drawText(subtotal, {
			x: PAGE_W - RM - sw - 8,
			y: top - 12,
			font: bold,
			size: 8.5,
			color: BLACK
		});

		const rowH = Math.max(26, top - curY + 2);
		ctx.y = top - rowH;

		// Garis pembatas tipis antar baris
		ctx.page.drawRectangle({ x: LM, y: ctx.y, width: CONTENT_W, height: 0.5, color: BORDER_COLOR });
	}

	// ── 4. SUBTOTAL, DISKON, PENGIRIMAN & TOTAL PEMBAYARAN ──
	{
		ensure(ctx, 80);
		ctx.y -= 8;

		const rows: [string, string, boolean][] = [
			['Subtotal Produk', formatRupiah(order.subtotal), false]
		];

		// a. Label "Diskon" ringkas to the point
		if ((order.discountTotal ?? 0) > 0) {
			rows.push(['Diskon', `-${formatRupiah(order.discountTotal ?? 0)}`, true]);
		}

		// b. Metode to the point ("Mail Order" / "Pickup Day 1" / "Pickup Day 2")
		const methodSimple = simplifyShippingMethod(order.shippingLabel);
		rows.push([methodSimple, shippingDiff > 0 ? formatRupiah(shippingDiff) : 'Rp 0', false]);

		for (const [label, val, isDiscount] of rows) {
			ensure(ctx, 15);
			const valColor = isDiscount ? CRIMSON_RED : BLACK;
			const valFont = isDiscount ? bold : regular;

			const sw = valFont.widthOfTextAtSize(val, 8.5);
			ctx.page.drawText(val, { x: PAGE_W - RM - sw - 8, y: ctx.y - 8, font: valFont, size: 8.5, color: valColor });

			const lw = regular.widthOfTextAtSize(label, 8.5);
			ctx.page.drawText(label, { x: PAGE_W - RM - sw - lw - 24, y: ctx.y - 8, font: regular, size: 8.5, color: GRAY_DARK });
			ctx.y -= 14;
		}

		// Kotak Total Hitam Elegan Neo-Brutalist
		ensure(ctx, 30);
		ctx.y -= 4;
		const tVal = formatRupiah(order.total);
		const tValW = bold.widthOfTextAtSize(tVal, 11);
		const tLabel = 'TOTAL PEMBAYARAN:';
		const tLabelW = bold.widthOfTextAtSize(tLabel, 9.5);
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
			size: 9.5,
			color: WHITE
		});
		ctx.page.drawText(tVal, {
			x: totalBoxX + 12 + tLabelW + 10,
			y: top - 16,
			font: bold,
			size: 11,
			color: WHITE
		});

		ctx.y = top - 36;
	}

	// ── 5. INFORMASI PEMBAYARAN ──
	if (paymentMethods.length > 0 || qrisCodes.length > 0 || settings.paymentNote) {
		ensure(ctx, 40);
		ctx.page.drawText('INFORMASI PEMBAYARAN', { x: LM, y: ctx.y - 8, font: bold, size: 8, color: BRANDY });
		ctx.page.drawRectangle({ x: LM, y: ctx.y - 12, width: CONTENT_W, height: 0.8, color: BRANDY });
		ctx.y -= 22;

		for (const m of paymentMethods) {
			ensure(ctx, 14);
			const line = `${m.label}: ${m.accountNumber} — a.n. ${m.accountHolder}${m.note ? ` (${m.note})` : ''}`;
			ctx.page.drawText(line, { x: LM + 6, y: ctx.y - 8, font: bold, size: 8, color: BLACK });
			ctx.y -= 14;
		}

		for (const q of qrisCodes) {
			ensure(ctx, 14);
			ctx.page.drawText(`QRIS: ${q.label}`, { x: LM + 6, y: ctx.y - 8, font: bold, size: 8, color: BLACK });
			ctx.y -= 14;
			try {
				const res = await fetch(q.imageUrl, { signal: AbortSignal.timeout(5000) });
				if (res.ok) {
					const type = res.headers.get('content-type') ?? '';
					const bytes = new Uint8Array(await res.arrayBuffer());
					const img =
						type.includes('jpeg') || type.includes('jpg')
							? await pdf.embedJpg(bytes)
							: await pdf.embedPng(bytes);
					const max = 110;
					const scale = Math.min(max / img.width, max / img.height);
					const w = img.width * scale;
					const h = img.height * scale;
					ensure(ctx, h + 8);
					ctx.page.drawImage(img, { x: LM + 6, y: ctx.y - h, width: w, height: h });
					ctx.y -= h + 8;
				}
			} catch {
				// QRIS image skip silently jika offline
			}
		}

		if (settings.paymentNote) {
			ensure(ctx, 12);
			ctx.page.drawText(settings.paymentNote, { x: LM + 6, y: ctx.y - 8, font: regular, size: 7.5, color: GRAY_DARK });
			ctx.y -= 12;
		}
	}

	// ── 6. FOOTER PENUTUP: "Thank you for your order!" ──
	{
		ensure(ctx, 40);
		ctx.y -= 8;
		ctx.page.drawRectangle({ x: LM, y: ctx.y, width: CONTENT_W, height: 0.8, color: BORDER_COLOR });

		// c. "Thank you for your order!"
		const closing = 'Thank you for your order!';
		const cw = bold.widthOfTextAtSize(closing, 10.5);
		ctx.page.drawText(closing, {
			x: LM + (CONTENT_W - cw) / 2,
			y: ctx.y - 14,
			font: bold,
			size: 10.5,
			color: BRANDY
		});

		let yOff = 26;
		if (settings.proofContact || settings.instagram) {
			const support = `Bantuan Pesanan: ${settings.proofContact || ''}${settings.proofContact && settings.instagram ? ' | ' : ''}${settings.instagram ? `Instagram: @${settings.instagram.replace(/^@/, '')}` : ''}`;
			const sw = regular.widthOfTextAtSize(support, 7.5);
			ctx.page.drawText(support, {
				x: LM + (CONTENT_W - sw) / 2,
				y: ctx.y - yOff,
				font: regular,
				size: 7.5,
				color: GRAY_DARK
			});
			yOff += 10;
		}

		const autoNote = `Dokumen ini dibuat otomatis oleh ${settings.storeName || 'Cho Lazey Studio'}`;
		const aw = regular.widthOfTextAtSize(autoNote, 7);
		ctx.page.drawText(autoNote, {
			x: LM + (CONTENT_W - aw) / 2,
			y: ctx.y - yOff,
			font: regular,
			size: 7,
			color: GRAY_MUTED
		});
	}

	return pdf.save();
}
