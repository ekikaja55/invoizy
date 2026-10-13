import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatRupiah } from '$lib/utils/currency';
import { logger } from '$lib/server/logger';
import type { InvoiceData } from '$lib/components/invoice/index';

// Render PDF NATIF pdf-lib: font standar PDF (Helvetica, built-in — tanpa file
// font/wasm/native apa pun) sehingga aman di serverless/Vercel. Multi-halaman
// bila item banyak (lebih baik dari contain-fit satu halaman versi Satori).
const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = rgb(0.09, 0.09, 0.11);
const GRAY = rgb(0.45, 0.45, 0.46);
const FAINT = rgb(0.64, 0.64, 0.66);
const LINE = rgb(0.88, 0.88, 0.89);
const WHITE = rgb(1, 1, 1);
const DARK = rgb(0.09, 0.09, 0.11);

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
  const x = opts?.x ?? MARGIN;
  const maxWidth = opts?.maxWidth ?? CONTENT_W;
  for (const line of wrap(text, font, size, maxWidth)) {
    const h = size + 5;
    ensure(ctx, h);
    ctx.page.drawText(line, { x, y: ctx.y - size, font, size, color });
    ctx.y -= h;
  }
}

function amountOnFirstLine(ctx: Ctx, amount: string, size = 11, bold = false) {
  const font = bold ? ctx.bold : ctx.regular;
  const w = font.widthOfTextAtSize(amount, size);
  ctx.page.drawText(amount, { x: PAGE_W - MARGIN - w, y: ctx.y - size, font, size, color: INK });
}

function rule(ctx: Ctx) {
  ensure(ctx, 14);
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 6, width: CONTENT_W, height: 1, color: LINE });
  ctx.y -= 14;
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const { order, settings, paymentMethods, qrisCodes } = data;
  const shippingDiff = order.total - order.subtotal;

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ctx: Ctx = { pdf, page: pdf.addPage([PAGE_W, PAGE_H]), regular, bold, y: PAGE_H - MARGIN };

  // ── Kop ──
  para(ctx, settings.storeName || 'Invoizy Store', { size: 12, color: GRAY });
  para(ctx, `Invoice ${order.orderId}`, { size: 24, bold: true });
  const createdLabel = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(order.createdAt));
  para(ctx, createdLabel, { size: 11, color: GRAY });
  para(ctx, `${order.handle} · ${order.email}`, { size: 11, bold: true });
  if (order.note) para(ctx, `Catatan: ${order.note}`, { size: 11, color: GRAY });
  rule(ctx);

  // ── Item (dari snapshot) ──
  for (const item of order.items) {
    ensure(ctx, 50);
    const amount = formatRupiah(item.subtotal);
    amountOnFirstLine(ctx, amount);
    para(ctx, item.nameSnapshot, { size: 11, bold: true, maxWidth: CONTENT_W - 120 });
    // kembalikan y termakan amount? amount digambar di baris nama — sejajarkan:
    para(ctx, `${item.categorySnapshot} · ${item.qty} × ${formatRupiah(item.priceSnapshot)}`, {
      size: 10,
      color: GRAY
    });
    ctx.y -= 4;
  }
  rule(ctx);

  // ── Total ──
  ensure(ctx, 20);
  amountOnFirstLine(ctx, formatRupiah(order.subtotal));
  para(ctx, 'Subtotal', { color: GRAY });
  if (shippingDiff > 0) {
    ensure(ctx, 20);
    amountOnFirstLine(ctx, formatRupiah(shippingDiff));
    para(
      ctx,
      `Ongkir${order.shippingLabel ? ` · ${order.shippingLabel}` : ''}`,
      { color: GRAY, maxWidth: CONTENT_W - 140 }
    );
  }
  ensure(ctx, 26);
  amountOnFirstLine(ctx, formatRupiah(order.total), 14, true);
  para(ctx, 'Total', { size: 14, bold: true });
  rule(ctx);

  // ── Pembayaran ──
  para(ctx, 'PEMBAYARAN', { size: 10, bold: true, color: GRAY });

  if (paymentMethods.length === 0 && qrisCodes.length === 0) {
    para(ctx, 'Info pembayaran belum diatur toko. Tunggu konfirmasi admin.', { color: GRAY });
  }

  for (const m of paymentMethods) {
    const lines = [m.label, m.accountNumber, `a.n. ${m.accountHolder}`];
    if (m.note) lines.push(m.note);
    const h = lines.length * 16 + 20;
    ensure(ctx, h);
    const top = ctx.y;
    ctx.page.drawRectangle({
      x: MARGIN,
      y: top - h,
      width: CONTENT_W,
      height: h,
      borderColor: LINE,
      borderWidth: 1
    });
    let ly = top - 8;
    ctx.page.drawText(m.label, { x: MARGIN + 10, y: ly - 11, font: bold, size: 11, color: INK });
    ly -= 16;
    ctx.page.drawText(m.accountNumber, { x: MARGIN + 10, y: ly - 13, font: bold, size: 13, color: INK });
    ly -= 16;
    ctx.page.drawText(`a.n. ${m.accountHolder}`, { x: MARGIN + 10, y: ly - 10, font: regular, size: 10, color: GRAY });
    ly -= 16;
    if (m.note) {
      for (const ln of wrap(m.note, regular, 10, CONTENT_W - 20)) {
        ctx.page.drawText(ln, { x: MARGIN + 10, y: ly - 10, font: regular, size: 10, color: GRAY });
        ly -= 16;
      }
    }
    ctx.y = top - h - 10;
  }

  for (const q of qrisCodes) {
    para(ctx, q.label, { bold: true });
    try {
      const res = await fetch(q.imageUrl, { signal: AbortSignal.timeout(8000) });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const img = type.includes('jpeg') || type.includes('jpg')
        ? await pdf.embedJpg(bytes)
        : await pdf.embedPng(bytes);
      const max = 180;
      const scale = Math.min(max / img.width, max / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ensure(ctx, h + 8);
      ctx.page.drawImage(img, { x: MARGIN, y: ctx.y - h, width: w, height: h });
      ctx.y -= h + 8;
    } catch (err) {
      logger.warn('invoice.qris-skipped', { label: q.label, error: err });
      para(ctx, '(QRIS tidak dapat dimuat)', { size: 10, color: FAINT });
    }
  }

  if (settings.proofContact) {
    ensure(ctx, 30);
    const lines = wrap(`Sudah transfer? Kirim bukti ke ${settings.proofContact}`, bold, 11, CONTENT_W - 20);
    const h = lines.length * 16 + 16;
    ensure(ctx, h);
    const top = ctx.y;
    ctx.page.drawRectangle({ x: MARGIN, y: top - h, width: CONTENT_W, height: h, color: DARK });
    let ly = top - 8;
    for (const ln of lines) {
      ctx.page.drawText(ln, { x: MARGIN + 10, y: ly - 11, font: bold, size: 11, color: WHITE });
      ly -= 16;
    }
    ctx.y = top - h - 10;
  }

  if (settings.paymentNote) para(ctx, settings.paymentNote, { color: GRAY });
  para(ctx, `Dibuat otomatis oleh ${settings.storeName || 'Invoizy Store'}`, { size: 9, color: FAINT });

  return pdf.save();
}
