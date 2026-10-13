import { db } from '$lib/server/db';
import {
	categories,
	products,
	orders,
	orderItems,
	storeSettings,
	paymentMethods,
	qrisCodes
} from '$lib/server/db/schema';
import { eq, asc, and, gte, lte, inArray, sql, count, desc, ilike, or, sum } from 'drizzle-orm';
import { generateOrderId, generateAccessToken } from '$lib/utils/order-id';
import { calculateCourier } from '$lib/server/shipping/client';
import { SHIPPING_COURIERS } from '$lib/server/shipping/couriers';
import { getSettings } from '$lib/server/db/queries/settings';
import { logger } from '$lib/server/logger';

export class OrderError extends Error {}

export interface ShippingQuoteInput {
	kind: 'quote';
	courier: string;
	service: string;
	cost: number;
	destId: number;
	destLabel: string;
}

export interface ShippingFallbackInput {
	kind: 'fallback';
}

export type ShippingInput = ShippingQuoteInput | ShippingFallbackInput | null;

export interface CreateOrderInput {
	handle: string;
	email: string;
	note: string;
	items: { productId: string; qty: number }[];
	shipping: ShippingInput;
}

export async function getActiveCatalog() {
	const allCategories = await db.query.categories.findMany({
		orderBy: [asc(categories.sortOrder)],
		with: {
			products: {
				where: eq(products.active, true),
				orderBy: [asc(products.sortOrder)]
			}
		}
	});

	// buang kategori yang tidak punya produk aktif sama sekali (tidak ada yang bisa dipesan)
	return allCategories.filter((c) => c.products.length > 0);
}

export async function createOrder(input: CreateOrderInput) {
	// track: catat start/success/durasi + error lengkap (termasuk code/detail Postgres).
	return logger.track('order.create', { items: input.items.length }, () =>
		db.transaction(async (tx) => {
			const productIds = [...new Set(input.items.map((i) => i.productId))];

			const rows = await tx.query.products.findMany({
				where: inArray(products.id, productIds),
				with: { category: true }
			});
			const byId = new Map(rows.map((p) => [p.id, p]));

			// ── Validasi: produk harus ada, aktif, dan (kalau track_stock) stok cukup ──
			for (const item of input.items) {
				const product = byId.get(item.productId);
				if (!product) {
					throw new OrderError('Ada produk yang sudah dihapus. Silakan muat ulang halaman order.');
				}
				if (!product.active) {
					throw new OrderError(`"${product.name}" sudah tidak tersedia.`);
				}
				if (product.trackStock && product.stock < item.qty) {
					throw new OrderError(`Stok "${product.name}" tidak cukup (tersisa ${product.stock}).`);
				}
			}

			// ── Berat total dari DB (wajib > 0 — produk belum ditimbang gagal keras) ──
			let weightGrams = 0;
			for (const item of input.items) {
				const product = byId.get(item.productId)!;
				if (!product.weightGrams || product.weightGrams <= 0) {
					throw new OrderError(`Produk "${product.name}" belum ada data berat. Hubungi admin.`);
				}
				weightGrams += product.weightGrams * item.qty;
			}

			// ── Ongkir: hitung ulang dari API (jangan percaya angka client) ──
			let shippingPrice = 0;
			let shipName: string | null = null;
			let shipLabel: string | null = null;

			if (input.shipping?.kind === 'quote') {
				const s = input.shipping;
				const recalc = await calculateCourier(s.courier, s.destId, weightGrams);
				const match = recalc.options.find((o) => o.service === s.service);
				if (!match || match.cost !== s.cost) {
					throw new OrderError('Ongkir berubah. Silakan pilih ulang opsi pengiriman.');
				}
				const label =
					SHIPPING_COURIERS.find((c) => c.code === s.courier)?.label ?? s.courier.toUpperCase();
				shippingPrice = match.cost;
				shipName = `${label} ${match.service}`;
				const etd = match.etd && match.etd !== '-' ? ` • ${match.etd}` : '';
				shipLabel = `${label} ${match.service} • ${s.destLabel}${etd}`;
			} else if (input.shipping?.kind === 'fallback') {
				const settings = await getSettings();
				const rate = settings?.emergencyFlatRate ?? 0;
				if (rate <= 0) {
					throw new OrderError('Layanan ongkir gangguan. Coba lagi nanti.');
				}
				shippingPrice = rate;
				shipName = 'Ongkir flat darurat';
				shipLabel = 'Ongkir flat darurat';
			}

			// ── Snapshot line item: nama & harga diambil dari DB, BUKAN dari client ──
			let subtotal = 0;
			const lineItems: {
				productId: string | null;
				categorySnapshot: string;
				nameSnapshot: string;
				priceSnapshot: number;
				qty: number;
				subtotal: number;
			}[] = input.items.map((item) => {
				const product = byId.get(item.productId)!;
				const lineSubtotal = product.priceInt * item.qty;
				subtotal += lineSubtotal;
				return {
					productId: product.id,
					categorySnapshot: product.category.name,
					nameSnapshot: product.name,
					priceSnapshot: product.priceInt,
					qty: item.qty,
					subtotal: lineSubtotal
				};
			});

			const total = subtotal + shippingPrice;

			if (shipName) {
				lineItems.push({
					productId: null,
					categorySnapshot: 'Ongkir',
					nameSnapshot: shipName,
					priceSnapshot: shippingPrice,
					qty: 1,
					subtotal: shippingPrice
				});
			}

			// ── Kurangi stok secara atomik: UPDATE ... WHERE stock >= qty ──
			// Aman dari race condition (dua order bersamaan tidak bisa oversell), karena
			// kondisi stok cukup di-assert ulang di dalam WHERE pada saat UPDATE.
			for (const item of input.items) {
				const product = byId.get(item.productId)!;
				if (!product.trackStock) continue;

				const updated = await tx
					.update(products)
					.set({ stock: sql`${products.stock} - ${item.qty}` })
					.where(and(eq(products.id, product.id), gte(products.stock, item.qty)))
					.returning({ id: products.id });

				if (updated.length === 0) {
					throw new OrderError(`Stok "${product.name}" habis saat diproses. Silakan coba lagi.`);
				}
			}

			const [order] = await tx
				.insert(orders)
				.values({
					orderId: generateOrderId(),
					accessToken: generateAccessToken(),
					handle: input.handle,
					email: input.email,
					note: input.note,
					subtotal,
					total,
					shippingLabel: shipLabel,
					invoiceStatus: 'PENDING',
					paymentStatus: 'PENDING'
				})
				.returning();

			logger.info('order.inserted', { orderId: order.orderId, total: order.total });

			await tx
				.insert(orderItems)
				.values(lineItems.map((item, idx) => ({ ...item, orderId: order.id, sortOrder: idx })));

			logger.info('order.items-inserted', { orderId: order.orderId, count: lineItems.length });

			return { orderId: order.orderId, accessToken: order.accessToken };
		})
	);
}

export async function getOrderByToken(orderId: string, accessToken: string) {
	const order = await db.query.orders.findFirst({
		where: and(eq(orders.orderId, orderId), eq(orders.accessToken, accessToken)),
		with: {
			items: {
				orderBy: [asc(orderItems.sortOrder)]
			}
		}
	});

	if (!order) return null;

	const settings = (await db.query.storeSettings.findFirst({
		where: eq(storeSettings.id, 1)
	})) ?? {
		storeName: 'Invoizy Store',
		instagram: '',
		twitter: '',
		emailFromName: '',
		paymentNote: '',
		proofContact: ''
	};

	const methods = await db.query.paymentMethods.findMany({
		where: eq(paymentMethods.active, true),
		orderBy: [asc(paymentMethods.sortOrder)]
	});

	const qris = await db.query.qrisCodes.findMany({
		where: eq(qrisCodes.active, true),
		orderBy: [asc(qrisCodes.sortOrder)]
	});

	return {
		order,
		settings,
		paymentMethods: methods,
		qrisCodes: qris
	};
}

export async function getOrderById(orderId: string) {
	return db.query.orders.findFirst({
		where: eq(orders.orderId, orderId),
		with: {
			items: {
				orderBy: [asc(orderItems.sortOrder)]
			}
		}
	});
}

export async function updateOrderInvoiceResult(
	orderId: string,
	data: {
		invoiceStatus: 'PENDING' | 'GENERATING' | 'SENT' | 'FAILED';
		invoiceUrl?: string;
		pdfFilePath?: string;
		error?: string | null;
	}
) {
	await db
		.update(orders)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(orders.orderId, orderId));
}

export async function updateOrderPaymentStatus(
	orderId: string,
	paymentStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
) {
	await db
		.update(orders)
		.set({ paymentStatus, updatedAt: new Date() })
		.where(eq(orders.orderId, orderId));
}

// ─────────────────────────────────────────────
// LIST + FILTER + PAGINATION (admin)
// ─────────────────────────────────────────────

export const ORDER_PER_PAGE = 10;
export const ORDER_EXPORT_LIMIT = 2000;

const INVOICE_FILTERS = ['PENDING', 'GENERATING', 'SENT', 'FAILED'] as const;
const PAYMENT_FILTERS = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface OrderListFilters {
	invoice?: string;
	payment?: string;
	q?: string;
	from?: string;
	to?: string;
}

// Satu builder WHERE dipakai list + count + export — filter selalu konsisten.
function buildOrderConditions(f: OrderListFilters) {
	const cond = [];

	if (f.invoice && (INVOICE_FILTERS as readonly string[]).includes(f.invoice)) {
		cond.push(eq(orders.invoiceStatus, f.invoice as (typeof INVOICE_FILTERS)[number]));
	}

	if (f.payment && (PAYMENT_FILTERS as readonly string[]).includes(f.payment)) {
		cond.push(eq(orders.paymentStatus, f.payment as (typeof PAYMENT_FILTERS)[number]));
	}

	const q = f.q?.trim();
	if (q) {
		const like = `%${q}%`;
		cond.push(
			or(ilike(orders.orderId, like), ilike(orders.handle, like), ilike(orders.email, like))
		);
	}

	if (f.from && DATE_RE.test(f.from)) {
		cond.push(gte(orders.createdAt, new Date(`${f.from}T00:00:00`)));
	}

	if (f.to && DATE_RE.test(f.to)) {
		cond.push(lte(orders.createdAt, new Date(`${f.to}T23:59:59`)));
	}

	return cond;
}

export async function countOrders(f: OrderListFilters): Promise<number> {
	const cond = buildOrderConditions(f);
	const [row] = await db
		.select({ n: count() })
		.from(orders)
		.where(cond.length > 0 ? and(...cond) : undefined);
	return row?.n ?? 0;
}

export async function listOrders(f: OrderListFilters, page: number, perPage = ORDER_PER_PAGE) {
	const cond = buildOrderConditions(f);
	return db.query.orders.findMany({
		where: cond.length > 0 ? and(...cond) : undefined,
		orderBy: [desc(orders.createdAt)],
		limit: perPage,
		offset: (page - 1) * perPage,
		with: { items: { columns: { id: true, qty: true } } }
	});
}

export async function listOrdersForExport(f: OrderListFilters) {
	const cond = buildOrderConditions(f);
	return db.query.orders.findMany({
		where: cond.length > 0 ? and(...cond) : undefined,
		orderBy: [desc(orders.createdAt)],
		limit: ORDER_EXPORT_LIMIT,
		with: { items: { columns: { id: true, qty: true } } }
	});
}

// ─────────────────────────────────────────────
// DASHBOARD (admin)
// ─────────────────────────────────────────────

export interface DashboardStats {
	totalOrders: number;
	totalRevenue: number;
	byInvoice: { status: string; count: number }[];
	byPayment: { status: string; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
	const [total] = await db.select({ orders: count(), revenue: sum(orders.total) }).from(orders);

	const byInvoice = await db
		.select({ status: orders.invoiceStatus, n: count() })
		.from(orders)
		.groupBy(orders.invoiceStatus);

	const byPayment = await db
		.select({ status: orders.paymentStatus, n: count() })
		.from(orders)
		.groupBy(orders.paymentStatus);

	return {
		totalOrders: total?.orders ?? 0,
		totalRevenue: Number(total?.revenue ?? 0),
		byInvoice: byInvoice.map((r) => ({ status: r.status, count: r.n })),
		byPayment: byPayment.map((r) => ({ status: r.status, count: r.n }))
	};
}
