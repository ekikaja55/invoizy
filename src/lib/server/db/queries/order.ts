import { db } from '$lib/server/db';
import { categories, products, orders, orderItems, storeSettings, paymentMethods, qrisCodes } from '$lib/server/db/schema';
import { eq, asc, and, gte, inArray, sql } from 'drizzle-orm';
import { generateOrderId, generateAccessToken } from '$lib/utils/order-id';
import { logger } from '$lib/server/logger';

export class OrderError extends Error {}

export interface CreateOrderInput {
  handle: string;
  email: string;
  note: string;
  items: { productId: string; qty: number }[];
  shippingId: string | null;
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
    const productIds = [
      ...new Set([
        ...input.items.map((i) => i.productId),
        ...(input.shippingId ? [input.shippingId] : [])
      ])
    ];

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

    let shipping = null;
    if (input.shippingId) {
      shipping = byId.get(input.shippingId);
      if (!shipping) {
        throw new OrderError('Opsi ongkir sudah dihapus. Silakan pilih ulang.');
      }
      if (!shipping.active) {
        throw new OrderError(`Opsi ongkir "${shipping.name}" sudah tidak tersedia.`);
      }
    }

    // ── Snapshot line item: nama & harga diambil dari DB, BUKAN dari client ──
    let subtotal = 0;
    const lineItems = input.items.map((item) => {
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

    let shippingPrice = 0;
    if (shipping) {
      shippingPrice = shipping.priceInt;
      lineItems.push({
        productId: shipping.id,
        categorySnapshot: shipping.category.name,
        nameSnapshot: shipping.name,
        priceSnapshot: shipping.priceInt,
        qty: 1,
        subtotal: shipping.priceInt
      });
    }

    const total = subtotal + shippingPrice;

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
        invoiceStatus: 'PENDING',
        paymentStatus: 'PENDING'
      })
      .returning();

    logger.info('order.inserted', { orderId: order.orderId, total: order.total });

    await tx.insert(orderItems).values(
      lineItems.map((item, idx) => ({ ...item, orderId: order.id, sortOrder: idx }))
    );

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
    paymentNote: ''
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
    .set(data)
    .where(eq(orders.orderId, orderId));
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
) {
  await db.update(orders).set({ paymentStatus }).where(eq(orders.orderId, orderId));
}
