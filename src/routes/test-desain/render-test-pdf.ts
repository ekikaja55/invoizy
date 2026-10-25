import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatRupiah } from '$lib/utils/currency';
import type { InvoiceData } from '$lib/components/invoice';

// Dimensi A4 pt standar
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const LM = 44;
const RM = 44;
const CONTENT_W = PAGE_W - LM - RM;

// Palet warna resmi dari DESIGN.md (Pastel Elegance & Neo-Brutalist Scrapbook)
const WHITE = rgb(1.0, 1.0, 1.0);
const BASE_DARK = rgb(0.149, 0.149, 0.149); // #262626 (Teks primer & border utama)
const BASE_LIGHT = rgb(0.949, 0.937, 0.914); // #f2efe9 (Off-white / Cream lembut)
const GRID_COLOR = rgb(0.886, 0.871, 0.831); // #e2ded4 (Grid berpetak halus lembut)
const TEXT_SECONDARY = rgb(0.349, 0.349, 0.349); // #595959 (Teks deskripsi sekunder)
const TEXT_MUTED = rgb(0.639, 0.627, 0.6); // #a3a099 (Border & garis pemisah halus)

// Brand Pastel Accent Colors
const BRAND_LAVENDER = rgb(0.706, 0.651, 0.835); // #b4a6d5 (Brand 1)
const BRAND_MINT = rgb(0.482, 0.812, 0.678); // #7bcfad (Semantic Success / Lunas)
const BRAND_PEACH = rgb(0.996, 0.655, 0.439); // #fea770 (Semantic Warning / Pending)
const BRAND_CORAL = rgb(0.878, 0.478, 0.478); // #e07a7a (Semantic Error / Diskon)

interface Ctx {
	pdf: PDFDocument;
	page: PDFPage;
	sans: PDFFont;
	sansBold: PDFFont;
	mono: PDFFont;
	monoBold: PDFFont;
	y: number;
}

function drawGraphGrid(page: PDFPage, step = 16) {
	// 1. Lapisan dasar Cream #f2efe9
	page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BASE_LIGHT });

	// 2. Garis grid vertikal tipis (0.4pt)
	for (let x = 0; x <= PAGE_W; x += step) {
		page.drawRectangle({ x, y: 0, width: 0.4, height: PAGE_H, color: GRID_COLOR });
	}

	// 3. Garis grid horizontal tipis (0.4pt)
	for (let y = 0; y <= PAGE_H; y += step) {
		page.drawRectangle({ x: 0, y, width: PAGE_W, height: 0.4, color: GRID_COLOR });
	}
}

function newPage(ctx: Ctx) {
	ctx.page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
	drawGraphGrid(ctx.page);
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

function drawDashedRule(ctx: Ctx, y: number, color = TEXT_MUTED) {
	const dashLen = 3;
	const gapLen = 2.5;
	let curX = LM;
	while (curX < PAGE_W - RM) {
		const w = Math.min(dashLen, PAGE_W - RM - curX);
		ctx.page.drawRectangle({ x: curX, y, width: w, height: 0.8, color });
		curX += dashLen + gapLen;
	}
}

export async function renderTestInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
	const { order, settings } = data;
	const shippingDiff = order.total - order.subtotal + (order.discountTotal ?? 0);

	const pdf = await PDFDocument.create();

	// Tipografi ganda retro receipt: Helvetica (modern clean) + Courier (monospace typewriter)
	const sans = await pdf.embedFont(StandardFonts.Helvetica);
	const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const mono = await pdf.embedFont(StandardFonts.Courier);
	const monoBold = await pdf.embedFont(StandardFonts.CourierBold);

	const ctx: Ctx = {
		pdf,
		page: pdf.addPage([PAGE_W, PAGE_H]),
		sans,
		sansBold,
		mono,
		monoBold,
		y: PAGE_H - 44
	};

	// Menggambar background Cream #f2efe9 dengan pola grid berpetak halus
	drawGraphGrid(ctx.page);

	const createdLabel = new Intl.DateTimeFormat('id-ID', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(order.createdAt));

	// ── 1. KOP SURAT (HEADER NOTA SCRAPBOOK) ──
	{
		ensure(ctx, 70);
		const top = ctx.y;

		// Nama Toko (HelveticaBold)
		const store = settings.storeName || 'CHO.LAZEY - CHIBICONXI CATALOGUE';
		ctx.page.drawText(store.toUpperCase(), {
			x: LM,
			y: top - 18,
			font: sansBold,
			size: 15,
			color: BASE_DARK
		});

		// Sub-header mikro (Lavender Accent Badge)
		ctx.page.drawRectangle({
			x: LM,
			y: top - 32,
			width: 145,
			height: 12,
			color: BRAND_LAVENDER
		});
		ctx.page.drawText('BUKTI TRANSAKSI & RECEIPT RESMI', {
			x: LM + 5,
			y: top - 30,
			font: sansBold,
			size: 6.5,
			color: BASE_DARK
		});

		// Sisi Kanan: Nomor Invoice (CourierBold Retro) & Tanggal
		const invTitle = `#${order.orderId}`;
		const invW = monoBold.widthOfTextAtSize(invTitle, 13);
		ctx.page.drawText(invTitle, {
			x: PAGE_W - RM - invW,
			y: top - 16,
			font: monoBold,
			size: 13,
			color: BASE_DARK
		});

		const dateText = createdLabel;
		const dateW = mono.widthOfTextAtSize(dateText, 8.5);
		ctx.page.drawText(dateText, {
			x: PAGE_W - RM - dateW,
			y: top - 30,
			font: mono,
			size: 8.5,
			color: TEXT_SECONDARY
		});

		// Badge Status Pembayaran (Palet DESIGN.md: Mint / Peach)
		const status = order.paymentStatus;
		const isPaid = status === 'CONFIRMED';
		const isCancelled = status === 'CANCELLED';
		const stampText = isPaid
			? 'STATUS: LUNAS / PAID'
			: isCancelled
				? 'STATUS: DIBATALKAN'
				: 'STATUS: MENUNGGU PEMBAYARAN';
		const badgeBg = isPaid ? BRAND_MINT : isCancelled ? BRAND_CORAL : BRAND_PEACH;

		const stampW = sansBold.widthOfTextAtSize(stampText, 7.5) + 12;
		ctx.page.drawRectangle({
			x: PAGE_W - RM - stampW,
			y: top - 48,
			width: stampW,
			height: 14,
			color: badgeBg
		});
		ctx.page.drawRectangle({
			x: PAGE_W - RM - stampW,
			y: top - 48,
			width: stampW,
			height: 14,
			borderColor: BASE_DARK,
			borderWidth: 0.8
		});
		ctx.page.drawText(stampText, {
			x: PAGE_W - RM - stampW + 6,
			y: top - 44,
			font: sansBold,
			size: 7.5,
			color: BASE_DARK
		});

		// Garis Aksen Bawah Kop Surat
		ctx.y = top - 56;
		ctx.page.drawRectangle({
			x: LM,
			y: ctx.y - 2,
			width: CONTENT_W,
			height: 1.5,
			color: BASE_DARK
		});
		ctx.y -= 14;
	}

	// ── 2. DUA KOLOM: INFORMASI PEMESAN & METODE (KERTAS PUTIH DI ATAS GRID) ──
	{
		ensure(ctx, 72);
		const top = ctx.y;
		const colW = (CONTENT_W - 24) / 2;
		const col2X = LM + colW + 24;

		// Background Panel Putih Murni (#ffffff) dengan Border Charcoal (#262626)
		ctx.page.drawRectangle({
			x: LM,
			y: top - 68,
			width: CONTENT_W,
			height: 68,
			color: WHITE,
			borderColor: BASE_DARK,
			borderWidth: 1.2
		});

		// Kolom Kiri: Pemesan
		ctx.page.drawText('PEMESAN (BILL TO)', {
			x: LM + 10,
			y: top - 15,
			font: sansBold,
			size: 7.5,
			color: TEXT_SECONDARY
		});
		ctx.page.drawText(order.handle || '-', {
			x: LM + 10,
			y: top - 28,
			font: sansBold,
			size: 10,
			color: BASE_DARK
		});
		if (order.email) {
			ctx.page.drawText(`Email: ${order.email}`, {
				x: LM + 10,
				y: top - 41,
				font: sans,
				size: 8,
				color: TEXT_SECONDARY
			});
		}
		if (order.phone) {
			ctx.page.drawText(`WhatsApp: ${order.phone}`, {
				x: LM + 10,
				y: top - 53,
				font: mono,
				size: 8,
				color: BASE_DARK
			});
		}

		// Kolom Kanan: Metode Pengiriman to the point
		const methodSimple = simplifyShippingMethod(order.shippingLabel);
		ctx.page.drawText('METODE PENGIRIMAN', {
			x: col2X,
			y: top - 15,
			font: sansBold,
			size: 7.5,
			color: TEXT_SECONDARY
		});
		ctx.page.drawText(methodSimple, {
			x: col2X,
			y: top - 28,
			font: sansBold,
			size: 10,
			color: BASE_DARK
		});

		if (order.address && order.address.trim() !== '') {
			const addrLines = wrap(`Alamat: ${order.address}`, sans, 8, colW - 14);
			let addrY = top - 41;
			for (const l of addrLines.slice(0, 2)) {
				ctx.page.drawText(l, { x: col2X, y: addrY, font: sans, size: 8, color: TEXT_SECONDARY });
				addrY -= 10;
			}
		} else {
			ctx.page.drawText('Ambil di venue event booth ChibiconXI', {
				x: col2X,
				y: top - 41,
				font: sans,
				size: 8,
				color: TEXT_MUTED
			});
		}

		ctx.y = top - 80;
	}

	// ── 3. TABEL RINCIAN ITEM BELANJA (KERTAS PUTIH DI ATAS GRID) ──
	const colQty = LM + 285;
	const colPrice = LM + 375;
	{
		ensure(ctx, 22);
		const top = ctx.y;

		// Header Tabel berlatar Putih (#ffffff) dengan Border Bawah Tegas (#262626)
		ctx.page.drawRectangle({ x: LM, y: top - 18, width: CONTENT_W, height: 18, color: WHITE });
		ctx.page.drawRectangle({ x: LM, y: top - 18, width: CONTENT_W, height: 1.2, color: BASE_DARK });

		ctx.page.drawText('ITEM & SPESIFIKASI', {
			x: LM + 8,
			y: top - 13,
			font: sansBold,
			size: 8,
			color: BASE_DARK
		});

		const qh = 'QTY';
		ctx.page.drawText(qh, {
			x: colQty - sansBold.widthOfTextAtSize(qh, 8) / 2,
			y: top - 13,
			font: sansBold,
			size: 8,
			color: BASE_DARK
		});

		const ph = 'HARGA';
		ctx.page.drawText(ph, {
			x: colPrice - sansBold.widthOfTextAtSize(ph, 8) / 2,
			y: top - 13,
			font: sansBold,
			size: 8,
			color: BASE_DARK
		});

		const th = 'TOTAL';
		ctx.page.drawText(th, {
			x: PAGE_W - RM - sansBold.widthOfTextAtSize(th, 8) - 8,
			y: top - 13,
			font: sansBold,
			size: 8,
			color: BASE_DARK
		});

		ctx.y = top - 20;
	}

	for (let i = 0; i < order.items.length; i++) {
		const item = order.items[i];
		ensure(ctx, 28);
		const top = ctx.y;

		const itemName = item.variantNameSnapshot
			? `${item.nameSnapshot} — ${item.variantNameSnapshot}`
			: item.nameSnapshot;
		const nameLines = wrap(itemName, sansBold, 8.5, 235);

		// Hitung tinggi baris
		const textLinesCount = nameLines.length + (item.categorySnapshot ? 1 : 0);
		const rowH = Math.max(26, textLinesCount * 10 + 6);

		// Lapisan Latar Putih Murni di balik tiap baris agar teks 100% jernih di atas grid
		ctx.page.drawRectangle({ x: LM, y: top - rowH, width: CONTENT_W, height: rowH, color: WHITE });

		let curY = top - 11;
		for (const l of nameLines) {
			ctx.page.drawText(l, { x: LM + 8, y: curY, font: sansBold, size: 8.5, color: BASE_DARK });
			curY -= 10;
		}
		if (item.categorySnapshot) {
			ctx.page.drawText(item.categorySnapshot, {
				x: LM + 8,
				y: curY,
				font: sans,
				size: 7.5,
				color: TEXT_SECONDARY
			});
		}

		// Angka QTY dalam font Courier Retro
		const qty = String(item.qty);
		ctx.page.drawText(qty, {
			x: colQty - mono.widthOfTextAtSize(qty, 9) / 2,
			y: top - 12,
			font: mono,
			size: 9,
			color: BASE_DARK
		});

		// Harga Satuan dalam font Courier Retro
		const price = formatRupiah(item.priceSnapshot);
		ctx.page.drawText(price, {
			x: colPrice - mono.widthOfTextAtSize(price, 8.5) / 2,
			y: top - 12,
			font: mono,
			size: 8.5,
			color: BASE_DARK
		});

		// Subtotal dalam font CourierBold Retro
		const subtotal = formatRupiah(item.subtotal);
		const sw = monoBold.widthOfTextAtSize(subtotal, 8.5);
		ctx.page.drawText(subtotal, {
			x: PAGE_W - RM - sw - 8,
			y: top - 12,
			font: monoBold,
			size: 8.5,
			color: BASE_DARK
		});

		ctx.y = top - rowH;

		// Garis pembatas putus-putus halus antar item
		drawDashedRule(ctx, ctx.y, TEXT_MUTED);
	}

	// ── 4. RINGKASAN: SUBTOTAL, DISKON, PENGIRIMAN & TOTAL (KERTAS PUTIH DI ATAS GRID) ──
	{
		ensure(ctx, 84);
		ctx.y -= 10;

		const rows: [string, string, boolean][] = [
			['Subtotal Produk', formatRupiah(order.subtotal), false]
		];

		// a. Label "Diskon" ringkas
		if ((order.discountTotal ?? 0) > 0) {
			rows.push(['Diskon', `-${formatRupiah(order.discountTotal ?? 0)}`, true]);
		}

		// b. Metode to the point
		const methodSimple = simplifyShippingMethod(order.shippingLabel);
		rows.push([methodSimple, shippingDiff > 0 ? formatRupiah(shippingDiff) : 'Rp 0', false]);

		for (const [label, val, isDiscount] of rows) {
			ensure(ctx, 15);
			const valColor = isDiscount ? BRAND_CORAL : BASE_DARK;
			const valFont = isDiscount ? monoBold : mono;

			// Latar putih halus di bawah baris ringkasan
			const sw = valFont.widthOfTextAtSize(val, 8.5);
			const lw = sans.widthOfTextAtSize(label, 8.5);
			const boxW = sw + lw + 36;
			const boxX = PAGE_W - RM - boxW;

			ctx.page.drawRectangle({
				x: boxX,
				y: ctx.y - 12,
				width: boxW,
				height: 14,
				color: WHITE
			});

			ctx.page.drawText(val, {
				x: PAGE_W - RM - sw - 8,
				y: ctx.y - 8,
				font: valFont,
				size: 8.5,
				color: valColor
			});
			ctx.page.drawText(label, {
				x: PAGE_W - RM - sw - lw - 24,
				y: ctx.y - 8,
				font: sans,
				size: 8.5,
				color: TEXT_SECONDARY
			});
			ctx.y -= 14;
		}

		// Kotak Total Hitam Tegas (#262626) dengan Angka CourierBold Putih
		ensure(ctx, 32);
		ctx.y -= 4;
		const tVal = formatRupiah(order.total);
		const tValW = monoBold.widthOfTextAtSize(tVal, 11);
		const tLabel = 'TOTAL PEMBAYARAN:';
		const tLabelW = sansBold.widthOfTextAtSize(tLabel, 9.5);
		const totalBoxW = tValW + tLabelW + 36;
		const totalBoxX = PAGE_W - RM - totalBoxW;
		const top = ctx.y;

		ctx.page.drawRectangle({
			x: totalBoxX,
			y: top - 24,
			width: totalBoxW,
			height: 24,
			color: BASE_DARK
		});
		ctx.page.drawText(tLabel, {
			x: totalBoxX + 12,
			y: top - 16,
			font: sansBold,
			size: 9.5,
			color: WHITE
		});
		ctx.page.drawText(tVal, {
			x: totalBoxX + 12 + tLabelW + 10,
			y: top - 16,
			font: monoBold,
			size: 11,
			color: WHITE
		});

		ctx.y = top - 42;
	}

	// ── 5. FOOTER PENUTUP: "Thank you for your order!" (Clean Receipt Footer) ──
	{
		ensure(ctx, 50);

		// Panel Pita Putih (#ffffff) untuk Footer Penutup
		const panelH = 38;
		ctx.page.drawRectangle({
			x: LM,
			y: ctx.y - panelH,
			width: CONTENT_W,
			height: panelH,
			color: WHITE,
			borderColor: BASE_DARK,
			borderWidth: 1.2
		});

		// "Thank you for your order!"
		const closing = 'Thankyou for your order!';
		const cw = sansBold.widthOfTextAtSize(closing, 10.5);
		ctx.page.drawText(closing, {
			x: LM + (CONTENT_W - cw) / 2,
			y: ctx.y - 14,
			font: sansBold,
			size: 10.5,
			color: BASE_DARK
		});

		let yOff = 26;
		if (settings.proofContact || settings.instagram) {
			const support = `Bantuan Pesanan: ${settings.proofContact || ''}${settings.proofContact && settings.instagram ? ' | ' : ''}${settings.instagram ? `Instagram: @${settings.instagram.replace(/^@/, '')}` : ''}`;
			const sw = sans.widthOfTextAtSize(support, 7.5);
			ctx.page.drawText(support, {
				x: LM + (CONTENT_W - sw) / 2,
				y: ctx.y - yOff,
				font: sans,
				size: 7.5,
				color: TEXT_SECONDARY
			});
			yOff += 10;
		}

		const autoNote = `Dokumen ini dibuat otomatis oleh ${settings.storeName || 'Cho Lazey Studio'}`;
		const aw = mono.widthOfTextAtSize(autoNote, 6.5);
		ctx.page.drawText(autoNote, {
			x: LM + (CONTENT_W - aw) / 2,
			y: ctx.y - yOff,
			font: mono,
			size: 6.5,
			color: TEXT_MUTED
		});
	}

	return pdf.save();
}
