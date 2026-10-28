import { db } from '$lib/server/db';
import {
	categories,
	products,
	orders,
	orderItems,
	storeSettings,
	paymentMethods,
	qrisCodes,
	productVariants,
	productPromos
} from '$lib/server/db/schema';
import {
	eq,
	asc,
	and,
	gte,
	lte,
	inArray,
	notInArray,
	sql,
	count,
	desc,
	ilike,
	or,
	sum
} from 'drizzle-orm';
import { generateOrderId, generateAccessToken } from '$lib/utils/order-id';
import { SHIPPING_COURIERS } from '$lib/server/shipping/couriers';
import { ORDER_HOLD_TIMEOUT_MINUTES } from '$lib/constants';
import { logger } from '$lib/server/logger';

export class OrderError extends Error {}

export interface ShippingMailOrderInput {
	kind: 'mail_order';
}

export interface ShippingPickupDay1Input {
	kind: 'pickup_day_1';
}

export interface ShippingPickupDay2Input {
	kind: 'pickup_day_2';
}

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

export interface ShippingPickupInput {
	kind: 'pickup';
	code?: string;
}

export type ShippingInput =
	| ShippingMailOrderInput
	| ShippingPickupDay1Input
	| ShippingPickupDay2Input
	| ShippingQuoteInput
	| ShippingFallbackInput
	| ShippingPickupInput
	| null;

export interface CreateOrderInput {
	handle: string;
	email: string;
	note: string;
	address?: string;
	phone: string;
	items: {
		productId: string;
		variantId?: string | null;
		variantName?: string | null;
		qty: number;
	}[];
	shipping: ShippingInput;
}

export async function getActiveCatalog() {
	// Auto-sweeper: kembalikan stok pesanan PENDING yang kedaluwarsa sebelum katalog di-query
	await expireAllOverdueOrdersAndRollbackStock().catch((err) => {
		logger.error('order.sweeper-failed', { error: err });
	});

	const allCategories = await db.query.categories.findMany({
		orderBy: [asc(categories.sortOrder)],
		with: {
			products: {
				where: eq(products.active, true),
				orderBy: [asc(products.sortOrder)],
				with: {
					variants: {
						orderBy: [asc(productVariants.sortOrder), asc(productVariants.createdAt)]
					},
					promos: {
						where: eq(productPromos.active, true)
					}
				}
			}
		}
	});

	// buang kategori yang tidak punya produk aktif sama sekali (tidak ada yang bisa dipesan)
	return allCategories.filter((c) => c.products.length > 0);
}

export async function getActivePromoRules() {
	const promos = await db.query.productPromos.findMany({
		where: eq(productPromos.active, true)
	});
	return promos.map((p) => ({
		productId: p.productId,
		name: p.name,
		minQty: p.minQty,
		discountAmount: p.discountAmount
	}));
}

export async function createOrder(input: CreateOrderInput) {
	// track: catat start/success/durasi + error lengkap (termasuk code/detail Postgres).
	return logger.track('order.create', { items: input.items.length }, () =>
		db.transaction(async (tx) => {
			const productIds = [...new Set(input.items.map((i) => i.productId))];

			const rows = await tx.query.products.findMany({
				where: inArray(products.id, productIds),
				with: {
					category: true,
					variants: true,
					promos: {
						where: eq(productPromos.active, true)
					}
				}
			});
			const byId = new Map(rows.map((p) => [p.id, p]));

			// ── Validasi: produk & varian harus ada, aktif, dan (kalau track_stock) stok cukup ──
			for (const item of input.items) {
				const product = byId.get(item.productId);
				if (!product) {
					throw new OrderError('Ada produk yang sudah dihapus. Silakan muat ulang halaman order.');
				}
				if (!product.active) {
					throw new OrderError(`"${product.name}" sudah tidak tersedia.`);
				}
				if (item.variantId) {
					const variant = product.variants.find((v) => v.id === item.variantId);
					if (!variant) {
						throw new OrderError(
							`Varian "${item.variantName ?? ''}" untuk "${product.name}" tidak ditemukan.`
						);
					}
					const shouldTrack = product.trackStock && variant.trackStock !== false;
					if (shouldTrack && variant.stock < item.qty) {
						throw new OrderError(
							`Stok varian "${variant.name}" (${product.name}) tidak cukup (tersisa ${variant.stock}).`
						);
					}
				} else if (product.trackStock && product.stock < item.qty) {
					throw new OrderError(`Stok "${product.name}" tidak cukup (tersisa ${product.stock}).`);
				}
			}

			// ── Ongkir & Mode Pengiriman (3 opsi event offline + fallback) ──
			let shippingPrice: number;
			let shippingType: string;
			let shipLabel: string | null;

			if (input.shipping?.kind === 'mail_order') {
				shippingPrice = 0;
				shippingType = 'MAIL_ORDER';
				shipLabel = 'Mail Order (Pengiriman via Shopee)';
			} else if (input.shipping?.kind === 'pickup_day_1') {
				shippingPrice = 0;
				shippingType = 'PICKUP_DAY_1';
				shipLabel = 'Self-Pickup: Chibiconxi Day 1 (12 Des 2026)';
			} else if (input.shipping?.kind === 'pickup_day_2') {
				shippingPrice = 0;
				shippingType = 'PICKUP_DAY_2';
				shipLabel = 'Self-Pickup: Chibiconxi Day 2 (13 Des 2026)';
			} else if (input.shipping?.kind === 'quote') {
				const s = input.shipping;
				shippingPrice = s.cost || 0;
				shippingType = 'QUOTE';
				const label =
					SHIPPING_COURIERS.find((c) => c.code === s.courier)?.label ?? s.courier.toUpperCase();
				shipLabel = `${label} ${s.service} • ${s.destLabel}`;
			} else if (input.shipping?.kind === 'pickup') {
				shippingPrice = 0;
				shippingType = 'PICKUP';
				shipLabel = 'Ambil Sendiri (Self-Pickup)';
			} else {
				shippingPrice = 0;
				shippingType = 'MAIL_ORDER';
				shipLabel = 'Mail Order (Pengiriman via Shopee)';
			}

			// ── Snapshot line item: nama & harga diambil dari DB, BUKAN dari client ──
			let subtotal = 0;
			const lineItems: {
				productId: string | null;
				categorySnapshot: string;
				nameSnapshot: string;
				variantNameSnapshot: string | null;
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
					variantNameSnapshot: item.variantName ?? null,
					priceSnapshot: product.priceInt,
					qty: item.qty,
					subtotal: lineSubtotal
				};
			});

			// ── Hitung Diskon Promo Kuantitas Produk ──
			const qtyPerProduct = new Map<string, number>();
			for (const item of input.items) {
				qtyPerProduct.set(item.productId, (qtyPerProduct.get(item.productId) || 0) + item.qty);
			}

			let discountTotal = 0;
			for (const [prodId, totalQty] of qtyPerProduct.entries()) {
				const product = byId.get(prodId);
				if (!product || !product.promos || product.promos.length === 0) continue;
				for (const promo of product.promos) {
					if (
						promo.active &&
						promo.minQty > 0 &&
						totalQty >= promo.minQty &&
						promo.discountAmount > 0
					) {
						const multiplier = Math.floor(totalQty / promo.minQty);
						discountTotal += multiplier * promo.discountAmount;
					}
				}
			}

			const total = Math.max(0, subtotal - discountTotal) + shippingPrice;

			// ── Kurangi stok secara atomik: UPDATE ... WHERE stock >= qty ──
			// Aman dari race condition (dua order bersamaan tidak bisa oversell)
			for (const item of input.items) {
				const product = byId.get(item.productId)!;
				if (item.variantId) {
					const variant = product.variants.find((v) => v.id === item.variantId);
					const shouldTrack = product.trackStock && variant?.trackStock !== false;
					if (shouldTrack) {
						const updated = await tx
							.update(productVariants)
							.set({ stock: sql`${productVariants.stock} - ${item.qty}` })
							.where(
								and(eq(productVariants.id, item.variantId), gte(productVariants.stock, item.qty))
							)
							.returning({ id: productVariants.id });

						if (updated.length === 0) {
							throw new OrderError(
								`Stok varian "${item.variantName ?? ''}" untuk "${product.name}" habis saat diproses.`
							);
						}
					}
				} else if (product.trackStock) {
					const updated = await tx
						.update(products)
						.set({ stock: sql`${products.stock} - ${item.qty}` })
						.where(and(eq(products.id, product.id), gte(products.stock, item.qty)))
						.returning({ id: products.id });

					if (updated.length === 0) {
						throw new OrderError(`Stok "${product.name}" habis saat diproses. Silakan coba lagi.`);
					}
				}
			}

			const expiresAt = new Date(Date.now() + ORDER_HOLD_TIMEOUT_MINUTES * 60 * 1000);

			const [order] = await tx
				.insert(orders)
				.values({
					orderId: generateOrderId(),
					accessToken: generateAccessToken(),
					handle: input.handle,
					email: input.email,
					note: input.note,
					address: input.address || '',
					phone: input.phone,
					subtotal,
					discountTotal,
					total,
					shippingType,
					shippingLabel: shipLabel,
					invoiceStatus: 'PENDING',
					paymentStatus: 'PENDING',
					expiresAt
				})
				.returning();

			logger.info('order.inserted', { orderId: order.orderId, total: order.total, expiresAt });

			await tx
				.insert(orderItems)
				.values(lineItems.map((item, idx) => ({ ...item, orderId: order.id, sortOrder: idx })));

			logger.info('order.items-inserted', { orderId: order.orderId, count: lineItems.length });

			return { orderId: order.orderId, accessToken: order.accessToken, expiresAt: order.expiresAt };
		})
	);
}

export async function submitPaymentProof(
	orderId: string,
	accessToken: string,
	payload: {
		proofUrl: string;
		proofPath: string;
		paymentMethod: string;
	}
) {
	return db.transaction(async (tx) => {
		const order = await tx.query.orders.findFirst({
			where: and(eq(orders.orderId, orderId), eq(orders.accessToken, accessToken))
		});

		if (!order) {
			throw new OrderError('Pesanan tidak ditemukan.');
		}

		if (
			order.paymentStatus === 'EXPIRED' ||
			(order.expiresAt && new Date() > order.expiresAt && order.paymentStatus === 'PENDING')
		) {
			throw new OrderError(
				'Batas waktu pembayaran pesanan ini telah habis. Silakan buat pesanan baru.'
			);
		}

		if (order.paymentStatus === 'CONFIRMED') {
			return order;
		}

		const [updated] = await tx
			.update(orders)
			.set({
				paymentProofUrl: payload.proofUrl,
				paymentProofPath: payload.proofPath,
				paymentMethod: payload.paymentMethod,
				paymentProofUploadedAt: new Date(),
				paymentStatus: 'WAITING_VERIFICATION'
			})
			.where(eq(orders.id, order.id))
			.returning();

		return updated;
	});
}

export async function verifyPaymentProof(orderId: string, isValid: boolean) {
	return db.transaction(async (tx) => {
		const order = await tx.query.orders.findFirst({
			where: eq(orders.orderId, orderId)
		});
		if (!order) throw new OrderError('Pesanan tidak ditemukan.');

		const nextStatus = isValid ? 'CONFIRMED' : 'PENDING';
		const [updated] = await tx
			.update(orders)
			.set({ paymentStatus: nextStatus })
			.where(eq(orders.id, order.id))
			.returning();

		return updated;
	});
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

	// Deteksi otomatis apakah pesanan pending telah melewati batas kedaluwarsa
	if (order.paymentStatus === 'PENDING' && order.expiresAt && new Date() > order.expiresAt) {
		await expireOrderAndRollbackStock(order.orderId);
		order.paymentStatus = 'EXPIRED';
	}

	const settings = (await db.query.storeSettings.findFirst({
		where: eq(storeSettings.id, 1)
	})) ?? {
		storeName: 'cho.lazey - CHIBICONXI CATALOGUE',
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

export async function expireAllOverdueOrdersAndRollbackStock(): Promise<number> {
	const overdueOrders = await db.query.orders.findMany({
		where: and(eq(orders.paymentStatus, 'PENDING'), sql`${orders.expiresAt} < NOW()`),
		columns: {
			orderId: true
		},
		limit: 50
	});

	if (overdueOrders.length === 0) return 0;

	let expiredCount = 0;
	for (const o of overdueOrders) {
		try {
			await expireOrderAndRollbackStock(o.orderId);
			expiredCount++;
		} catch (err) {
			logger.error('order.expire-single-failed', { orderId: o.orderId, error: err });
		}
	}

	if (expiredCount > 0) {
		logger.info('orders.sweeper.expired-batch', { count: expiredCount });
	}

	return expiredCount;
}

export async function expireOrderAndRollbackStock(orderId: string) {
	return db.transaction(async (tx) => {
		const order = await tx.query.orders.findFirst({
			where: eq(orders.orderId, orderId),
			with: {
				items: true
			}
		});

		if (!order) return null;

		// Jika sudah EXPIRED, CANCELLED, atau CONFIRMED, jangan rollback ganda
		if (
			order.paymentStatus === 'EXPIRED' ||
			order.paymentStatus === 'CANCELLED' ||
			order.paymentStatus === 'CONFIRMED'
		) {
			return order;
		}

		// Update status pesanan ke EXPIRED
		await tx
			.update(orders)
			.set({
				paymentStatus: 'EXPIRED',
				updatedAt: new Date()
			})
			.where(eq(orders.id, order.id));

		// Rollback stok tiap item ke inventaris
		for (const item of order.items) {
			if (!item.productId) continue;

			const product = await tx.query.products.findFirst({
				where: eq(products.id, item.productId),
				with: {
					variants: true
				}
			});

			if (!product) continue;

			if (item.variantNameSnapshot) {
				const trimmedSnapshot = item.variantNameSnapshot.trim().toLowerCase();
				const variant = product.variants.find(
					(v) => v.name.trim().toLowerCase() === trimmedSnapshot
				);
				const shouldTrack = product.trackStock && variant?.trackStock !== false;
				if (shouldTrack && variant) {
					await tx
						.update(productVariants)
						.set({ stock: sql`${productVariants.stock} + ${item.qty}` })
						.where(eq(productVariants.id, variant.id));
				}
			} else if (product.trackStock) {
				await tx
					.update(products)
					.set({ stock: sql`${products.stock} + ${item.qty}` })
					.where(eq(products.id, product.id));
			}
		}

		logger.info('order.expired.stock-rollbacked', {
			orderId: order.orderId,
			itemCount: order.items.length
		});

		return {
			...order,
			paymentStatus: 'EXPIRED' as const
		};
	});
}

export async function getOrderById(orderId: string) {
	const order = await db.query.orders.findFirst({
		where: eq(orders.orderId, orderId),
		with: {
			items: {
				orderBy: [asc(orderItems.sortOrder)]
			}
		}
	});

	if (!order) return null;

	// Deteksi otomatis jika waktu pembayaran sudah kedaluwarsa saat admin membuka detail
	if (order.paymentStatus === 'PENDING' && order.expiresAt && new Date() > order.expiresAt) {
		await expireOrderAndRollbackStock(order.orderId);
		order.paymentStatus = 'EXPIRED';
	}

	return order;
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
	paymentStatus: 'PENDING' | 'WAITING_VERIFICATION' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'
) {
	if (paymentStatus === 'CANCELLED') {
		await expireOrderAndRollbackStock(orderId);
		await db
			.update(orders)
			.set({ paymentStatus: 'CANCELLED', updatedAt: new Date() })
			.where(eq(orders.orderId, orderId));
		return;
	}

	// Jika admin menolak bukti bayar dan mengembalikan status ke PENDING,
	// perpanjang batas waktu kedaluwarsa 30 menit ke depan dan kosongkan foto bukti lama
	// agar pembeli memiliki waktu untuk mentransfer dan mengunggah ulang bukti baru.
	// Catatan: paymentProofUploadedAt TIDAK di-null kan agar sistem tetap mencatat bahwa
	// pesanan ini berstatus unggah ulang (re-upload).
	if (paymentStatus === 'PENDING') {
		const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
		await db
			.update(orders)
			.set({
				paymentStatus: 'PENDING',
				expiresAt: newExpiresAt,
				paymentProofUrl: null,
				paymentProofPath: null,
				updatedAt: new Date()
			})
			.where(eq(orders.orderId, orderId));
		return;
	}

	await db
		.update(orders)
		.set({ paymentStatus, updatedAt: new Date() })
		.where(eq(orders.orderId, orderId));
}

// ─────────────────────────────────────────────
// LIST + FILTER + PAGINATION (admin)
// ─────────────────────────────────────────────

export const ORDER_PER_PAGE = 7;
export const ORDER_EXPORT_LIMIT = 2000;

const INVOICE_FILTERS = ['PENDING', 'GENERATING', 'SENT', 'FAILED'] as const;
const PAYMENT_FILTERS = [
	'PENDING',
	'WAITING_VERIFICATION',
	'CONFIRMED',
	'CANCELLED',
	'EXPIRED'
] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface OrderListFilters {
	invoice?: string;
	payment?: string;
	q?: string;
	from?: string;
	to?: string;
	hideVoid?: string;
}

// Satu builder WHERE dipakai list + count + export — filter selalu konsisten.
function buildOrderConditions(f: OrderListFilters) {
	const cond = [];

	if (f.invoice && (INVOICE_FILTERS as readonly string[]).includes(f.invoice)) {
		cond.push(eq(orders.invoiceStatus, f.invoice as (typeof INVOICE_FILTERS)[number]));
	}

	if (f.payment && (PAYMENT_FILTERS as readonly string[]).includes(f.payment)) {
		cond.push(eq(orders.paymentStatus, f.payment as (typeof PAYMENT_FILTERS)[number]));
	} else if (f.hideVoid === 'true') {
		cond.push(notInArray(orders.paymentStatus, ['CANCELLED', 'EXPIRED']));
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

export interface DailySales {
	date: string;
	label: string;
	orders: number;
	revenue: number;
}

export interface DashboardStats {
	totalOrders: number;
	totalRevenue: number;
	todayOrders: number;
	todayRevenue: number;
	waitingVerificationCount: number;
	lowStockCount: number;
	byInvoice: { status: string; count: number }[];
	byPayment: { status: string; count: number }[];
	last7Days: DailySales[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
	const now = new Date();
	const sevenDaysAgo = new Date(now);
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
	sevenDaysAgo.setHours(0, 0, 0, 0);

	const [total, byInvoice, byPayment, lowStockRow, recentOrders] = await Promise.all([
		db.select({ orders: count(), revenue: sum(orders.total) }).from(orders),
		db
			.select({ status: orders.invoiceStatus, n: count() })
			.from(orders)
			.groupBy(orders.invoiceStatus),
		db
			.select({ status: orders.paymentStatus, n: count() })
			.from(orders)
			.groupBy(orders.paymentStatus),
		db
			.select({ n: count() })
			.from(products)
			.where(and(eq(products.trackStock, true), lte(products.stock, 3), eq(products.active, true))),
		db
			.select({ createdAt: orders.createdAt, total: orders.total })
			.from(orders)
			.where(gte(orders.createdAt, sevenDaysAgo))
	]);

	const days: DailySales[] = [];
	const dayMap = new Map<string, { orders: number; revenue: number }>();
	const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

	for (let i = 6; i >= 0; i--) {
		const d = new Date(now);
		d.setDate(d.getDate() - i);
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		const key = `${yyyy}-${mm}-${dd}`;
		const label = `${dayNames[d.getDay()]} (${dd})`;
		days.push({ date: key, label, orders: 0, revenue: 0 });
		dayMap.set(key, { orders: 0, revenue: 0 });
	}

	for (const o of recentOrders) {
		const d = new Date(o.createdAt);
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		const key = `${yyyy}-${mm}-${dd}`;
		const bucket = dayMap.get(key);
		if (bucket) {
			bucket.orders += 1;
			bucket.revenue += o.total;
		}
	}

	for (const day of days) {
		const bucket = dayMap.get(day.date);
		if (bucket) {
			day.orders = bucket.orders;
			day.revenue = bucket.revenue;
		}
	}

	const todayKey = days[days.length - 1]?.date;
	const todayBucket = todayKey ? dayMap.get(todayKey) : null;
	const waitingRow = byPayment.find((r) => r.status === 'WAITING_VERIFICATION');

	return {
		totalOrders: total[0]?.orders ?? 0,
		totalRevenue: Number(total[0]?.revenue ?? 0),
		todayOrders: todayBucket?.orders ?? 0,
		todayRevenue: todayBucket?.revenue ?? 0,
		waitingVerificationCount: waitingRow?.n ?? 0,
		lowStockCount: lowStockRow[0]?.n ?? 0,
		byInvoice: byInvoice.map((r) => ({ status: r.status, count: r.n })),
		byPayment: byPayment.map((r) => ({ status: r.status, count: r.n })),
		last7Days: days
	};
}
